Run an architectural analysis of the codebase and create status:proposed GitHub issues for each significant finding.

## Step 1 — Read project config

Run `bash .darkflow.d/get-config.sh` to pull the latest project settings from the Web UI and refresh the local `.darkflow` cache (silently falls back to cache if the server is unreachable).

Read `.darkflow` in the project root. Extract:
- `language=` → output/issue language (default: English)

If `.darkflow` is missing, continue with the default.

## Step 2 — Do the work

/improve-codebase-architecture

After the review is complete, create a GitHub issue for each significant finding:
- Labels: `status:proposed`, `source:manual`, `area:architecture` + area matching the affected module, priority based on impact, `effort:m` or `effort:l`
- Focus on actionable improvements, not style preferences
- Do not create issues for findings already tracked in open GitHub issues

Language for all GitHub issues and output: the `language=` value from `.darkflow`.

## Step 3 — After completing

Save an architecture snapshot so the Dark Flow worker can forward it to the web UI.

Run `gh issue list --state open --json number,labels --limit 200`, then:
- Count issues with label `area:architecture` → `openIssues`
- Derive `status`: `"warning"` if openIssues > 10, `"ok"` otherwise

Write `.darkflow.d/state/metrics/architecture.json` (create parent directories if needed):

```json
{
  "openIssues": <integer>,
  "status":     "ok" | "warning"
}
```

The worker will pick up this file on its next sync. You do not need to update any HTML files.
