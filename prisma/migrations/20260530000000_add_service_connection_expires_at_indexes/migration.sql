-- CreateIndex
CREATE INDEX "ServiceConnection_expiresAt_idx" ON "ServiceConnection"("expiresAt");

-- CreateIndex
CREATE INDEX "ServiceConnection_provider_expiresAt_idx" ON "ServiceConnection"("provider", "expiresAt");
