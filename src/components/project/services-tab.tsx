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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CreateEndpointDialog } from "@/components/project/create-endpoint-dialog";
import { TabContentSkeleton } from "@/components/skeletons";
import { getProviderDisplayName } from "@/lib/provider-names";
import { PERMISSION_GROUPS } from "@/lib/mcp/permissions";
import { getConnectTarget, getCredentialGroup } from "@/lib/provider-registry";
import { Plug, Unplug, ArrowLeft, RefreshCw, AlertTriangle, XCircle, Plus } from "lucide-react";
import { ServiceIcon } from "@/components/service-icons";
import { toast } from "sonner";
import { apiGet, apiSend, ApiError } from "@/lib/api-client";

const API_KEY_PLACEHOLDERS: Record<string, string> = {
  openRouter: "sk-or-...",
  stripe: "sk_live_... or sk_test_...",
  airtable: "pat...",
  calendly: "eyJ...",
  telegram: "123456:ABC-DEF...",
  semrush: "API key",
  ahrefs: "API key",
};

const API_KEY_HELP: Record<string, React.ReactNode> = {};

// How to obtain a client ID / secret, per credential group (one app covers the
// whole group). Keyed by getCredentialGroup() — i.e. ProviderDef.connect.startRoute.
// ponytail: plain data, kept next to the dialog that renders it.
const OAUTH_APP_SETUP: Record<string, { console: string; consoleLabel: string; steps: string[] }> = {
  google: {
    console: "https://console.cloud.google.com/apis/credentials",
    consoleLabel: "Google Cloud Console",
    steps: [
      "APIs & Services → OAuth consent screen. With a Workspace organisation pick user type Internal — it skips verification entirely and its refresh tokens never expire.",
      "Enable the APIs you plan to use: Gmail, Calendar, Drive, Google Ads, Search Console, YouTube Data v3, Tag Manager.",
      "Credentials → Create credentials → OAuth client ID → Web application.",
      "Add the redirect URI above under Authorised redirect URIs, then save.",
      "Copy Client ID and Client secret into the fields below.",
    ],
  },
  meta: {
    console: "https://developers.facebook.com/apps",
    consoleLabel: "Meta for Developers",
    steps: [
      "Create app → type Business, then add the Marketing API product.",
      "Products → Facebook Login → Settings → add the redirect URI above to Valid OAuth Redirect URIs.",
      "Settings → Basic: copy App ID → Client ID, App secret → Client Secret.",
      "Development mode is enough while you use your own ad accounts; App Review is only needed for other people's.",
    ],
  },
  instagram: {
    console: "https://developers.facebook.com/apps",
    consoleLabel: "Meta for Developers",
    steps: [
      "Create a separate app and add the Instagram product (it cannot share the Meta Ads app).",
      "Instagram → API setup → add the redirect URI above to the OAuth redirect URIs.",
      "Copy Instagram App ID → Client ID, Instagram App Secret → Client Secret.",
    ],
  },
  threads: {
    console: "https://developers.facebook.com/apps",
    consoleLabel: "Meta for Developers",
    steps: [
      "Create a separate app and add the Threads API product (its own app, not the Meta Ads one).",
      "Threads → Settings → add the redirect URI above to Redirect Callback URLs.",
      "Copy Threads App ID → Client ID, Threads App Secret → Client Secret.",
    ],
  },
  linkedin: {
    console: "https://www.linkedin.com/developers/apps",
    consoleLabel: "LinkedIn Developers",
    steps: [
      "Create app, link it to a LinkedIn Page and verify the page.",
      "Products → request Sign In with LinkedIn using OpenID Connect (instant) and Share on LinkedIn if you want to post.",
      "Auth → Authorized redirect URLs → add the redirect URI above.",
      "Copy Client ID and Primary Client Secret from the Auth tab.",
    ],
  },
  twitter: {
    console: "https://developer.x.com/en/portal/dashboard",
    consoleLabel: "X Developer Portal",
    steps: [
      "Create a project and an app (write access needs a paid API tier).",
      "App settings → User authentication settings → enable OAuth 2.0, type Web App / Automated App or Bot.",
      "Add the redirect URI above as the Callback URI, plus any website URL.",
      "Copy the OAuth 2.0 Client ID and Client Secret shown after saving.",
    ],
  },
  github: {
    console: "https://github.com/settings/developers",
    consoleLabel: "GitHub Developer settings",
    steps: [
      "OAuth Apps → New OAuth App.",
      "Authorization callback URL → paste the redirect URI above.",
      "Copy the Client ID, then Generate a new client secret and copy it.",
    ],
  },
  slack: {
    console: "https://api.slack.com/apps",
    consoleLabel: "Slack API",
    steps: [
      "Create New App → From scratch, pick your workspace.",
      "OAuth & Permissions → Redirect URLs → add the redirect URI above.",
      "Add the bot/user scopes you need, then install the app to the workspace.",
      "Basic Information → App Credentials: copy Client ID and Client Secret.",
    ],
  },
  notion: {
    console: "https://www.notion.so/my-integrations",
    consoleLabel: "Notion integrations",
    steps: [
      "New integration → type Public (a private integration has no OAuth flow).",
      "Fill in the required organisation name and URLs, add the redirect URI above.",
      "Copy the OAuth client ID and client secret from Secrets.",
    ],
  },
  hubspot: {
    console: "https://developers.hubspot.com/",
    consoleLabel: "HubSpot developer account",
    steps: [
      "Create a developer account, then Apps → Create app.",
      "Auth tab → add the redirect URI above and select the scopes you need.",
      "Copy Client ID and Client secret from the same Auth tab.",
    ],
  },
  jira: {
    console: "https://developer.atlassian.com/console/myapps/",
    consoleLabel: "Atlassian Developer Console",
    steps: [
      "Create → OAuth 2.0 integration.",
      "Permissions → add Jira API and the scopes you need.",
      "Authorization → OAuth 2.0 (3LO) → set the Callback URL to the redirect URI above.",
      "Settings → copy Client ID and Secret.",
    ],
  },
  salesforce: {
    console: "https://login.salesforce.com/",
    consoleLabel: "Salesforce Setup",
    steps: [
      "Setup → App Manager → New Connected App, enable OAuth settings.",
      "Callback URL → paste the redirect URI above; add the scopes api and refresh_token.",
      "After saving, Manage Consumer Details: Consumer Key → Client ID, Consumer Secret → Client Secret.",
    ],
  },
};

interface Service {
  id: string;
  provider: string;
  accountEmail: string;
  metadata: Record<string, unknown> | null;
  expiresAt: string | null;
  status: string;
  lastError: string | null;
  createdAt: string;
  _count: { mcpEndpoints: number };
}

type OAuthApp = { appGroup: string; clientId: string; redirectUri: string };

export function ServicesTab({ projectId }: { projectId: string }) {
  const searchParams = useSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [serviceToDisconnect, setServiceToDisconnect] = useState<string | null>(null);
  const [providerSearch, setProviderSearch] = useState("");

  // Add-MCP-endpoint dialog state
  const [mcpServiceId, setMcpServiceId] = useState<string | null>(null);

  // API key form state
  const [apiKeyProvider, setApiKeyProvider] = useState<string | null>(null);
  const [apiKeyValue, setApiKeyValue] = useState("");
  const [apiKeyLabel, setApiKeyLabel] = useState("");
  const [apiKeySubmitting, setApiKeySubmitting] = useState(false);

  // BYO OAuth app state — which credential groups this project has registered,
  // and whether this deployment is the cloud (where they are mandatory for
  // every OAuth provider).
  const [cloud, setCloud] = useState(false);
  const [oauthApps, setOauthApps] = useState<OAuthApp[]>([]);
  const [redirectUriTemplate, setRedirectUriTemplate] = useState("");
  const [oauthAppProvider, setOauthAppProvider] = useState<string | null>(null);
  const [oauthAppForm, setOauthAppForm] = useState({ clientId: "", clientSecret: "" });
  const [oauthAppSubmitting, setOauthAppSubmitting] = useState(false);

  // Email form state
  const [emailFormOpen, setEmailFormOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({
    email: "",
    password: "",
    imapHost: "",
    imapPort: "993",
    smtpHost: "",
    smtpPort: "465",
  });
  const [emailSubmitting, setEmailSubmitting] = useState(false);


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
    setError(null);
    try {
      const [data, appData] = await Promise.all([
        apiGet<{ services: Service[] }>(`/api/projects/${projectId}/services`),
        apiGet<{ cloud: boolean; redirectUriTemplate: string; apps: OAuthApp[] }>(
          `/api/projects/${projectId}/oauth-apps`
        ),
      ]);
      setServices(data.services || []);
      setCloud(appData.cloud);
      setOauthApps(appData.apps || []);
      setRedirectUriTemplate(appData.redirectUriTemplate ?? "");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load services");
    } finally {
      setLoading(false);
    }
  }

  function hasOwnApp(providerKey: string): boolean {
    const group = getCredentialGroup(providerKey);
    return group !== null && oauthApps.some((app) => app.appGroup === group);
  }

  function openTarget(providerKey: string, onDialog: () => void) {
    const target = getConnectTarget(providerKey, projectId, {
      cloud,
      hasOwnApp: hasOwnApp(providerKey),
    });
    if (target.kind === "dialog") {
      if (target.dialog === "email") setEmailFormOpen(true);
      else if (target.dialog === "oauthApp") setOauthAppProvider(providerKey);
      else setApiKeyProvider(providerKey);
      onDialog();
    } else {
      window.location.href = target.url;
    }
  }

  function handleConnect(providerKey: string) {
    openTarget(providerKey, () => {});
  }

  function resetEmailForm() {
    setEmailFormOpen(false);
    setEmailForm({ email: "", password: "", imapHost: "", imapPort: "993", smtpHost: "", smtpPort: "465" });
    setEmailSubmitting(false);
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailForm.email || !emailForm.password || !emailForm.imapHost || !emailForm.smtpHost) return;

    setEmailSubmitting(true);
    try {
      await apiSend(`/api/projects/${projectId}/services/connect-email`, "POST", {
        email: emailForm.email.trim(),
        password: emailForm.password,
        imapHost: emailForm.imapHost.trim(),
        imapPort: parseInt(emailForm.imapPort) || 993,
        smtpHost: emailForm.smtpHost.trim(),
        smtpPort: parseInt(emailForm.smtpPort) || 465,
      });
      toast.success("Email connected successfully.");
      setDialogOpen(false);
      resetEmailForm();
      loadServices();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to connect email.");
    } finally {
      setEmailSubmitting(false);
    }
  }

  function handleReconnect(service: Service) {
    setReconnecting(service.id);
    openTarget(service.provider, () => {
      setDialogOpen(true);
      setReconnecting(null);
    });
  }

  function resetApiKeyForm() {
    setApiKeyProvider(null);
    setApiKeyValue("");
    setApiKeyLabel("");
    setApiKeySubmitting(false);
  }

  function resetOAuthAppForm() {
    setOauthAppProvider(null);
    setOauthAppForm({ clientId: "", clientSecret: "" });
    setOauthAppSubmitting(false);
  }

  function handleDialogClose(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      resetApiKeyForm();
      resetEmailForm();
      resetOAuthAppForm();
      setProviderSearch("");
    }
  }

  async function handleApiKeySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKeyProvider) return;
    if (!apiKeyValue.trim()) return;

    setApiKeySubmitting(true);
    try {
      const payload = {
        provider: apiKeyProvider,
        apiKey: apiKeyValue.trim(),
        label: apiKeyLabel.trim() || undefined,
      };

      await apiSend(`/api/projects/${projectId}/services/connect-api-key`, "POST", payload);
      toast.success("Service connected successfully.");
      setDialogOpen(false);
      resetApiKeyForm();
      loadServices();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to connect service.");
    } finally {
      setApiKeySubmitting(false);
    }
  }

  async function handleOAuthAppSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!oauthAppProvider) return;
    const appGroup = getCredentialGroup(oauthAppProvider);
    if (!appGroup) return;

    setOauthAppSubmitting(true);
    try {
      await apiSend(`/api/projects/${projectId}/oauth-apps`, "POST", {
        appGroup,
        clientId: oauthAppForm.clientId,
        clientSecret: oauthAppForm.clientSecret,
      });
      // Straight on to the provider consent screen — the credentials were only
      // ever a prerequisite for this redirect, so do not make the user find the
      // Connect button again.
      const target = getConnectTarget(oauthAppProvider, projectId, {
        cloud,
        hasOwnApp: true,
      });
      if (target.kind === "redirect") {
        window.location.href = target.url;
        return;
      }
      resetOAuthAppForm();
      loadServices();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save credentials.");
      setOauthAppSubmitting(false);
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
      await apiSend(`/api/projects/${projectId}/services?serviceId=${serviceToDisconnect}`, "DELETE");
      setServices((prev) => prev.filter((s) => s.id !== serviceToDisconnect));
      toast.success("Service disconnected.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to disconnect service.");
    } finally {
      setDisconnecting(null);
      setConfirmOpen(false);
      setServiceToDisconnect(null);
    }
  }

  if (loading) return <TabContentSkeleton />;

  // Server-derived (from BETTER_AUTH_URL) so it matches byte-for-byte what
  // the callback will send. window.location.origin would drift behind a proxy.
  const oauthAppGroup = oauthAppProvider ? getCredentialGroup(oauthAppProvider) : null;
  const oauthRedirectUri = oauthAppProvider
    ? redirectUriTemplate.replace("{group}", oauthAppGroup ?? "")
    : "";
  const oauthAppSetup = oauthAppGroup ? OAUTH_APP_SETUP[oauthAppGroup] : undefined;

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
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={() => setDialogOpen(true)}><Plug className="size-4" />Connect Service</Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
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
            <form onSubmit={handleOAuthAppSubmit} className="space-y-4">
              <button
                type="button"
                onClick={resetOAuthAppForm}
                className="flex cursor-pointer items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-3" />
                Back to services
              </button>

              <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                Register an OAuth application with the provider, then paste its
                credentials here. Add the redirect URI below to the app first —
                without it the provider rejects the sign-in with
                <code className="mx-1">redirect_uri_mismatch</code>.
              </div>

              <div className="space-y-2">
                <Label>Redirect URI (add this to your app)</Label>
                <div className="flex gap-2">
                  <Input readOnly value={oauthRedirectUri} className="font-mono text-xs" />
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => {
                      navigator.clipboard.writeText(oauthRedirectUri);
                      toast.success("Redirect URI copied.");
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              {oauthAppSetup ? (
                <div className="space-y-2">
                  <Label>How to get these credentials</Label>
                  <ol className="list-decimal space-y-1.5 rounded-md border p-3 pl-8 text-sm text-muted-foreground">
                    {oauthAppSetup.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                  <a
                    href={oauthAppSetup.console}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-sm text-primary underline underline-offset-4"
                  >
                    Open {oauthAppSetup.consoleLabel} →
                  </a>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="oauth-client-id">Client ID</Label>
                <Input
                  id="oauth-client-id"
                  value={oauthAppForm.clientId}
                  onChange={(e) => setOauthAppForm((f) => ({ ...f, clientId: e.target.value }))}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="oauth-client-secret">Client Secret</Label>
                <Input
                  id="oauth-client-secret"
                  type="password"
                  value={oauthAppForm.clientSecret}
                  onChange={(e) => setOauthAppForm((f) => ({ ...f, clientSecret: e.target.value }))}
                  required
                />
              </div>

              <Button type="submit" className="w-full cursor-pointer" disabled={oauthAppSubmitting}>
                {oauthAppSubmitting ? "Saving…" : "Save and continue"}
              </Button>
            </form>
          ) : emailFormOpen ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <button
                type="button"
                onClick={resetEmailForm}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-3" />
                Back to services
              </button>

              <div className="space-y-2">
                <Label htmlFor="email-address">Email Address</Label>
                <Input
                  id="email-address"
                  type="email"
                  placeholder="you@yourdomain.com"
                  value={emailForm.email}
                  onChange={(e) => setEmailForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-password">Password</Label>
                <Input
                  id="email-password"
                  type="password"
                  placeholder="Email password or app password"
                  value={emailForm.password}
                  onChange={(e) => setEmailForm((f) => ({ ...f, password: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="imap-host">IMAP Host</Label>
                  <Input
                    id="imap-host"
                    type="text"
                    placeholder="imap.yourdomain.com"
                    value={emailForm.imapHost}
                    onChange={(e) => setEmailForm((f) => ({ ...f, imapHost: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imap-port">IMAP Port</Label>
                  <Input
                    id="imap-port"
                    type="number"
                    placeholder="993"
                    value={emailForm.imapPort}
                    onChange={(e) => setEmailForm((f) => ({ ...f, imapPort: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input
                    id="smtp-host"
                    type="text"
                    placeholder="smtp.yourdomain.com"
                    value={emailForm.smtpHost}
                    onChange={(e) => setEmailForm((f) => ({ ...f, smtpHost: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    placeholder="465"
                    value={emailForm.smtpPort}
                    onChange={(e) => setEmailForm((f) => ({ ...f, smtpPort: e.target.value }))}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={emailSubmitting || !emailForm.email || !emailForm.password || !emailForm.imapHost || !emailForm.smtpHost}
              >
                {emailSubmitting ? "Connecting..." : "Connect"}
              </Button>
            </form>
          ) : apiKeyProvider ? (
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
                disabled={apiKeySubmitting || !apiKeyValue.trim()}
              >
                {apiKeySubmitting ? "Validating..." : "Connect"}
              </Button>
            </form>
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
                          onClick={() => handleConnect(provider.key)}
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

      <CreateEndpointDialog
        projectId={projectId}
        open={mcpServiceId !== null}
        onOpenChange={(open) => !open && setMcpServiceId(null)}
        onCreated={loadServices}
        initialServiceId={mcpServiceId ?? undefined}
      />

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

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Failed to load services</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={loadServices}>Retry</Button>
          </CardContent>
        </Card>
      ) : services.length === 0 ? (
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
                      <CardDescription>
                        {service.accountEmail}
                        {service.provider === "googleAds" && Boolean(service.metadata?.googleAdsCustomerName) && (
                          <span className="block">
                            {service.metadata!.googleAdsCustomerName as string}
                            {Boolean(service.metadata!.googleAdsCustomerId) && (
                              <span className="text-muted-foreground/70"> · ID: {service.metadata!.googleAdsCustomerId as string}</span>
                            )}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {service.status === "expired" && (
                      <Badge
                        variant="outline"
                        className="border-yellow-500 text-yellow-600 dark:text-yellow-400"
                        title={service.lastError || "Token expired"}
                      >
                        <AlertTriangle className="size-3 mr-1" />
                        Token Expired
                      </Badge>
                    )}
                    {service.status === "error" && (
                      <Badge
                        variant="outline"
                        className="border-red-500 text-red-600 dark:text-red-400"
                        title={service.lastError || "Connection error"}
                      >
                        <XCircle className="size-3 mr-1" />
                        Error
                      </Badge>
                    )}
                    <Badge variant="secondary">
                      {service._count.mcpEndpoints} endpoint(s)
                    </Badge>
                    {service._count.mcpEndpoints === 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMcpServiceId(service.id)}
                      >
                        <Plus className="size-4" />
                        Add MCP
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={reconnecting === service.id}
                      onClick={() => handleReconnect(service)}
                    >
                      <RefreshCw className={`size-4 ${reconnecting === service.id ? "animate-spin" : ""}`} />
                      {reconnecting === service.id
                        ? "Reconnecting..."
                        : "Reconnect"}
                    </Button>
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
