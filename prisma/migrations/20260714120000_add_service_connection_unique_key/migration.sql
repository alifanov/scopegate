-- Natural key for ServiceConnection: one row per (project, provider, account).
-- Fails loudly (no data loss) if duplicate rows already exist from the pre-upsert race;
-- those must be reconciled manually before this migration can apply.
CREATE UNIQUE INDEX "ServiceConnection_projectId_provider_accountEmail_key" ON "ServiceConnection"("projectId", "provider", "accountEmail");
