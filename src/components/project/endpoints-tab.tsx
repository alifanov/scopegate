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
import { Plus } from "lucide-react";
import { ServiceIcon } from "@/components/service-icons";
import { apiGet, ApiError } from "@/lib/api-client";

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
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchEndpoints = useCallback(async () => {
    setError(null);
    try {
      const data = await apiGet<{ endpoints: Endpoint[] }>(`/api/projects/${projectId}/endpoints`);
      setEndpoints(data.endpoints || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load endpoints");
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
        <Button onClick={() => setDialogOpen(true)}><Plus className="size-4" />New Endpoint</Button>
      </div>

      <CreateEndpointDialog
        projectId={projectId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={fetchEndpoints}
      />

      {error ? (
        <div className="space-y-2">
          <p className="text-destructive text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchEndpoints}>Retry</Button>
        </div>
      ) : endpoints.length === 0 ? (
        <p className="text-muted-foreground">
          No endpoints yet. Connect a service first, then create an endpoint.
        </p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requests</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {endpoints.map((ep) => (
                <TableRow key={ep.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/projects/${projectId}/endpoints/${ep.id}`}
                      className="text-primary hover:underline"
                    >
                      {ep.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ServiceIcon provider={ep.serviceConnection.provider} className="size-5 shrink-0" />
                      <div>
                        {getProviderDisplayName(ep.serviceConnection.provider)}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {ep.serviceConnection.accountEmail}
                        </span>
                      </div>
                    </div>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
