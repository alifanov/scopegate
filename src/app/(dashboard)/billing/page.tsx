import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isCloud } from "@/lib/cloud";
import { getCurrentUser } from "@/lib/auth-middleware";
import { publicPlans } from "@/lib/plans";
import { currentMonth } from "@/lib/plan-limits";
import { BillingClient } from "./billing-client";

export const metadata = { title: "Billing" };

export default async function BillingPage() {
  // Self-hosted has no plans and no payments — the whole route is absent there.
  if (!isCloud()) {
    notFound();
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/billing");
  }

  const [row, projects, endpoints, usage] = await Promise.all([
    db.user.findUnique({
      where: { id: user.userId },
      select: { planSlug: true, planStatus: true, planValidUntil: true },
    }),
    db.teamMember.count({ where: { userId: user.userId, role: "owner" } }),
    db.mcpEndpoint.count({
      where: {
        project: { teamMembers: { some: { userId: user.userId, role: "owner" } } },
      },
    }),
    db.monthlyUsage.findUnique({
      where: { userId_month: { userId: user.userId, month: currentMonth() } },
      select: { count: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Your plan, usage, and payment method.
        </p>
      </div>
      <BillingClient
        plans={publicPlans()}
        currentSlug={row?.planSlug ?? "free"}
        planStatus={row?.planStatus ?? null}
        planValidUntil={row?.planValidUntil?.toISOString() ?? null}
        usage={{
          projects,
          endpoints,
          requestsThisMonth: usage?.count ?? 0,
        }}
        checkoutAvailable={Boolean(process.env.POLAR_ACCESS_TOKEN)}
      />
    </div>
  );
}
