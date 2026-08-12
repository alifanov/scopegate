-- Billing columns on "user" and the monthly MCP request counter.
--
-- Non-destructive: every column is nullable or has a default, and the new table
-- is empty on creation. Self-hosted deployments never read any of this — the
-- plan-limit code short-circuits when SCOPEGATE_CLOUD is unset.

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "polarCustomerId" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "planSlug" TEXT NOT NULL DEFAULT 'free';
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "planStatus" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "planValidUntil" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "user_polarCustomerId_key" ON "user"("polarCustomerId");

-- Everyone who already exists predates billing. Without this they would land on
-- the 'free' column default and be throttled retroactively the moment limits go
-- live. 'grandfathered' has every limit unlimited (see src/lib/plans.ts).
UPDATE "user" SET "planSlug" = 'grandfathered' WHERE "planSlug" = 'free';

CREATE TABLE IF NOT EXISTS "monthly_usage" (
    "userId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "monthly_usage_pkey" PRIMARY KEY ("userId","month")
);
