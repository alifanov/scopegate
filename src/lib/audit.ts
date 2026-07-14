import { db } from "@/lib/db";
import { redactParams, sanitizeAuditError } from "@/lib/mcp/audit-utils";

export async function recordAudit({
  endpointId,
  projectId,
  action,
  params,
  status,
  error,
  duration,
}: {
  endpointId?: string | null;
  projectId: string;
  action: string;
  params?: Record<string, unknown> | null;
  status: "success" | "error";
  error?: string | null;
  duration?: number | null;
}) {
  await db.auditLog.create({
    data: {
      ...(endpointId ? { endpointId } : {}),
      projectId,
      action,
      params: params
        ? JSON.parse(JSON.stringify(redactParams(params)))
        : undefined,
      status,
      ...(error ? { error: sanitizeAuditError(error) } : {}),
      ...(duration !== undefined ? { duration } : {}),
    },
  });
}
