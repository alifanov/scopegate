-- Per-project OAuth application credentials ("bring your own app").
--
-- Purely additive: a new empty table. Deployments that never populate it keep
-- resolving credentials from environment variables exactly as before.

CREATE TABLE IF NOT EXISTS "provider_credential" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "appGroup" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_credential_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "provider_credential_projectId_appGroup_key"
    ON "provider_credential"("projectId", "appGroup");

ALTER TABLE "provider_credential"
    ADD CONSTRAINT "provider_credential_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
