"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { PERMISSION_GROUPS } from "@/lib/mcp/permissions";

interface Service {
  id: string;
  provider: string;
  accountEmail: string;
}

export default function NewEndpointPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadServices() {
      const res = await fetch(`/api/projects/${projectId}/services`);
      if (res.ok) {
        const data = await res.json();
        setServices(data.services || []);
      }
    }
    loadServices();
  }, [projectId]);

  function togglePermission(action: string) {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(action)) {
        next.delete(action);
      } else {
        next.add(action);
      }
      return next;
    });
  }

  function toggleGroup(actions: string[]) {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      const allSelected = actions.every((a) => next.has(a));
      if (allSelected) {
        actions.forEach((a) => next.delete(a));
      } else {
        actions.forEach((a) => next.add(a));
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

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
      router.push(`/projects/${projectId}/endpoints`);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Create MCP Endpoint</h1>

      {services.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No services connected</CardTitle>
            <CardDescription>
              Connect a service first before creating an endpoint.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Endpoint Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Endpoint Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. Email Reader for Agent"
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
                        }}
                        className="mr-3"
                      />
                      <div>
                        <p className="font-medium capitalize">{s.provider}</p>
                        <p className="text-sm text-muted-foreground">
                          {s.accountEmail}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>
                Select which actions this endpoint can perform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!selectedService && (
                <p className="text-sm text-muted-foreground">
                  Select a service connection above to see available permissions.
                </p>
              )}
              {Object.entries(PERMISSION_GROUPS)
              .filter(([key]) => {
                const service = services.find((s) => s.id === selectedService);
                return service ? key === service.provider : false;
              })
              .map(([key, group]) => (
                <div key={key} className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`group-${key}`}
                      checked={group.actions.every((a) =>
                        selectedPermissions.has(a)
                      )}
                      onCheckedChange={() => toggleGroup(group.actions)}
                    />
                    <Label htmlFor={`group-${key}`} className="font-semibold">
                      {group.name}
                    </Label>
                  </div>
                  <div className="ml-6 space-y-2">
                    {group.actions.map((action) => (
                      <div key={action} className="flex items-center space-x-2">
                        <Checkbox
                          id={action}
                          checked={selectedPermissions.has(action)}
                          onCheckedChange={() => togglePermission(action)}
                        />
                        <Label
                          htmlFor={action}
                          className="text-sm font-normal"
                        >
                          {action}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={
              loading || !selectedService || selectedPermissions.size === 0
            }
          >
            {loading ? "Creating..." : "Create Endpoint"}
          </Button>
        </form>
      )}
    </div>
  );
}
