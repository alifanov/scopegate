# Hypotheses

Central ledger for observations that haven't crossed the task-creation threshold yet
(see `.darkflow.d/claude.md` → *Observation → task*). One entry per bet, ID `H-NNN`,
status `tracking` → `testing` → `confirmed`/`refuted`/`abandoned`. Read this before
filing a task from a recurring finding — a refuted hypothesis doesn't come back
without new data.

## Tracking

| ID | Bet | Evidence | Status |
|---|---|---|---|
| H-001 | Search Console `inspect_url` p99 (~5s) drags MCP tool + service-fetch latency for that provider | 2/3 — [2026-08-11](../logs/2026-08-11.md), [2026-08-12](../logs/2026-08-12.md) | tracking |
| H-002 | `/api/mcp/[apiKey]` 400-rate reflects malformed client requests, not a server defect | 2/3 — 52 reqs (0.11%) [2026-08-11](../logs/2026-08-11.md) → 582 reqs (0.74%) [2026-08-12](../logs/2026-08-12.md) | tracking |
| H-003 | No analytics instrumentation (no OpenPanel MCP, no client-side tracking) — landing→signup funnel changes shipped this week are unmeasured | 1/3 — [2026-08-13](../logs/2026-08-13.md) | tracking |

## Closed

_None yet._
