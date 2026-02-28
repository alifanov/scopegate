"use client";

import { useEffect, useState } from "react";
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

interface Service {
  id: string;
  provider: string;
  accountEmail: string;
}

interface CreateEndpointDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateEndpointDialog({
  projectId,
  open,
  onOpenChange,
  onCreated,
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

  useEffect(() => {
    if (!open) return;
    setLoadingServices(true);
    fetch(`/api/projects/${projectId}/services`)
      .then((res) => (res.ok ? res.json() : { services: [] }))
      .then((data) => setServices(data.services || []))
      .catch(() => toast.error("Failed to load services"))
      .finally(() => setLoadingServices(false));
  }, [projectId, open]);

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
      const res = await fetch(`/api/projects/${projectId}/endpoints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          serviceConnectionId: selectedService,
          permissions: Array.from(selectedPermissions),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("Endpoint created");
        setSelectedService("");
        setName("");
        setSelectedPermissions(new Set());
        onOpenChange(false);
        onCreated();
        router.push(`/projects/${projectId}/endpoints/${data.endpoint.id}`);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to create endpoint");
      }
    } catch {
      toast.error("Failed to create endpoint");
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
                        onChange={() => {
                          setSelectedService(s.id);
                          setSelectedPermissions(new Set());
                          setName(
                            getProviderDisplayName(s.provider)
                              .toLowerCase()
                              .replace(/\s+/g, "-")
                              .replace(/[^a-z0-9-]/g, "")
                          );
                        }}
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
