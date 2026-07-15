-- Natural key for ServiceConnection: one row per (project, provider, account).
--
-- googleAds is special: a single Google login manages many Ads customer accounts, so the login
-- email alone is NOT a unique connection identity — distinct customerIds legitimately share it.
-- Backfill finalized googleAds rows to embed the customerId in accountEmail ("email (customerId)"),
-- matching how the app now finalizes them (see lib/mcp/google-ads.ts:googleAdsAccountEmail), so the
-- unique index below holds instead of collapsing real accounts. Rows still awaiting a customerId
-- carry a "#pending:<uuid>" suffix and are already unique — leave them untouched.
UPDATE "ServiceConnection"
SET "accountEmail" = "accountEmail" || ' (' || (metadata->>'googleAdsCustomerId') || ')'
WHERE provider = 'googleAds'
  AND metadata->>'googleAdsCustomerId' IS NOT NULL
  AND "accountEmail" NOT LIKE '%#pending:%'
  AND "accountEmail" NOT LIKE '% (' || (metadata->>'googleAdsCustomerId') || ')';

-- Fails loudly (no data loss) if genuine duplicates still exist after the backfill; those must be
-- reconciled manually before this migration can apply.
CREATE UNIQUE INDEX "ServiceConnection_projectId_provider_accountEmail_key" ON "ServiceConnection"("projectId", "provider", "accountEmail");
