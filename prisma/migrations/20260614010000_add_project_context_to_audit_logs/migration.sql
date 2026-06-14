ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_endpointId_fkey";

ALTER TABLE "AuditLog"
  ADD COLUMN "projectId" TEXT,
  ALTER COLUMN "endpointId" DROP NOT NULL;

UPDATE "AuditLog"
SET "projectId" = "McpEndpoint"."projectId"
FROM "McpEndpoint"
WHERE "AuditLog"."endpointId" = "McpEndpoint"."id";

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_endpointId_fkey"
  FOREIGN KEY ("endpointId") REFERENCES "McpEndpoint"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "AuditLog_projectId_idx" ON "AuditLog"("projectId");
