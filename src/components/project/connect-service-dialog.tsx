"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plug } from "lucide-react";
import { ServiceIcon } from "@/components/service-icons";
import { getProviderDisplayName } from "@/lib/provider-names";
import { PERMISSION_GROUPS } from "@/lib/mcp/permissions";
import { getConnectTarget, getCredentialGroup } from "@/lib/provider-registry";
import { ConnectApiKeyForm } from "@/components/project/connect-api-key-form";
import { ConnectEmailForm } from "@/components/project/connect-email-form";
import { ConnectOAuthAppForm } from "@/components/project/connect-oauth-app-form";
import type { OAuthApp } from "@/components/project/use-project-services";

function hasOwnApp(providerKey: string, oauthApps: OAuthApp[]): boolean {
  const group = getCredentialGroup(providerKey);
  return group !== null && oauthApps.some((app) => app.appGroup === group);
}

interface ConnectServiceDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cloud: boolean;
  oauthApps: OAuthApp[];
  redirectUriTemplate: string;
  /** A service connected or an OAuth app saved — reload the services list. */
  onConnected: () => void;
  /** Set by the parent to connect/reconnect one specific provider — e.g. the
   * Reconnect button on an existing service. Resolved once (redirects away,
   * or opens straight to the right form) and cleared via onRequestHandled. */
  requestedProvider?: string | null;
  onRequestHandled?: () => void;
}

export function ConnectServiceDialog({
  projectId,
  open,
  onOpenChange,
  cloud,
  oauthApps,
  redirectUriTemplate,
  onConnected,
  requestedProvider,
  onRequestHandled,
}: ConnectServiceDialogProps) {
  const [providerSearch, setProviderSearch] = useState("");
  const [emailFormOpen, setEmailFormOpen] = useState(false);
  const [apiKeyProvider, setApiKeyProvider] = useState<string | null>(null);
  const [oauthAppProvider, setOauthAppProvider] = useState<string | null>(null);

  const connectToProvider = useCallback(
    (providerKey: string) => {
      const target = getConnectTarget(providerKey, projectId, {
        cloud,
        hasOwnApp: hasOwnApp(providerKey, oauthApps),
      });
      if (target.kind === "redirect") {
        window.location.href = target.url;
        return;
      }
      if (target.dialog === "email") setEmailFormOpen(true);
      else if (target.dialog === "oauthApp") setOauthAppProvider(providerKey);
      else setApiKeyProvider(providerKey);
      onOpenChange(true);
    },
    [projectId, cloud, oauthApps, onOpenChange]
  );

  useEffect(() => {
    if (!requestedProvider) return;
    connectToProvider(requestedProvider);
    onRequestHandled?.();
    // Only re-run when the parent actually asks for a new provider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedProvider]);

  function backToList() {
    setApiKeyProvider(null);
    setOauthAppProvider(null);
    setEmailFormOpen(false);
  }

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      backToList();
      setProviderSearch("");
    }
  }

  function handleFormConnected() {
    handleOpenChange(false);
    onConnected();
  }

  const oauthAppGroup = oauthAppProvider ? getCredentialGroup(oauthAppProvider) : null;
  const oauthRedirectUri = oauthAppProvider
    ? redirectUriTemplate.replace("{group}", oauthAppGroup ?? "")
    : "";

  const providers = Object.entries(PERMISSION_GROUPS).map(([key, group]) => ({
    key,
    name: group.name,
    description: group.description,
  }));
  const filteredProviders = providerSearch.trim()
    ? providers.filter((provider) =>
        provider.name.toLowerCase().includes(providerSearch.trim().toLowerCase())
      )
    : providers;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {emailFormOpen
              ? "Connect Email (IMAP/SMTP)"
              : oauthAppProvider
                ? `Your OAuth app for ${getProviderDisplayName(oauthAppProvider)}`
                : apiKeyProvider
                  ? `Connect ${getProviderDisplayName(apiKeyProvider)}`
                  : "Connect a Service"}
          </DialogTitle>
          <DialogDescription>
            {emailFormOpen
              ? "Enter your email server credentials to connect."
              : oauthAppProvider
                ? "This provider requires an OAuth application you own. It is used for every service in the same group, so you only enter it once."
                : apiKeyProvider
                  ? "Enter your API key to connect this service."
                  : "Choose a service to connect to this project."}
          </DialogDescription>
        </DialogHeader>

        {oauthAppProvider ? (
          <ConnectOAuthAppForm
            projectId={projectId}
            provider={oauthAppProvider}
            cloud={cloud}
            redirectUri={oauthRedirectUri}
            onBack={backToList}
            onSaved={handleFormConnected}
          />
        ) : emailFormOpen ? (
          <ConnectEmailForm projectId={projectId} onBack={backToList} onConnected={handleFormConnected} />
        ) : apiKeyProvider ? (
          <ConnectApiKeyForm
            projectId={projectId}
            provider={apiKeyProvider}
            onBack={backToList}
            onConnected={handleFormConnected}
          />
        ) : (
          <div className="space-y-3">
            <Input
              type="search"
              placeholder="Search services…"
              value={providerSearch}
              onChange={(e) => setProviderSearch(e.target.value)}
              aria-label="Search services"
            />
            <div className="max-h-[60vh] overflow-y-auto">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead className="w-24">Auth</TableHead>
                    <TableHead className="w-14" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProviders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground whitespace-normal">
                        No services match &quot;{providerSearch}&quot;.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProviders.map((provider) => (
                      <TableRow
                        key={provider.key}
                        className="cursor-pointer"
                        title={provider.description}
                        onClick={() => connectToProvider(provider.key)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-0">
                            <ServiceIcon provider={provider.key} className="size-5 shrink-0" />
                            <span className="font-medium truncate">{provider.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {(() => {
                              const target = getConnectTarget(provider.key, projectId);
                              return target.kind === "redirect"
                                ? "OAuth"
                                : target.dialog === "email"
                                  ? "IMAP"
                                  : "API Key";
                            })()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" aria-label={`Connect ${provider.name}`}>
                            <Plug className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
