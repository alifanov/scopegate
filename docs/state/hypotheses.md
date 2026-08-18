# Hypotheses

Central ledger for observations that haven't crossed the task-creation threshold yet
(see `.darkflow.d/claude.md` → *Observation → task*). One entry per bet, ID `H-NNN`,
status `tracking` → `testing` → `confirmed`/`refuted`/`abandoned`. Read this before
filing a task from a recurring finding — a refuted hypothesis doesn't come back
without new data.

## Tracking

| ID | Bet | Evidence | Status |
|---|---|---|---|
| H-003 | No analytics instrumentation (no OpenPanel MCP, no client-side tracking) — landing→signup funnel changes shipped this week are unmeasured | 1/3 — [2026-08-13](../logs/2026-08-13.md) | tracking |
| H-004 | `state/` is only updated when a routine is explicitly doing docs work — feature commits never touch it, so drift accumulates in bursts rather than gradually | 1/3 — [2026-08-15](../logs/2026-08-15.md): all 8 drift findings trace to one commit wave (54e575b, f015f8e, bfca673, 4f1f78e, 2026-08-12…08-14), none of which touched `docs/state/`. Next audit checks whether tasks #234–#239 landed *and* whether the wave after them left new drift | tracking |
| H-005 | `GET /pricing` p99 latency (~1.8s) on `scopegate-cloud` — above the 1s "slow" threshold, first sighting | 1/3 — [2026-08-18](../logs/2026-08-18.md): 1812.1ms p99, DB queries in the same window all ≤9.1ms so not a DB-bound cause; no prior observability snapshot (08-11…08-17) shows this route | tracking |

## Closed

| ID | Bet | Verdict | Evidence |
|---|---|---|---|
| H-001 | Search Console `inspect_url` p99 (~5s) drags MCP tool + service-fetch latency for that provider | confirmed — external, already mitigated | 3/3 — [2026-08-11](../logs/2026-08-11.md), [2026-08-12](../logs/2026-08-12.md), [2026-08-13](../logs/2026-08-13.md). Google's URL Inspection API is inherently slow; code already sets an explicit 30s timeout for `/urlInspection/` (`URL_INSPECTION_TIMEOUT_MS`, `src/lib/mcp/google-search-console.ts:9`) with a comment documenting the prior 5s-timeout incident. No further action — same run surfaced a related but distinct bug on non-inspection GSC endpoints, filed as task #225. |
| H-002 | `/api/mcp/[apiKey]` 400-rate reflects malformed client requests, not a server defect | refuted — not malformed requests; single identified cause, external protocol-version skew, not a defect | Task #227, queried SigNoz directly for `event: "mcp.invalid_request"` (`route.ts:260`, now `console.warn`) over 2026-08-13 08:42 UTC → 2026-08-16 06:xx UTC: 233 hits total, 200/200 sampled `body_preview`s classified. 100% are one pattern: well-formed JSON-RPC `method: "server/discover"` calls with `params._meta["io.modelcontextprotocol/clientInfo"].name = "claude-code"` (versions 2.1.231–2.1.233, spanning the window as Claude Code auto-updated) and `protocolVersion: "2026-07-28"`. `server/discover` isn't a method the pinned `@modelcontextprotocol/sdk@~1.26.0` transport recognizes (latest published: 1.30.0), so it 400s — this is a capability-discovery probe from an evolving MCP client hitting a server pinned to an older SDK, not malformed input, not bot/scanner noise, not a schema regression from a recent change. No task filed: single-source observation below the 3-run/2-source threshold (`.darkflow.d/claude.md` → *Observation → task*); if `server/discover` support ever matters, the fix is a routine SDK bump. |
