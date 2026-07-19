// Shared primitives for the "create container, poll until ready, publish" state
// machine used by both Threads and Instagram media/carousel publishing.

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Caps a step's preferred timeout against what's actually left of the overall budget,
// reserving `reserveMs` for the step(s) after it, with a floor so a near-exhausted
// budget still gets one last real attempt instead of an instant-timeout request.
export function computeStepTimeout(
  preferredMs: number,
  deadline: number,
  now: number,
  reserveMs: number,
  minMs = 1_000
): number {
  return Math.min(preferredMs, Math.max(minMs, deadline - now - reserveMs));
}

// True once another poll iteration wouldn't finish before the deadline anyway.
export function shouldStopPolling(
  now: number,
  deadline: number,
  intervalMs: number
): boolean {
  return now + intervalMs >= deadline;
}

export type ContainerPollOutcome =
  | { kind: "ready" }
  | { kind: "pending" }
  | { kind: "failed"; message: string };

export type ContainerStatusValue =
  | "EXPIRED"
  | "ERROR"
  | "FINISHED"
  | "IN_PROGRESS"
  | "PUBLISHED"
  | undefined;

// Classifies one status-poll response. Meta's container lifecycle (shared by both
// Threads and Instagram) is IN_PROGRESS → FINISHED (ready to publish) or IN_PROGRESS →
// ERROR/EXPIRED (unrecoverable). `label` names the provider in the error message.
export function classifyContainerStatus(
  result: { status: ContainerStatusValue; errorMessage?: string },
  label: string
): ContainerPollOutcome {
  if (result.status === "FINISHED") return { kind: "ready" };
  if (result.status === "ERROR" || result.status === "EXPIRED") {
    return {
      kind: "failed",
      message: `${label} media processing ${result.status.toLowerCase()}: ${result.errorMessage ?? "unknown error"}`,
    };
  }
  return { kind: "pending" };
}

// Polls a media container until it reaches FINISHED. Returns true once ready, false if
// the deadline passes while still pending. Throws if the provider reports ERROR/EXPIRED.
// `fetchStatus` does the provider-specific request + field mapping into ContainerPollOutcome.
export async function waitForContainerReady(
  deadline: number,
  intervalMs: number,
  fetchStatus: () => Promise<ContainerPollOutcome>
): Promise<boolean> {
  while (Date.now() < deadline) {
    const outcome = await fetchStatus();
    if (outcome.kind === "ready") return true;
    if (outcome.kind === "failed") throw new Error(outcome.message);
    if (shouldStopPolling(Date.now(), deadline, intervalMs)) break;
    await sleep(intervalMs);
  }
  return false;
}
