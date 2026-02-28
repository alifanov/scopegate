"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Copy, Check, Pencil, Eye, EyeOff, RefreshCw, Shield, Power, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EditPermissionsDialog } from "@/components/project/edit-permissions-dialog";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { EndpointDetailSkeleton } from "@/components/skeletons";
import { useProject } from "@/components/project/project-context";
import { getProviderDisplayName } from "@/lib/provider-names";
import { ServiceIcon } from "@/components/service-icons";

interface EndpointDetails {
  id: string;
  name: string;
  apiKey: string;
  isActive: boolean;
  rateLimitPerMinute: number;
  serviceConnection: { provider: string; accountEmail: string };
  permissions: { id: string; action: string }[];
  _count: { auditLogs: number };
  createdAt: string;
}

export default function EndpointDetailPage() {
  const { projectId, endpointId } = useParams<{
    projectId: string;
    endpointId: string;
  }>();
  const router = useRouter();
  const { project: projectCtx, setProject } = useProject();
  const [endpoint, setEndpoint] = useState<EndpointDetails | null>(null);
  const [projectName, setProjectName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showKey, setShowKey] = useState(false);

  // Confirm dialogs
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggleOpen, setToggleOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Rename
  const [renaming, setRenaming] = useState(false);
  const [editName, setEditName] = useState("");
  const [editingName, setEditingName] = useState(false);

  // Edit permissions
  const [permDialogOpen, setPermDialogOpen] = useState(false);

  useEffect(() => {
    loadEndpoint();
    // Load project context if not set
    if (!projectCtx) {
      fetch(`/api/projects/${projectId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.project) {
            setProjectName(data.project.name);
            setProject({
              projectId: data.project.id,
              projectName: data.project.name,
            });
          }
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, endpointId]);

  async function loadEndpoint() {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/endpoints/${endpointId}`
      );
      if (res.ok) {
        const data = await res.json();
        setEndpoint(data.endpoint);
        setEditName(data.endpoint.name);
      }
    } catch {
      toast.error("Failed to load endpoint");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive() {
    if (!endpoint) return;
    setToggling(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/endpoints/${endpointId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !endpoint.isActive }),
        }
      );
      if (res.ok) {
        toast.success(endpoint.isActive ? "Endpoint deactivated" : "Endpoint activated");
        loadEndpoint();
      } else {
        toast.error("Failed to update endpoint status");
      }
    } catch {
      toast.error("Failed to update endpoint status");
    } finally {
      setToggling(false);
      setToggleOpen(false);
    }
  }

  async function handleRegenerateKey() {
    setRegenerating(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/endpoints/${endpointId}/regenerate-key`,
        { method: "POST" }
      );
      if (res.ok) {
        toast.success("API key regenerated");
        loadEndpoint();
      } else {
        toast.error("Failed to regenerate API key");
      }
    } catch {
      toast.error("Failed to regenerate API key");
    } finally {
      setRegenerating(false);
      setRegenerateOpen(false);
    }
  }

  async function handleRename() {
    if (!editName.trim()) return;
    setRenaming(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/endpoints/${endpointId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: editName }),
        }
      );
      if (res.ok) {
        toast.success("Endpoint renamed");
        setEditingName(false);
        loadEndpoint();
      } else {
        toast.error("Failed to rename endpoint");
      }
    } catch {
      toast.error("Failed to rename endpoint");
    } finally {
      setRenaming(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/endpoints/${endpointId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        toast.success("Endpoint deleted");
        router.push(`/projects/${projectId}?tab=endpoints`);
      } else {
        toast.error("Failed to delete endpoint");
      }
    } catch {
      toast.error("Failed to delete endpoint");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  if (loading) return <EndpointDetailSkeleton />;
  if (!endpoint) return <p className="text-destructive">Endpoint not found</p>;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const mcpUrl = `${origin}/api/mcp/${endpoint.apiKey}`;
  const endpointSlug = endpoint.name.toLowerCase().replace(/\s+/g, "-");

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  }

  function CopyButton({ text, id }: { text: string; id: string }) {
    const isCopied = copiedId === id;
    return (
      <button
        type="button"
        aria-label="Copy to clipboard"
        onClick={() => copyToClipboard(text, id)}
        className="absolute right-2 top-2 cursor-pointer rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        {isCopied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
      </button>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Breadcrumbs
        items={[
          { label: "Projects", href: "/projects" },
          {
            label: projectCtx?.projectName || projectName || "Project",
            href: `/projects/${projectId}`,
          },
          { label: endpoint.name },
        ]}
      />

      <div className="flex items-center justify-between">
        {editingName ? (
          <div className="flex items-center gap-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-64"
            />
            <Button size="sm" onClick={handleRename} disabled={renaming}>
              <Save className="size-4" />
              {renaming ? "Saving..." : "Save"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditingName(false);
                setEditName(endpoint.name);
              }}
            >
              <X className="size-4" />
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{endpoint.name}</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingName(true)}
            >
              <Pencil className="size-4" />
              Rename
            </Button>
          </div>
        )}
        <Badge variant={endpoint.isActive ? "default" : "secondary"}>
          {endpoint.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>MCP Endpoint URL</CardTitle>
          <CardDescription>
            Use this URL in your AI agent&apos;s MCP configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <code className="block rounded bg-muted p-3 pr-10 text-sm break-all">
              {mcpUrl}
            </code>
            <CopyButton text={mcpUrl} id="mcp-url" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Key</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <code className="block rounded bg-muted p-3 text-sm font-mono">
            {showKey ? endpoint.apiKey : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
          </code>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              {showKey ? "Hide" : "Reveal"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRegenerateOpen(true)}
            >
              <RefreshCw className="size-4" />
              Regenerate
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={regenerateOpen}
        onOpenChange={setRegenerateOpen}
        title="Regenerate API Key"
        description="Regenerate API key? The old key will stop working immediately."
        confirmText="Regenerate"
        loadingText="Regenerating..."
        variant="destructive"
        onConfirm={handleRegenerateKey}
        loading={regenerating}
      />

      <Card>
        <CardHeader>
          <CardTitle>Quick Connect</CardTitle>
          <CardDescription>
            Copy the config for your tool to connect to this endpoint
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="claude-code">
            <TabsList>
              <TabsTrigger value="claude-code">Claude Code</TabsTrigger>
              <TabsTrigger value="cursor">Cursor</TabsTrigger>
              <TabsTrigger value="opencode">OpenCode</TabsTrigger>
            </TabsList>
            <TabsContent value="claude-code" className="space-y-2 pt-3">
              <p className="text-sm text-muted-foreground">
                Run in your terminal:
              </p>
              <div className="relative">
                <pre className="block rounded bg-muted p-3 pr-10 text-sm overflow-x-auto">
{`claude mcp add --transport http --scope local ${endpointSlug} ${mcpUrl} --header "Authorization: Bearer ${endpoint.apiKey}"`}
                </pre>
                <CopyButton text={`claude mcp add --transport http --scope local ${endpointSlug} ${mcpUrl} --header "Authorization: Bearer ${endpoint.apiKey}"`} id="claude-code" />
              </div>
            </TabsContent>
            <TabsContent value="cursor" className="space-y-2 pt-3">
              <p className="text-sm text-muted-foreground">
                Add to <code className="text-xs">.cursor/mcp.json</code>:
              </p>
              <div className="relative">
                <pre className="block rounded bg-muted p-3 pr-10 text-sm overflow-x-auto">
{JSON.stringify({
  mcpServers: {
    [endpointSlug]: {
      type: "http",
      url: mcpUrl,
      headers: {
        Authorization: `Bearer ${endpoint.apiKey}`,
      },
    },
  },
}, null, 2)}
                </pre>
                <CopyButton text={JSON.stringify({ mcpServers: { [endpointSlug]: { type: "http", url: mcpUrl, headers: { Authorization: `Bearer ${endpoint.apiKey}` } } } }, null, 2)} id="cursor" />
              </div>
            </TabsContent>
            <TabsContent value="opencode" className="space-y-2 pt-3">
              <p className="text-sm text-muted-foreground">
                Add to <code className="text-xs">opencode.json</code>:
              </p>
              <div className="relative">
                <pre className="block rounded bg-muted p-3 pr-10 text-sm overflow-x-auto">
{JSON.stringify({
  mcpServers: {
    [endpointSlug]: {
      type: "http",
      url: mcpUrl,
      headers: {
        Authorization: `Bearer ${endpoint.apiKey}`,
      },
    },
  },
}, null, 2)}
                </pre>
                <CopyButton text={JSON.stringify({ mcpServers: { [endpointSlug]: { type: "http", url: mcpUrl, headers: { Authorization: `Bearer ${endpoint.apiKey}` } } } }, null, 2)} id="opencode" />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Service</p>
              <div className="flex items-center gap-2">
                <ServiceIcon provider={endpoint.serviceConnection.provider} className="size-5 shrink-0" />
                <p className="font-medium">
                  {getProviderDisplayName(endpoint.serviceConnection.provider)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {endpoint.serviceConnection.accountEmail}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Rate Limit</p>
              <p className="font-medium">
                {endpoint.rateLimitPerMinute} req/min
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Requests</p>
              <p className="font-medium">{endpoint._count.auditLogs}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium">
                {new Date(endpoint.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>
                Actions this endpoint is allowed to perform
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPermDialogOpen(true)}
            >
              <Shield className="size-4" />
              Edit Permissions
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {endpoint.permissions.map((p) => (
              <Badge key={p.id} variant="outline">
                {p.action}
              </Badge>
            ))}
            {endpoint.permissions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No permissions configured
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <EditPermissionsDialog
        projectId={projectId}
        endpointId={endpointId}
        currentPermissions={endpoint.permissions.map((p) => p.action)}
        serviceProvider={endpoint.serviceConnection.provider}
        open={permDialogOpen}
        onOpenChange={setPermDialogOpen}
        onSaved={loadEndpoint}
      />

      <Separator />

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setToggleOpen(true)}
          disabled={toggling}
        >
          <Power className="size-4" />
          {endpoint.isActive ? "Deactivate" : "Activate"}
        </Button>
      </div>

      <ConfirmDialog
        open={toggleOpen}
        onOpenChange={setToggleOpen}
        title={endpoint.isActive ? "Deactivate Endpoint" : "Activate Endpoint"}
        description={
          endpoint.isActive
            ? "Deactivate this endpoint? AI agents using it will lose access immediately."
            : "Activate this endpoint? AI agents will be able to use it."
        }
        confirmText={endpoint.isActive ? "Deactivate" : "Activate"}
        loadingText={endpoint.isActive ? "Deactivating..." : "Activating..."}
        variant={endpoint.isActive ? "destructive" : "default"}
        onConfirm={handleToggleActive}
        loading={toggling}
      />

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete this endpoint and all associated data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
            Delete Endpoint
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Endpoint"
        description="Are you sure you want to delete this endpoint? This action cannot be undone."
        confirmText="Delete"
        loadingText="Deleting..."
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
