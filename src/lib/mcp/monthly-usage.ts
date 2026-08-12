import { db } from "@/lib/db";
import { currentMonth } from "@/lib/plan-limits";
import { UNLIMITED } from "@/lib/plans";

type MonthlyUsageDb = {
  $queryRaw: typeof db.$queryRaw;
};

export type MonthlyUsageDecision = {
  allowed: boolean;
  count: number;
  month: string;
};

export type CheckMonthlyUsageOptions = {
  userId: string;
  limit: number;
  now?: Date;
  database?: MonthlyUsageDb;
};

/**
 * Increments the owner's monthly MCP request counter and reports whether the
 * plan quota is still intact. One atomic round-trip that returns the running
 * total — same shape as checkRateLimit, for the same reason: an aggregate over
 * a growing log table on every request is not affordable.
 */
export async function checkMonthlyUsage({
  userId,
  limit,
  now = new Date(),
  database = db,
}: CheckMonthlyUsageOptions): Promise<MonthlyUsageDecision> {
  const month = currentMonth(now);

  if (limit === UNLIMITED) {
    return { allowed: true, count: 0, month };
  }

  const result = await database.$queryRaw<{ count: number }[]>`
    INSERT INTO "monthly_usage" ("userId", "month", "count")
    VALUES (${userId}, ${month}, 1)
    ON CONFLICT ("userId", "month")
    DO UPDATE SET "count" = "monthly_usage"."count" + 1
    RETURNING "count"
  `;
  const count = Number(result[0]?.count ?? 1);

  return { allowed: count <= limit, count, month };
}
