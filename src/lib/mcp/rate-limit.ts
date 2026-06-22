import { db } from "@/lib/db";

type RateLimitDb = {
  $queryRaw: typeof db.$queryRaw;
};

export type RateLimitDecision = {
  allowed: boolean;
  count: number;
  windowStart: Date;
};

export type CheckRateLimitOptions = {
  endpointId: string;
  limitPerMinute: number;
  now?: Date;
  database?: RateLimitDb;
};

export async function checkRateLimit({
  endpointId,
  limitPerMinute,
  now = new Date(),
  database = db,
}: CheckRateLimitOptions): Promise<RateLimitDecision> {
  const windowStart = new Date(Math.floor(now.getTime() / 60_000) * 60_000);
  const result = await database.$queryRaw<{ count: number }[]>`
    INSERT INTO "rate_limit_bucket" ("endpointId", "windowStart", "count")
    VALUES (${endpointId}, ${windowStart}, 1)
    ON CONFLICT ("endpointId", "windowStart")
    DO UPDATE SET "count" = "rate_limit_bucket"."count" + 1
    RETURNING "count"
  `;
  const count = Number(result[0]?.count ?? 1);

  return {
    allowed: count <= limitPerMinute,
    count,
    windowStart,
  };
}
