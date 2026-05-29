Review analytics and recent commits, then create status:proposed GitHub issues.

## Step 1 — Read project config

Read `.darkflow` in the project root. Extract:
- `language=` → output/issue language (default: English)
- `posthog_project_id=` → PostHog project to query (if set)

If `.darkflow` is missing, continue with the defaults.

**If `posthog_project_id` is set:** switch the PostHog MCP to that project now — before any queries — using the `switch-project` tool.

<!-- Note: the detection block below (name-match → write ID) is mirrored in self-update.md Step 3. Keep both in sync when modifying. -->

**If `posthog_project_id` is NOT set:** use the PostHog MCP to list all available projects. Find the one whose name best matches the `name=` value from `.darkflow` (case-insensitive, partial match is fine). Switch to that project. Then persist the discovered ID back into `.darkflow`:

```bash
# on macOS
sed -i '' "s/^posthog_project_id=.*/posthog_project_id=<ID>/" .darkflow || echo "posthog_project_id=<ID>" >> .darkflow
# on Linux
grep -q "^posthog_project_id=" .darkflow && sed -i "s/^posthog_project_id=.*/posthog_project_id=<ID>/" .darkflow || echo "posthog_project_id=<ID>" >> .darkflow
```

This ensures that future runs always use the correct project without re-detection.

## Step 2 — Do the work

Check the latest commits for the last 24 hours. Check the latest analytics data (PostHog or the analytics tool configured for this project) for the last 24 hours. Check what changes (commits) happened over the last week.

Based on this, suggest improvements.

Before making recommendations, get data on: new user funnel, errors, any anomalies.

Add all recommendations as GitHub Issues to the remote GitHub repository of this project. Use labels: `status:proposed`, `source:posthog`, `area:*`, `priority:*`, `effort:*`.

**Issue format (required):**

- **Title**: action-oriented verb — "Add X to onboarding funnel", "Fix drop-off on Y step", "Instrument Z event" — never just a statement of observation ("Low conversion on step 2", "Anomaly detected in signups")
- **Body**:
  ```
  ## Problem
  <what the data shows and why it matters>

  ## What to do
  <concrete action — specific page, flow, component, or event to change>

  ## Acceptance criteria
  - [ ] <measurable outcome, e.g. "Step 2 → Step 3 conversion rises above 60%">
  - [ ] <additional criterion if needed>
  ```

Do NOT create recommendations about paid ads — that is handled by `/darkflow:ads-review`.

Write an analytics snapshot to `docs/insights/analytics/YYYY-MM-DD.md` before posting recommendations.

Language for all GitHub issues and output: the `language=` value from `.darkflow`.

## Step 3 — After completing

Save an analytics snapshot so the Dark Flow worker can forward it to the web UI.

Write `.darkflow.d/state/metrics/analytics.json` with the following structure (create parent
directories if they don't exist):

```json
{
  "usersTotal":  <integer or null>,
  "visitors7d":  <integer or null>,
  "revenue7d":   <float or null>,
  "adsSpend7d":  <float or null>,
  "currency":    "USD"
}
```

Fill in the values from the analytics data already queried in Step 2. Use `null` for any
metric that is not available for this project.

The worker will pick up this file on its next sync and forward it to the webapp API together
with the current issue list. You do not need to update any HTML files or call any API endpoints.
