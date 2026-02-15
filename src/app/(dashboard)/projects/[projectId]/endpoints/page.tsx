"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

export default function EndpointsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/projects/${projectId}/endpoints`);
      if (res.ok) {
        const data = await res.json();
        setEndpoints(data.endpoints || []);
      }
      setLoading(false);
    }
    load();
  }, [projectId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">MCP Endpoints</h1>
        <Button asChild>
          <Link href={`/projects/${projectId}/endpoints/new`}>
            New Endpoint
          </Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : endpoints.length === 0 ? (
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
                    <span className="capitalize">
                      {ep.serviceConnection.provider}
                    </span>
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
