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
import { ConfirmDialog } from "@/components/confirm-dialog";
import { TabContentSkeleton } from "@/components/skeletons";
import { getProviderDisplayName } from "@/lib/provider-names";
import { PERMISSION_GROUPS } from "@/lib/mcp/permissions";
import { toast } from "sonner";

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
    window.location.href = `/api/oauth/google?projectId=${projectId}&provider=${providerKey}`;
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
        <Button onClick={() => setDialogOpen(true)}>Connect Service</Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect a Service</DialogTitle>
            <DialogDescription>
              Choose a Google service to connect to this project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {providers.map((provider) => (
              <button
                key={provider.key}
                onClick={() => handleConnect(provider.key)}
                className="w-full cursor-pointer rounded-lg border p-4 text-left transition-colors hover:bg-muted"
              >
                <div className="font-medium">{provider.name}</div>
                <div className="text-sm text-muted-foreground">
                  {provider.description}
                </div>
              </button>
            ))}
          </div>
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
              Click &quot;Connect Service&quot; to link a Google service to this
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
                  <div>
                    <CardTitle>
                      {getProviderDisplayName(service.provider)}
                    </CardTitle>
                    <CardDescription>{service.accountEmail}</CardDescription>
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
