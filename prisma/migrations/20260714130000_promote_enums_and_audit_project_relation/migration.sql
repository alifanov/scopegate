-- Backfill AuditLog.projectId from the endpoint relation for any row that
-- still relies solely on it (e.g. rows written by the MCP tool handler,
-- which only sets endpointId).
UPDATE "AuditLog"
SET "projectId" = "McpEndpoint"."projectId"
FROM "McpEndpoint"
WHERE "AuditLog"."endpointId" = "McpEndpoint"."id"
  AND "AuditLog"."projectId" IS NULL;

-- Safety net: a row can only be unrecoverable here if its McpEndpoint was
-- deleted (onDelete: SetNull) after the log was written and before this
-- backfill ran. Abort rather than silently dropping/orphaning those rows —
-- migrating an unrecoverable state needs a human decision.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "AuditLog" WHERE "projectId" IS NULL) THEN
    RAISE EXCEPTION 'Cannot make AuditLog.projectId required: found rows with no projectId and no resolvable endpoint';
  END IF;
END $$;

ALTER TABLE "AuditLog" ALTER COLUMN "projectId" SET NOT NULL;

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Promote ServiceConnection.provider to a DB enum.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "ServiceConnection"
    WHERE "provider" NOT IN (
      'gmail', 'calendar', 'drive', 'googleAds', 'searchConsole', 'youtube',
      'openRouter', 'linkedin', 'twitter', 'twitterAds', 'slack', 'notion',
      'hubspot', 'github', 'jira', 'salesforce', 'metaAds', 'telegram',
      'semrush', 'ahrefs', 'stripe', 'airtable', 'calendly', 'threads',
      'googleTagManager', 'email'
    )
  ) THEN
    RAISE EXCEPTION 'Cannot migrate ServiceConnection.provider to ServiceProvider enum: found values outside the known provider set';
  END IF;
END $$;

CREATE TYPE "ServiceProvider" AS ENUM (
  'gmail', 'calendar', 'drive', 'googleAds', 'searchConsole', 'youtube',
  'openRouter', 'linkedin', 'twitter', 'twitterAds', 'slack', 'notion',
  'hubspot', 'github', 'jira', 'salesforce', 'metaAds', 'telegram',
  'semrush', 'ahrefs', 'stripe', 'airtable', 'calendly', 'threads',
  'googleTagManager', 'email'
);

ALTER TABLE "ServiceConnection"
  ALTER COLUMN "provider" TYPE "ServiceProvider" USING ("provider"::"ServiceProvider");

-- Promote ServiceConnection.status to a DB enum.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "ServiceConnection"
    WHERE "status" NOT IN ('active', 'error', 'revoked')
  ) THEN
    RAISE EXCEPTION 'Cannot migrate ServiceConnection.status to ServiceConnectionStatus enum: found values outside active/error/revoked';
  END IF;
END $$;

CREATE TYPE "ServiceConnectionStatus" AS ENUM ('active', 'error', 'revoked');

ALTER TABLE "ServiceConnection"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "ServiceConnectionStatus" USING ("status"::"ServiceConnectionStatus"),
  ALTER COLUMN "status" SET DEFAULT 'active';

-- Promote Notification.type to a DB enum.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "Notification"
    WHERE "type" NOT IN ('error')
  ) THEN
    RAISE EXCEPTION 'Cannot migrate Notification.type to NotificationType enum: found values outside error';
  END IF;
END $$;

CREATE TYPE "NotificationType" AS ENUM ('error');

ALTER TABLE "Notification"
  ALTER COLUMN "type" DROP DEFAULT,
  ALTER COLUMN "type" TYPE "NotificationType" USING ("type"::"NotificationType"),
  ALTER COLUMN "type" SET DEFAULT 'error';

-- Promote AuditLog.status to a DB enum.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "AuditLog"
    WHERE "status" NOT IN ('success', 'error')
  ) THEN
    RAISE EXCEPTION 'Cannot migrate AuditLog.status to AuditStatus enum: found values outside success/error';
  END IF;
END $$;

CREATE TYPE "AuditStatus" AS ENUM ('success', 'error');

ALTER TABLE "AuditLog"
  ALTER COLUMN "status" TYPE "AuditStatus" USING ("status"::"AuditStatus");
