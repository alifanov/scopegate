"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Service {
  id: string;
  provider: string;
  accountEmail: string;
  expiresAt: string | null;
  createdAt: string;
  _count: { mcpEndpoints: number };
}

export default function ServicesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/projects/${projectId}/services`);
      if (res.ok) {
        const data = await res.json();
        setServices(data.services || []);
      }
      setLoading(false);
    }
    load();
  }, [projectId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Connected Services</h1>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : services.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No services connected</CardTitle>
            <CardDescription>
              Service connections will appear here once configured.
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
                  <Badge variant="secondary">
                    {service._count.mcpEndpoints} endpoint(s)
                  </Badge>
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
