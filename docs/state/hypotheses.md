# Hypotheses

Central ledger for observations that haven't crossed the task-creation threshold yet
(see `.darkflow.d/claude.md` → *Observation → task*). One entry per bet, ID `H-NNN`,
status `tracking` → `testing` → `confirmed`/`refuted`/`abandoned`. Read this before
filing a task from a recurring finding — a refuted hypothesis doesn't come back
without new data.

## Tracking

| ID | Bet | Evidence | Status |
|---|---|---|---|
| H-001 | Search Console `inspect_url` p99 (~5s) drags MCP tool + service-fetch latency for that provider | 1/3 — [2026-08-11](../logs/2026-08-11.md) | tracking |
| H-002 | `/api/mcp/[apiKey]` 400-rate (52 reqs / 24h, 0.11% of traffic) reflects malformed client requests, not a server defect | 1/3 — [2026-08-11](../logs/2026-08-11.md) | tracking |

## Closed

_None yet._
