Check application errors, slow endpoints, database performance, and request volumes, then create status:proposed GitHub issues.

## Step 1 — Read project config

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

## Step 3 — After completing

Append a routine-log entry to `docs/overview.html`:

1. Read `docs/overview.html`
2. In the JSON inside `<script id="overview-data">`, append to the `logs` array:
   ```json
   { "timestamp": "<current UTC ISO 8601>", "routine": "observability-check", "summary": "<one-line summary, e.g. '2 new error spikes, 1 slow endpoint → 3 issues opened'>" }
   ```
3. Cap the array at the 50 most recent entries (drop older ones if it exceeds 50)
4. Write `docs/overview.html` — change nothing else in the JSON
