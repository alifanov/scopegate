Check application errors, slow endpoints, database performance, and request volumes, then create status:proposed GitHub issues.

## Step 1 — Read project config

Run `bash .darkflow.d/get-config.sh` to pull the latest project settings from the Web UI and refresh the local `.darkflow` cache (silently falls back to cache if the server is unreachable).

Read `.darkflow` in the project root. Extract:
- `language=` → output/issue language (default: English)

If `.darkflow` is missing, continue with the default.

## Step 2 — Do the work

Check the observability tool configured for this project (SigNoz, Datadog, Grafana, or equivalent). Specifically:

1. **Errors** — new or spiking error rates in the last 24h; group by error type
2. **Slow endpoints** — URLs with p95 latency > 1s; note the slowest 5
3. **Database queries** — slow queries (> 100ms), N+1 patterns, queries without indexes, highest-volume queries per endpoint
4. **Request volume** — unusual spikes or drops vs the previous 7-day average
5. **Integration health** — are all services reporting? Any gaps in traces or missing spans?

For each finding:
- State the metric and its current value
- Compare to the previous period (yesterday / last week)
- Suggest a concrete fix (add index, cache result, paginate query, etc.)

Create a GitHub issue for each significant finding. Use labels: `status:proposed`, `source:signoz` (or the relevant observability tool), `area:api` / `area:worker` / `area:infra`, `priority:*`, `effort:*`.

Priority vocabulary: `priority:critical` / `priority:high` / `priority:medium` / `priority:low`. **Only create issues for `critical` / `high` / `medium`** — `low`-priority findings are skipped (record them under Hypotheses in the snapshot instead).

**Issue format (required):**

- **Title**: action-oriented verb — "Add index on X", "Cache Y endpoint", "Fix N+1 in Z" — never just a description of the symptom ("Slow endpoint detected", "High error rate on X")
- **Body**:
  ```
  ## Problem
  <metric, current value, comparison to previous period>

  ## What to do
  <concrete fix — specific table, query, endpoint, or config to change>

  ## Acceptance criteria
  - [ ] <measurable outcome, e.g. "p95 latency on /api/users drops below 500ms">
  - [ ] <additional criterion if needed>
  ```

Language for all GitHub issues and output: the `language=` value from `.darkflow`.

## Step 3 — Write docs snapshot

Write `docs/insights/observability/YYYY-MM-DD.md` (use today's date; append a new section if today's file already exists):

```markdown
# Observability Review — YYYY-MM-DD

**Tool:** <SigNoz / Datadog / Grafana / other>
**Period:** last 24h

## Key Metrics

| Metric | Value | vs yesterday |
|---|---|---|
| Error rate | | |
| p95 latency (slowest endpoint) | | |
| Slow queries (> 100ms) | | |
| Request volume | | |

## Findings

<list significant findings — group by: errors / latency / DB / integrations>

## Recurring Issues

<issues appearing in 2+ consecutive snapshots — note how many snapshots in a row>

## Hypotheses

<pre-threshold signals that aren't yet ready for a GitHub issue — see agent-workflow.md>

## Recommendations

<each with: metric-basis → specific fix → expected outcome>
```

## Step 4 — After completing

Save an observability snapshot so the Dark Flow worker can forward it to the web UI.

Run `gh issue list --state open --json number,labels --limit 200`, then:
- Count issues with label `source:signoz` (or the relevant observability tool) → `openIssues`
- Count those with `priority:critical` or `priority:high` → `criticalOpen`
- Derive `status`: `"critical"` if criticalOpen > 0, `"warning"` if openIssues > 5, `"ok"` otherwise

Write `.darkflow.d/state/metrics/observability.json` (create parent directories if needed):

```json
{
  "openIssues":   <integer>,
  "criticalOpen": <integer>,
  "status":       "ok" | "warning" | "critical"
}
```

The worker will pick up this file on its next sync. You do not need to update any HTML files.
