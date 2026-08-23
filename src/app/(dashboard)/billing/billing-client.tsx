"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { UNLIMITED, checkoutSlug, getPlanDef, type BillingCycle, type PlanDef } from "@/lib/plans";
import { toast } from "sonner";

export type Usage = {
  projects: number;
  endpoints: number;
  requestsThisMonth: number;
};

function formatLimit(value: number): string {
  return value === UNLIMITED ? "Unlimited" : value.toLocaleString("en-US");
}

function UsageRow({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const atLimit = limit !== UNLIMITED && used >= limit;
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={atLimit ? "font-medium text-destructive" : "font-medium"}>
        {used.toLocaleString("en-US")} / {formatLimit(limit)}
      </span>
    </div>
  );
}

export function BillingClient({
  plans,
  currentSlug,
  planStatus,
  planValidUntil,
  usage,
  checkoutAvailable,
  initialCycle = "monthly",
}: {
  plans: PlanDef[];
  currentSlug: string;
  planStatus: string | null;
  planValidUntil: string | null;
  usage: Usage;
  checkoutAvailable: boolean;
  initialCycle?: BillingCycle;
}) {
  const [pending, setPending] = useState<string | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>(initialCycle);
  // getPlanDef never throws, and knows about internal plans (e.g.
  // grandfathered) that `plans` (publicPlans()) deliberately omits — looking
  // up in `plans` here would leak the raw slug to the badge below.
  const current = getPlanDef(currentSlug);
  const currentLimits = current.limits;
  const annual = cycle === "annual";

  async function startCheckout(plan: PlanDef) {
    setPending(plan.slug);
    try {
      await authClient.checkout({ slug: checkoutSlug(plan, cycle) });
    } catch {
      toast.error("Could not open checkout. Please try again.");
      setPending(null);
    }
  }

  async function openPortal() {
    setPending("portal");
    try {
      await authClient.customer.portal();
    } catch {
      toast.error("Could not open the billing portal. Please try again.");
      setPending(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Current plan</CardTitle>
            <Badge variant="secondary">{current.name}</Badge>
            {planStatus && planStatus !== "active" && (
              <Badge variant="destructive">{planStatus}</Badge>
            )}
          </div>
          <CardDescription>
            {current.internal
              ? "Legacy account — no plan limits apply."
              : planValidUntil
                ? `Renews ${new Date(planValidUntil).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}`
                : "No active subscription"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <UsageRow label="Projects" used={usage.projects} limit={currentLimits.projects} />
          <UsageRow label="MCP endpoints" used={usage.endpoints} limit={currentLimits.endpoints} />
          <UsageRow
            label="Requests this month"
            used={usage.requestsThisMonth}
            limit={currentLimits.requestsPerMonth}
          />
        </CardContent>
        {planStatus && (
          <CardFooter>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={openPortal}
              disabled={pending !== null}
            >
              Manage subscription
            </Button>
          </CardFooter>
        )}
      </Card>

      <div className="flex items-center justify-center gap-3">
        <span className={`text-sm ${!annual ? "font-medium" : "text-muted-foreground"}`}>
          Monthly
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={annual}
          aria-label="Toggle annual billing"
          onClick={() => setCycle(annual ? "monthly" : "annual")}
          className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
            annual ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full shadow transition-transform ${
              annual ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <span className={`text-sm ${annual ? "font-medium" : "text-muted-foreground"}`}>
          Annual <span className="text-emerald-600 dark:text-emerald-400">save 20%</span>
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const isCurrent = plan.slug === currentSlug;
          const productField = annual ? plan.polarProductIdEnvYearly : plan.polarProductIdEnv;
          const purchasable = checkoutAvailable && Boolean(productField);
          const price = annual ? plan.priceYearly : plan.priceMonthly;
          return (
            <Card key={plan.slug} className={isCurrent ? "border-primary" : undefined}>
              <CardHeader>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription>
                  {price === null ? "Custom pricing" : price === 0 ? "Free" : `$${price}/mo`}
                  {annual && price !== null && price !== 0 && " · billed annually"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div>{formatLimit(plan.limits.projects)} projects</div>
                <div>{formatLimit(plan.limits.endpoints)} MCP endpoints</div>
                <div>{formatLimit(plan.limits.requestsPerMonth)} requests / month</div>
              </CardContent>
              <CardFooter>
                {isCurrent ? (
                  <Button variant="secondary" className="w-full" disabled>
                    Current plan
                  </Button>
                ) : purchasable ? (
                  <Button
                    className="w-full cursor-pointer"
                    onClick={() => startCheckout(plan)}
                    disabled={pending !== null}
                  >
                    {pending === plan.slug ? "Opening…" : `Upgrade to ${plan.name}`}
                  </Button>
                ) : plan.priceMonthly === null ? (
                  <Button asChild variant="outline" className="w-full cursor-pointer">
                    <a href="mailto:hello@scopegate.dev">Contact sales</a>
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    Unavailable
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
