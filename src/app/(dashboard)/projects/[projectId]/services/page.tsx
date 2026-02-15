"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Service {
  id: string;
  provider: string;
  accountEmail: string;
  expiresAt: string | null;
  createdAt: string;
  _count: { mcpEndpoints: number };
}

const PROVIDERS = [
  { key: "gmail", name: "Gmail", description: "Access to Gmail operations" },
  {
    key: "calendar",
    name: "Google Calendar",
    description: "Access to Google Calendar operations",
  },
  {
    key: "drive",
    name: "Google Drive",
    description: "Access to Google Drive operations",
  },
  {
    key: "googleAds",
    name: "Google Ads",
    description: "Access to Google Ads operations",
  },
  {
    key: "searchConsole",
    name: "Google Search Console",
    description: "Access to Google Search Console operations",
  },
];

export default function ServicesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const searchParams = useSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    const res = await fetch(`/api/projects/${projectId}/services`);
    if (res.ok) {
      const data = await res.json();
      setServices(data.services || []);
    }
    setLoading(false);
  }

  function handleConnect(providerKey: string) {
    window.location.href = `/api/oauth/google?projectId=${projectId}&provider=${providerKey}`;
  }

  async function handleDisconnect(serviceId: string) {
    if (!confirm("Are you sure you want to disconnect this service? Any endpoints using it will stop working.")) {
      return;
    }

    setDisconnecting(serviceId);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/services?serviceId=${serviceId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setServices((prev) => prev.filter((s) => s.id !== serviceId));
        toast.success("Service disconnected.");
      } else {
        toast.error("Failed to disconnect service.");
      }
    } catch {
      toast.error("Failed to disconnect service.");
    } finally {
      setDisconnecting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Connected Services</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Connect Service</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect a Service</DialogTitle>
              <DialogDescription>
                Choose a Google service to connect to this project.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {PROVIDERS.map((provider) => (
                <button
                  key={provider.key}
                  onClick={() => handleConnect(provider.key)}
                  className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted"
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
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : services.length === 0 ? (
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
                    <CardTitle className="capitalize">
                      {service.provider}
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
                      onClick={() => handleDisconnect(service.id)}
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
                  Connected {new Date(service.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
