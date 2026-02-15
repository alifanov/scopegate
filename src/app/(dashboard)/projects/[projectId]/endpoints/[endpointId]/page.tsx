"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [endpoint, setEndpoint] = useState<EndpointDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    loadEndpoint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, endpointId]);

  async function loadEndpoint() {
    const res = await fetch(
      `/api/projects/${projectId}/endpoints/${endpointId}`
    );
    if (res.ok) {
      const data = await res.json();
      setEndpoint(data.endpoint);
    }
    setLoading(false);
  }

  async function handleToggleActive() {
    if (!endpoint) return;
    await fetch(`/api/projects/${projectId}/endpoints/${endpointId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !endpoint.isActive }),
    });
    loadEndpoint();
  }

  async function handleRegenerateKey() {
    if (!confirm("Regenerate API key? The old key will stop working.")) return;
    await fetch(
      `/api/projects/${projectId}/endpoints/${endpointId}/regenerate-key`,
      { method: "POST" }
    );
    loadEndpoint();
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>;
  if (!endpoint) return <p className="text-destructive">Endpoint not found</p>;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const mcpUrl = `${origin}/api/mcp/${endpoint.apiKey}`;
  const endpointSlug = endpoint.name.toLowerCase().replace(/\s+/g, "-");

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{endpoint.name}</h1>
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
            <button
              type="button"
              onClick={() => copyToClipboard(mcpUrl)}
              className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Copy className="size-4" />
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Key</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <code className="block rounded bg-muted p-3 text-sm font-mono">
            {showKey ? endpoint.apiKey : "••••••••••••••••"}
          </code>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? "Hide" : "Reveal"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleRegenerateKey}>
              Regenerate
            </Button>
          </div>
        </CardContent>
      </Card>

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
{`claude mcp add --transport http ${endpointSlug} ${mcpUrl} --header "Authorization: Bearer ${endpoint.apiKey}"`}
                </pre>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      `claude mcp add --transport http ${endpointSlug} ${mcpUrl} --header "Authorization: Bearer ${endpoint.apiKey}"`
                    )
                  }
                  className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Copy className="size-4" />
                </button>
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
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      JSON.stringify({
                        mcpServers: {
                          [endpointSlug]: {
                            type: "http",
                            url: mcpUrl,
                            headers: {
                              Authorization: `Bearer ${endpoint.apiKey}`,
                            },
                          },
                        },
                      }, null, 2)
                    )
                  }
                  className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Copy className="size-4" />
                </button>
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
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      JSON.stringify({
                        mcpServers: {
                          [endpointSlug]: {
                            type: "http",
                            url: mcpUrl,
                            headers: {
                              Authorization: `Bearer ${endpoint.apiKey}`,
                            },
                          },
                        },
                      }, null, 2)
                    )
                  }
                  className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Copy className="size-4" />
                </button>
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
              <p className="font-medium capitalize">
                {endpoint.serviceConnection.provider}
              </p>
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
                {new Date(endpoint.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
          <CardDescription>
            Actions this endpoint is allowed to perform
          </CardDescription>
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

      <Separator />

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleToggleActive}>
          {endpoint.isActive ? "Deactivate" : "Activate"}
        </Button>
      </div>
    </div>
  );
}
