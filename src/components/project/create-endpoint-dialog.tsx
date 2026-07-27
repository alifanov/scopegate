"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PERMISSION_GROUPS } from "@/lib/mcp/permissions";
import { getProviderDisplayName } from "@/lib/provider-names";
import { Plus } from "lucide-react";
import { ServiceIcon } from "@/components/service-icons";
import { toast } from "sonner";
import { apiGet, apiSend, ApiError } from "@/lib/api-client";

interface Service {
  id: string;
  provider: string;
  accountEmail: string;
  metadata: Record<string, unknown> | null;
}

interface CreateEndpointDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  /** Preselect this service connection when the dialog opens. */
  initialServiceId?: string;
}

export function CreateEndpointDialog({
  projectId,
  open,
  onOpenChange,
  onCreated,
  initialServiceId,
}: CreateEndpointDialogProps) {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [name, setName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);

  function selectService(s: Service, all: Service[]) {
    setSelectedService(s.id);
    setSelectedPermissions(new Set());
    const baseName = getProviderDisplayName(s.provider)
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const hasMultiple = all.filter((s2) => s2.provider === s.provider).length > 1;
    const accountLabel = hasMultiple
      ? ((s.metadata?.googleAdsCustomerName as string | undefined) ?? s.accountEmail.split("@")[0])
      : "";
    const suffix = accountLabel
      ? `-${accountLabel.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`
      : "";
    setName(`${baseName}${suffix}`);
  }

  const loadServices = useCallback(async () => {
    setLoadingServices(true);
    setServicesError(null);
    try {
      const data = await apiGet<{ services: Service[] }>(`/api/projects/${projectId}/services`);
      const list = data.services || [];
      setServices(list);
      const preselect = initialServiceId && list.find((s) => s.id === initialServiceId);
      if (preselect) selectService(preselect, list);
    } catch (err) {
      setServicesError(err instanceof ApiError ? err.message : "Failed to load services");
    } finally {
      setLoadingServices(false);
    }
  }, [projectId, initialServiceId]);

  useEffect(() => {
    if (!open) return;
    loadServices();
  }, [open, loadServices]);

  function togglePermission(action: string) {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(action)) next.delete(action);
      else next.add(action);
      return next;
    });
  }

  function toggleGroup(actions: string[]) {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      const allSelected = actions.every((a) => next.has(a));
      if (allSelected) actions.forEach((a) => next.delete(a));
      else actions.forEach((a) => next.add(a));
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await apiSend<{ endpoint: { id: string } }>(
        `/api/projects/${projectId}/endpoints`,
        "POST",
        {
          name,
          serviceConnectionId: selectedService,
          permissions: Array.from(selectedPermissions),
        }
      );

      toast.success("Endpoint created");
      setSelectedService("");
      setName("");
      setSelectedPermissions(new Set());
      onOpenChange(false);
      onCreated();
      router.push(`/projects/${projectId}/endpoints/${data.endpoint.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create endpoint");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create MCP Endpoint</DialogTitle>
        </DialogHeader>

        {loadingServices ? (
          <p className="text-sm text-muted-foreground">Loading services...</p>
        ) : servicesError ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive">{servicesError}</p>
            <Button type="button" variant="outline" size="sm" onClick={loadServices}>
              Retry
            </Button>
          </div>
        ) : services.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No services connected. Connect a service first before creating an
            endpoint.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="endpoint-name">Endpoint Name</Label>
                <Input
                  id="endpoint-name"
                  name="name"
                  placeholder="e.g. Email Reader for Agent"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Service Connection</Label>
                <div className="space-y-2">
                  {services.map((s) => (
                    <label
                      key={s.id}
                      className={`flex cursor-pointer items-center rounded-md border p-3 transition-colors ${
                        selectedService === s.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted"
                      }`}
                    >
                      <input
                        type="radio"
                        name="service"
                        value={s.id}
                        checked={selectedService === s.id}
                        onChange={() => selectService(s, services)}
                        className="mr-3"
                      />
                      <ServiceIcon provider={s.provider} className="size-6 shrink-0" />
                      <div className="ml-3">
                        <p className="font-medium">
                          {getProviderDisplayName(s.provider)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {s.accountEmail}
                        </p>
                        {s.provider === "googleAds" && Boolean(s.metadata?.googleAdsCustomerName) && (
                          <p className="text-sm text-muted-foreground">
                            {s.metadata!.googleAdsCustomerName as string}
                            {Boolean(s.metadata!.googleAdsCustomerId) && (
                              <span className="text-muted-foreground/70"> · ID: {s.metadata!.googleAdsCustomerId as string}</span>
                            )}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Permissions</CardTitle>
                <CardDescription>
                  Select which actions this endpoint can perform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!selectedService && (
                  <p className="text-sm text-muted-foreground">
                    Select a service connection above to see available
                    permissions.
                  </p>
                )}
                {(() => {
                  const service = services.find(
                    (s) => s.id === selectedService
                  );
                  const group = service
                    ? PERMISSION_GROUPS[service.provider]
                    : null;
                  if (!group) return null;
                  const allSelected = group.actions.every((a) =>
                    selectedPermissions.has(a)
                  );
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="dialog-select-all"
                          checked={allSelected}
                          onCheckedChange={() => toggleGroup(group.actions)}
                        />
                        <Label
                          htmlFor="dialog-select-all"
                          className="font-semibold"
                        >
                          Select All
                        </Label>
                      </div>
                      <div className="space-y-2">
                        {group.actions.map((action) => (
                          <div
                            key={action}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`dialog-${action}`}
                              checked={selectedPermissions.has(action)}
                              onCheckedChange={() => togglePermission(action)}
                            />
                            <Label
                              htmlFor={`dialog-${action}`}
                              className="text-sm font-normal"
                            >
                              {action}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full"
              disabled={
                loading || !selectedService || selectedPermissions.size === 0
              }
            >
              <Plus className="size-4" />
              {loading ? "Creating..." : "Create Endpoint"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
