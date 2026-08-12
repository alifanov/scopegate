import { db } from "./db";
import { isCloud } from "./cloud";
import { AuthError } from "./auth-middleware";
import { getPlanDef, UNLIMITED, type PlanLimits } from "./plans";

// Plan enforcement. Every entry point here is a no-op when SCOPEGATE_CLOUD is
// unset, so a self-hosted deployment pays neither the queries nor the limits.
//
// Quota is always attributed to the PROJECT OWNER, not to the caller —
// otherwise a Free-plan teammate acting inside a Pro user's project would be
// blocked by their own plan.

/** 402 Payment Required — mapped to a response by the existing authErrorResponse. */
export class PlanLimitError extends AuthError {
  constructor(message: string) {
    super(message, 402);
  }
}

type Database = {
  user: { findUnique: typeof db.user.findUnique };
  teamMember: { count: typeof db.teamMember.count; findFirst: typeof db.teamMember.findFirst };
  mcpEndpoint: { count: typeof db.mcpEndpoint.count };
};

type Deps = { database?: Database; cloud?: boolean };

export async function getUserLimits(
  userId: string,
  { database = db as unknown as Database }: { database?: Database } = {},
): Promise<PlanLimits> {
  const user = await database.user.findUnique({
    where: { id: userId },
    select: { planSlug: true },
  });
  return getPlanDef(user?.planSlug).limits;
}

/** The owner of a project — the account whose plan governs it. */
export async function resolveProjectOwnerId(
  projectId: string,
  { database = db as unknown as Database }: { database?: Database } = {},
): Promise<string | null> {
  const owner = await database.teamMember.findFirst({
    where: { projectId, role: "owner" },
    select: { userId: true },
  });
  return owner?.userId ?? null;
}

/**
 * Throws PlanLimitError when the owner is already at their plan's ceiling for
 * `key`. Counting happens across every project the user owns, so the limit
 * describes the account rather than a single project.
 */
export async function assertWithinLimit(
  ownerUserId: string,
  key: "projects" | "endpoints",
  { database = db as unknown as Database, cloud = isCloud() }: Deps = {},
): Promise<void> {
  if (!cloud) return;

  const limits = await getUserLimits(ownerUserId, { database });
  const max = limits[key];
  if (max === UNLIMITED) return;

  const used =
    key === "projects"
      ? await database.teamMember.count({
          where: { userId: ownerUserId, role: "owner" },
        })
      : await database.mcpEndpoint.count({
          where: {
            project: {
              teamMembers: { some: { userId: ownerUserId, role: "owner" } },
            },
          },
        });

  if (used >= max) {
    const noun = key === "projects" ? "projects" : "MCP endpoints";
    throw new PlanLimitError(
      `Your plan allows ${max} ${noun}. Upgrade at /billing to add more.`,
    );
  }
}

/** "2026-08" — the bucket key for monthly request quotas. */
export function currentMonth(now: Date = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}
