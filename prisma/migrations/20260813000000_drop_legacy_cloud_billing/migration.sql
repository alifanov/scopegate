-- Leftovers from the retired `scopegate-cloud` fork, whose billing was modelled as
-- Plan/Organization/Subscription rows under Stripe. This codebase keeps plan
-- definitions in code (`src/lib/plans.ts`) and usage in `MonthlyUsage`, so nothing
-- reads these tables. IF EXISTS throughout: only the scopegate.dev database ever
-- had them — every other deployment replays this as a no-op.
ALTER TABLE "Project" DROP COLUMN IF EXISTS "organizationId";

DROP TABLE IF EXISTS "Subscription";
DROP TABLE IF EXISTS "OrganizationMember";
DROP TABLE IF EXISTS "Organization";
DROP TABLE IF EXISTS "Plan";
