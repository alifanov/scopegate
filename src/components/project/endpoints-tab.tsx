"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/skeletons";
import { CreateEndpointDialog } from "@/components/project/create-endpoint-dialog";
import { getProviderDisplayName } from "@/lib/provider-names";
import { toast } from "sonner";

interface Endpoint {
  id: string;
  name: string;
  apiKey: string;
  isActive: boolean;
  rateLimitPerMinute: number;
  serviceConnection: { provider: string; accountEmail: string };
  permissions: { action: string }[];
  _count: { auditLogs: number };
  createdAt: string;
}

export function EndpointsTab({ projectId }: { projectId: string }) {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchEndpoints = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/endpoints`);
      if (res.ok) {
        const data = await res.json();
        setEndpoints(data.endpoints || []);
      }
    } catch {
      toast.error("Failed to load endpoints");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchEndpoints();
  }, [fetchEndpoints]);

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={() => setDialogOpen(true)}>New Endpoint</Button>
      </div>

      <CreateEndpointDialog
        projectId={projectId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={fetchEndpoints}
      />

      {endpoints.length === 0 ? (
        <p className="text-muted-foreground">
          No endpoints yet. Connect a service first, then create an endpoint.
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requests</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {endpoints.map((ep) => (
                <TableRow key={ep.id}>
                  <TableCell className="font-medium">{ep.name}</TableCell>
                  <TableCell>
                    {getProviderDisplayName(ep.serviceConnection.provider)}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      {ep.serviceConnection.accountEmail}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {ep.permissions.length} permission(s)
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ep.isActive ? "default" : "secondary"}>
                      {ep.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{ep._count.auditLogs}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        href={`/projects/${projectId}/endpoints/${ep.id}`}
                      >
                        Details
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
