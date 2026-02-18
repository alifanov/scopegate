"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { TabContentSkeleton } from "@/components/skeletons";
import { getProviderDisplayName } from "@/lib/provider-names";
import { PERMISSION_GROUPS } from "@/lib/mcp/permissions";
import { Plug, Unplug, ArrowLeft } from "lucide-react";
import { ServiceIcon } from "@/components/service-icons";
import { toast } from "sonner";

const API_KEY_PROVIDERS = new Set(["openRouter", "twitter"]);

const API_KEY_PLACEHOLDERS: Record<string, string> = {
  openRouter: "sk-or-...",
};

const API_KEY_HELP: Record<string, React.ReactNode> = {
  twitter: (
    <>
      Go to{" "}
      <a href="https://developer.x.com" target="_blank" rel="noopener noreferrer" className="underline text-foreground hover:text-foreground/80">
        developer.x.com
      </a>
      , create a project &amp; app, then go to the &quot;Keys and Tokens&quot; tab. You need all 4 values: the API Key &amp; Secret (under Consumer Keys) and the Access Token &amp; Secret (under Authentication Tokens). Make sure your app has Read and Write permissions.
    </>
  ),
};

interface Service {
  id: string;
  provider: string;
  accountEmail: string;
  expiresAt: string | null;
  createdAt: string;
  _count: { mcpEndpoints: number };
}

export function ServicesTab({ projectId }: { projectId: string }) {
  const searchParams = useSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [serviceToDisconnect, setServiceToDisconnect] = useState<string | null>(null);

  // API key form state
  const [apiKeyProvider, setApiKeyProvider] = useState<string | null>(null);
  const [apiKeyValue, setApiKeyValue] = useState("");
  const [apiKeyLabel, setApiKeyLabel] = useState("");
  const [apiKeySubmitting, setApiKeySubmitting] = useState(false);

  // Twitter OAuth 1.0a fields
  const [twitterApiKey, setTwitterApiKey] = useState("");
  const [twitterApiSecret, setTwitterApiSecret] = useState("");
  const [twitterAccessToken, setTwitterAccessToken] = useState("");
  const [twitterAccessTokenSecret, setTwitterAccessTokenSecret] = useState("");

  useEffect(() => {
    if (searchParams.get("error") === "oauth_failed") {
      toast.error("Failed to connect service. Please try again.");
    }
  }, [searchParams]);

  useEffect(() => {
    loadServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function loadServices() {
    try {
      const res = await fetch(`/api/projects/${projectId}/services`);
      if (res.ok) {
        const data = await res.json();
        setServices(data.services || []);
      }
    } catch {
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  }

  function handleConnect(providerKey: string) {
    if (API_KEY_PROVIDERS.has(providerKey)) {
      setApiKeyProvider(providerKey);
    } else {
      window.location.href = `/api/oauth/google?projectId=${projectId}&provider=${providerKey}`;
    }
  }

  function resetApiKeyForm() {
    setApiKeyProvider(null);
    setApiKeyValue("");
    setApiKeyLabel("");
    setApiKeySubmitting(false);
    setTwitterApiKey("");
    setTwitterApiSecret("");
    setTwitterAccessToken("");
    setTwitterAccessTokenSecret("");
  }

  function handleDialogClose(open: boolean) {
    setDialogOpen(open);
    if (!open) resetApiKeyForm();
  }

  async function handleApiKeySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKeyProvider) return;

    const isTwitter = apiKeyProvider === "twitter";
    if (isTwitter) {
      if (!twitterApiKey.trim() || !twitterApiSecret.trim() || !twitterAccessToken.trim() || !twitterAccessTokenSecret.trim()) return;
    } else {
      if (!apiKeyValue.trim()) return;
    }

    setApiKeySubmitting(true);
    try {
      const payload = isTwitter
        ? {
            provider: apiKeyProvider,
            twitterApiKey: twitterApiKey.trim(),
            twitterApiSecret: twitterApiSecret.trim(),
            twitterAccessToken: twitterAccessToken.trim(),
            twitterAccessTokenSecret: twitterAccessTokenSecret.trim(),
            label: apiKeyLabel.trim() || undefined,
          }
        : {
            provider: apiKeyProvider,
            apiKey: apiKeyValue.trim(),
            label: apiKeyLabel.trim() || undefined,
          };

      const res = await fetch(
        `/api/projects/${projectId}/services/connect-api-key`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        toast.success("Service connected successfully.");
        setDialogOpen(false);
        resetApiKeyForm();
        loadServices();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to connect service.");
      }
    } catch {
      toast.error("Failed to connect service.");
    } finally {
      setApiKeySubmitting(false);
    }
  }

  function askDisconnect(serviceId: string) {
    setServiceToDisconnect(serviceId);
    setConfirmOpen(true);
  }

  async function handleDisconnect() {
    if (!serviceToDisconnect) return;
    setDisconnecting(serviceToDisconnect);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/services?serviceId=${serviceToDisconnect}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setServices((prev) => prev.filter((s) => s.id !== serviceToDisconnect));
        toast.success("Service disconnected.");
      } else {
        toast.error("Failed to disconnect service.");
      }
    } catch {
      toast.error("Failed to disconnect service.");
    } finally {
      setDisconnecting(null);
      setConfirmOpen(false);
      setServiceToDisconnect(null);
    }
  }

  if (loading) return <TabContentSkeleton />;

  const providers = Object.entries(PERMISSION_GROUPS).map(([key, group]) => ({
    key,
    name: group.name,
    description: group.description,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={() => setDialogOpen(true)}><Plug className="size-4" />Connect Service</Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {apiKeyProvider
                ? `Connect ${getProviderDisplayName(apiKeyProvider)}`
                : "Connect a Service"}
            </DialogTitle>
            <DialogDescription>
              {apiKeyProvider
                ? apiKeyProvider === "twitter"
                  ? "Enter your OAuth 1.0a credentials to connect Twitter."
                  : "Enter your API key to connect this service."
                : "Choose a service to connect to this project."}
            </DialogDescription>
          </DialogHeader>

          {apiKeyProvider ? (
            <form onSubmit={handleApiKeySubmit} className="space-y-4">
              <button
                type="button"
                onClick={resetApiKeyForm}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-3" />
                Back to services
              </button>

              {apiKeyProvider && API_KEY_HELP[apiKeyProvider] && (
                <p className="text-sm text-muted-foreground bg-muted rounded-md p-3">
                  {API_KEY_HELP[apiKeyProvider]}
                </p>
              )}

              {apiKeyProvider === "twitter" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="twitter-api-key">API Key</Label>
                    <Input
                      id="twitter-api-key"
                      type="password"
                      placeholder="Consumer API Key"
                      value={twitterApiKey}
                      onChange={(e) => setTwitterApiKey(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter-api-secret">API Key Secret</Label>
                    <Input
                      id="twitter-api-secret"
                      type="password"
                      placeholder="Consumer API Key Secret"
                      value={twitterApiSecret}
                      onChange={(e) => setTwitterApiSecret(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter-access-token">Access Token</Label>
                    <Input
                      id="twitter-access-token"
                      type="password"
                      placeholder="OAuth 1.0a Access Token"
                      value={twitterAccessToken}
                      onChange={(e) => setTwitterAccessToken(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter-access-token-secret">Access Token Secret</Label>
                    <Input
                      id="twitter-access-token-secret"
                      type="password"
                      placeholder="OAuth 1.0a Access Token Secret"
                      value={twitterAccessTokenSecret}
                      onChange={(e) => setTwitterAccessTokenSecret(e.target.value)}
                      required
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder={apiKeyProvider ? (API_KEY_PLACEHOLDERS[apiKeyProvider] ?? "API key") : "API key"}
                    value={apiKeyValue}
                    onChange={(e) => setApiKeyValue(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="api-key-label">Label (optional)</Label>
                <Input
                  id="api-key-label"
                  type="text"
                  placeholder="e.g. Production Key"
                  value={apiKeyLabel}
                  onChange={(e) => setApiKeyLabel(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={apiKeySubmitting || (apiKeyProvider === "twitter"
                  ? !twitterApiKey.trim() || !twitterApiSecret.trim() || !twitterAccessToken.trim() || !twitterAccessTokenSecret.trim()
                  : !apiKeyValue.trim())}
              >
                {apiKeySubmitting ? "Validating..." : "Connect"}
              </Button>
            </form>
          ) : (
            <div className="space-y-2">
              {providers.map((provider) => (
                <button
                  key={provider.key}
                  onClick={() => handleConnect(provider.key)}
                  className="flex w-full cursor-pointer items-center gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-muted"
                >
                  <ServiceIcon provider={provider.key} className="size-8 shrink-0" />
                  <div>
                    <div className="font-medium">{provider.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {provider.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Disconnect Service"
        description="Are you sure you want to disconnect this service? Any endpoints using it will stop working."
        confirmText="Disconnect"
        loadingText="Disconnecting..."
        variant="destructive"
        onConfirm={handleDisconnect}
        loading={disconnecting !== null}
      />

      {services.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No services connected</CardTitle>
            <CardDescription>
              Click &quot;Connect Service&quot; to link a service to this
              project.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {services.map((service) => (
            <Card key={service.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ServiceIcon provider={service.provider} className="size-8 shrink-0" />
                    <div>
                      <CardTitle>
                        {getProviderDisplayName(service.provider)}
                      </CardTitle>
                      <CardDescription>{service.accountEmail}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {service._count.mcpEndpoints} endpoint(s)
                    </Badge>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={disconnecting === service.id}
                      onClick={() => askDisconnect(service.id)}
                    >
                      <Unplug className="size-4" />
                      {disconnecting === service.id
                        ? "Disconnecting..."
                        : "Disconnect"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Connected {new Date(service.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
