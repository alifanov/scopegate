// Plan definitions live in code, not in the database.
//
// Limits are enforced by code and must be versioned with it; a DB-seeded plan
// table lets production drift from the repo and costs a write on every read.
// Same idiom as PROVIDER_REGISTRY. Keep this file free of DB imports — the
// marketing pricing page imports it client-side so the advertised numbers and
// the enforced ones cannot diverge.

/** -1 means unlimited. */
export type PlanLimits = {
  projects: number;
  endpoints: number;
  requestsPerMonth: number;
};

export type PlanDef = {
  slug: string;
  name: string;
  /** USD per month, billed monthly. null = "contact sales". */
  priceMonthly: number | null;
  /** USD per month when billed annually. */
  priceYearly: number | null;
  description: string;
  limits: PlanLimits;
  /** Env var NAME holding the Polar product id — same indirection as
   *  RefreshTokenConfig.clientIdEnv, so sandbox/production ids stay out of
   *  source. Absent for plans with no self-serve checkout. */
  polarProductIdEnv?: string;
  /** Env var NAME holding the Polar product id for the annual-billed variant
   *  of this plan. Absent for plans with no self-serve checkout. */
  polarProductIdEnvYearly?: string;
  /** Hidden from the pricing page and the billing picker. */
  internal?: boolean;
};

export const UNLIMITED = -1;

export const PLAN_REGISTRY: PlanDef[] = [
  {
    slug: "free",
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    description: "Get started with one agent, no card needed.",
    limits: { projects: 1, endpoints: 5, requestsPerMonth: 1_000 },
  },
  {
    slug: "pro",
    name: "Pro",
    priceMonthly: 29,
    priceYearly: 23,
    description: "For solo developers shipping production agents.",
    limits: { projects: 5, endpoints: 25, requestsPerMonth: 50_000 },
    polarProductIdEnv: "POLAR_PRODUCT_PRO",
    polarProductIdEnvYearly: "POLAR_PRODUCT_PRO_YEARLY",
  },
  {
    slug: "team",
    name: "Team",
    priceMonthly: 149,
    priceYearly: 119,
    description: "For teams with multiple agents and shared governance.",
    limits: { projects: UNLIMITED, endpoints: 100, requestsPerMonth: 500_000 },
    polarProductIdEnv: "POLAR_PRODUCT_TEAM",
    polarProductIdEnvYearly: "POLAR_PRODUCT_TEAM_YEARLY",
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    priceMonthly: null,
    priceYearly: null,
    description: "Custom limits, compliance, and dedicated support.",
    limits: {
      projects: UNLIMITED,
      endpoints: UNLIMITED,
      requestsPerMonth: UNLIMITED,
    },
  },
  {
    // Accounts that predate billing. Never sold, never shown — assigned by the
    // backfill in the billing migration so existing cloud users are not
    // retroactively throttled by the `free` column default.
    slug: "grandfathered",
    name: "Grandfathered",
    priceMonthly: null,
    priceYearly: null,
    description: "Legacy account with no plan limits.",
    limits: {
      projects: UNLIMITED,
      endpoints: UNLIMITED,
      requestsPerMonth: UNLIMITED,
    },
    internal: true,
  },
];

const FREE = PLAN_REGISTRY[0];

/** Never throws: an unknown slug (e.g. a plan removed from the registry while
 *  a user row still points at it) degrades to Free rather than 500ing. */
export function getPlanDef(slug: string | null | undefined): PlanDef {
  return PLAN_REGISTRY.find((p) => p.slug === slug) ?? FREE;
}

/** Public plans, in price order — what the pricing page and billing UI show. */
export function publicPlans(): PlanDef[] {
  return PLAN_REGISTRY.filter((p) => !p.internal);
}

export type BillingCycle = "monthly" | "annual";

/** Maps a Polar product id back to a plan — monthly or annual, either counts
 *  as that plan for entitlement purposes. Resolved through the env
 *  indirection so the same code works against sandbox and production
 *  products. */
export function getPlanForProductId(productId: string): PlanDef | undefined {
  return PLAN_REGISTRY.find(
    (p) =>
      (p.polarProductIdEnv && process.env[p.polarProductIdEnv] === productId) ||
      (p.polarProductIdEnvYearly && process.env[p.polarProductIdEnvYearly] === productId),
  );
}

/** The Polar product id for a plan's billing cycle, or undefined when that
 *  cycle has no checkout configured. */
export function getPolarProductId(
  plan: PlanDef,
  cycle: BillingCycle = "monthly",
): string | undefined {
  const envName = cycle === "annual" ? plan.polarProductIdEnvYearly : plan.polarProductIdEnv;
  return envName ? process.env[envName] : undefined;
}

/** The `slug` a plan's billing cycle checks out under — see polarPlugin() in
 *  auth.ts, which registers one Polar checkout slug per (plan, cycle) pair. */
export function checkoutSlug(plan: PlanDef, cycle: BillingCycle): string {
  return cycle === "annual" ? `${plan.slug}-annual` : plan.slug;
}
