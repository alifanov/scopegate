import { db } from "./db";
import { getPlanForProductId } from "./plans";

// Polar is the system of record for subscriptions; these handlers mirror its
// state onto the User row so the request path can resolve a plan locally.
//
// customer.state_changed is the only event we act on: it is idempotent and
// carries the full current state (all active subscriptions), so replays and
// out-of-order delivery converge on the same result. Reacting to individual
// order/subscription events would have to reconstruct that state by hand.

export type PolarCustomerState = {
  id: string;
  externalId?: string | null;
  activeSubscriptions?: Array<{
    productId: string;
    status?: string | null;
    currentPeriodEnd?: string | Date | null;
  }> | null;
};

type BillingDb = {
  user: { update: typeof db.user.update };
};

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Applies a Polar customer state to the matching user.
 *
 * `externalId` is the ScopeGate user id — Polar stores it because the plugin is
 * configured with `createCustomerOnSignUp: true`. Without it we cannot attribute
 * the state to an account, so the event is ignored rather than guessed at.
 */
export async function applyCustomerState(
  state: PolarCustomerState,
  { database = db as unknown as BillingDb }: { database?: BillingDb } = {},
): Promise<{ applied: boolean; planSlug: string | null }> {
  const userId = state.externalId;
  if (!userId) {
    console.warn("[ScopeGate] Polar customer state without externalId — ignored", {
      customerId: state.id,
    });
    return { applied: false, planSlug: null };
  }

  // Pick the highest-value active subscription that maps to a known plan. A
  // customer normally has at most one, but Polar allows several and we must be
  // deterministic rather than depending on array order.
  const candidates = (state.activeSubscriptions ?? [])
    .map((sub) => ({ sub, plan: getPlanForProductId(sub.productId) }))
    .filter((c): c is { sub: (typeof c)["sub"]; plan: NonNullable<(typeof c)["plan"]> } =>
      Boolean(c.plan),
    )
    .sort((a, b) => (b.plan.priceMonthly ?? 0) - (a.plan.priceMonthly ?? 0));

  const winner = candidates[0];

  await database.user.update({
    where: { id: userId },
    data: {
      polarCustomerId: state.id,
      planSlug: winner?.plan.slug ?? "free",
      planStatus: winner?.sub.status ?? null,
      planValidUntil: toDate(winner?.sub.currentPeriodEnd),
    },
  });

  return { applied: true, planSlug: winner?.plan.slug ?? "free" };
}
