"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableSkeleton } from "@/components/skeletons";
import { Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface AuditEntry {
  id: string;
  action: string;
  status: string;
  error: string | null;
  duration: number | null;
  createdAt: string;
  endpoint: { name: string };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface Endpoint {
  id: string;
  name: string;
}

export function AuditTab({ projectId }: { projectId: string }) {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [endpointFilter, setEndpointFilter] = useState<string | null>(null);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function loadEndpoints() {
      try {
        const res = await fetch(`/api/projects/${projectId}/endpoints`);
        if (res.ok) {
          const data = await res.json();
          setEndpoints(data.endpoints || []);
        }
      } catch {
        // silently ignore — filter just won't be populated
      }
    }
    loadEndpoints();
  }, [projectId]);

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams({ page: String(page), limit: "50" });
        if (statusFilter) params.set("status", statusFilter);
        if (endpointFilter) params.set("endpointId", endpointFilter);

        const res = await fetch(
          `/api/projects/${projectId}/audit?${params}`
        );
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
          setPagination(data.pagination);
        }
      } catch {
        toast.error("Failed to load audit logs");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId, page, statusFilter, endpointFilter]);

  const statusVariant = (status: string) => {
    switch (status) {
      case "success":
        return "default" as const;
      case "error":
        return "destructive" as const;
      case "denied":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="size-4" />
              {endpointFilter
                ? `Endpoint: ${endpoints.find((e) => e.id === endpointFilter)?.name ?? "..."}`
                : "All endpoints"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => { setEndpointFilter(null); setPage(1); }}>
              All
            </DropdownMenuItem>
            {endpoints.map((ep) => (
              <DropdownMenuItem key={ep.id} onClick={() => { setEndpointFilter(ep.id); setPage(1); }}>
                {ep.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="size-4" />
              {statusFilter ? `Status: ${statusFilter}` : "All statuses"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => { setStatusFilter(null); setPage(1); }}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setStatusFilter("success"); setPage(1); }}>
              Success
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setStatusFilter("error"); setPage(1); }}>
              Error
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setStatusFilter("denied"); setPage(1); }}>
              Denied
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {logs.length === 0 ? (
        <p className="text-muted-foreground">No audit logs yet.</p>
      ) : (
        <>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {new Date(log.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                    <TableCell>{log.endpoint.name}</TableCell>
                    <TableCell>
                      <code className="text-xs">{log.action}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(log.status)}>
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.duration != null ? `${log.duration}ms` : "-"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-destructive">
                      {log.error || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.pages} ({pagination.total}{" "}
                total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
