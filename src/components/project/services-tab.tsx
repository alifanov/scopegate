"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CreateEndpointDialog } from "@/components/project/create-endpoint-dialog";
import { ConnectServiceDialog } from "@/components/project/connect-service-dialog";
import { ServiceCard } from "@/components/project/service-card";
import { TabContentSkeleton } from "@/components/skeletons";
import { Plug } from "lucide-react";
import { toast } from "sonner";
import { apiSend, ApiError } from "@/lib/api-client";
import { useProjectServices, type Service } from "@/components/project/use-project-services";

export function ServicesTab({ projectId }: { projectId: string }) {
  const searchParams = useSearchParams();
  const { services, setServices, loading, error, cloud, oauthApps, redirectUriTemplate, reload } =
    useProjectServices(projectId);

  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [serviceToDisconnect, setServiceToDisconnect] = useState<string | null>(null);
  const [mcpServiceId, setMcpServiceId] = useState<string | null>(null);
  const [reconnectProvider, setReconnectProvider] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("error") === "oauth_failed") {
      toast.error("Failed to connect service. Please try again.");
    }
  }, [searchParams]);

  function handleReconnect(service: Service) {
    setReconnecting(service.id);
    setReconnectProvider(service.provider);
  }

  function handleReconnectRequestHandled() {
    setReconnectProvider(null);
    setReconnecting(null);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={() => setDialogOpen(true)}><Plug className="size-4" />Connect Service</Button>
      </div>

      <ConnectServiceDialog
        projectId={projectId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        cloud={cloud}
        oauthApps={oauthApps}
        redirectUriTemplate={redirectUriTemplate}
        onConnected={reload}
        requestedProvider={reconnectProvider}
        onRequestHandled={handleReconnectRequestHandled}
      />

      <CreateEndpointDialog
        projectId={projectId}
        open={mcpServiceId !== null}
        onOpenChange={(open) => !open && setMcpServiceId(null)}
        onCreated={reload}
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
            <Button variant="outline" onClick={reload}>Retry</Button>
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
            <ServiceCard
              key={service.id}
              service={service}
              disconnecting={disconnecting === service.id}
              reconnecting={reconnecting === service.id}
              onReconnect={() => handleReconnect(service)}
              onDisconnect={() => askDisconnect(service.id)}
              onAddMcp={() => setMcpServiceId(service.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
