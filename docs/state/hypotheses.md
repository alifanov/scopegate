# Hypotheses

Central ledger for observations that haven't crossed the task-creation threshold yet
(see `.darkflow.d/claude.md` → *Observation → task*). One entry per bet, ID `H-NNN`,
status `tracking` → `testing` → `confirmed`/`refuted`/`abandoned`. Read this before
filing a task from a recurring finding — a refuted hypothesis doesn't come back
without new data.

## Tracking

| ID | Bet | Evidence | Status |
|---|---|---|---|
| H-002 | `/api/mcp/[apiKey]` 400-rate reflects malformed client requests, not a server defect | 3/3 — 52 reqs (0.11%) [2026-08-11](../logs/2026-08-11.md) → 582 reqs (0.74%) [2026-08-12](../logs/2026-08-12.md) → 262 reqs (0.48%) [2026-08-13](../logs/2026-08-13.md) — task #227 filed to classify `body_preview` samples | testing |
| H-003 | No analytics instrumentation (no OpenPanel MCP, no client-side tracking) — landing→signup funnel changes shipped this week are unmeasured | 1/3 — [2026-08-13](../logs/2026-08-13.md) | tracking |

## Closed

| ID | Bet | Verdict | Evidence |
|---|---|---|---|
| H-001 | Search Console `inspect_url` p99 (~5s) drags MCP tool + service-fetch latency for that provider | confirmed — external, already mitigated | 3/3 — [2026-08-11](../logs/2026-08-11.md), [2026-08-12](../logs/2026-08-12.md), [2026-08-13](../logs/2026-08-13.md). Google's URL Inspection API is inherently slow; code already sets an explicit 30s timeout for `/urlInspection/` (`URL_INSPECTION_TIMEOUT_MS`, `src/lib/mcp/google-search-console.ts:9`) with a comment documenting the prior 5s-timeout incident. No further action — same run surfaced a related but distinct bug on non-inspection GSC endpoints, filed as task #225. |
