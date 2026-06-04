Review Google Search Console data for the last week and create status:proposed GitHub issues with SEO recommendations.

## Step 1 — Read project config

Run `bash .darkflow.d/get-config.sh` to pull the latest project settings from the Web UI and refresh the local `.darkflow` cache (silently falls back to cache if the server is unreachable).

Read `.darkflow` in the project root. Extract:
- `language=` → output/issue language (default: English)

If `.darkflow` is missing, continue with the default.

## Step 2 — Do the work

**IMPORTANT: Never use the browser to access Google Search Console. All GSC data must be fetched exclusively via the Google Search Console MCP tools. If the GSC MCP is not connected or its tools are unavailable, stop immediately and output an error:**

```
ERROR: Google Search Console MCP is not connected.
Connect the GSC MCP in your project's .claude/settings.json and retry.
```

Do not fall back to browser automation or any other method.

Check Google Search Console data for the last week using MCP tools. Analyse positions, CTR, impressions, and indexing issues. Suggest what to do to improve them.

Add all recommendations as GitHub Issues to the remote GitHub repository of this project. Use labels: `status:proposed`, `source:gsc`, `area:landing`, `priority:*`, `effort:*`.

**Issue format (required):**

- **Title**: action-oriented verb — "Improve title tag on /pricing", "Fix missing meta description for /blog/*", "Add structured data to product pages" — never just a statement of the finding ("Low CTR on /pricing", "Missing meta tags")
- **Body**:
  ```
  ## Problem
  <metric, current value, affected URL or page group>

  ## What to do
  <concrete SEO action — specific tag, content, or config to change>

  ## Acceptance criteria
  - [ ] <verifiable outcome, e.g. "CTR on /pricing rises above 3% within 4 weeks">
  - [ ] <additional criterion if needed>
  ```

Write a GSC snapshot to `docs/insights/search-console/YYYY-MM-DD.md` before posting recommendations.

Language for all GitHub issues and output: the `language=` value from `.darkflow`.

## Step 3 — After completing

Save a GSC snapshot so the Dark Flow worker can forward it to the web UI.

Run `gh issue list --state open --json number,labels --limit 200`, then:
- Count issues with label `source:gsc` → `openIssues`
- Derive `status`: `"warning"` if openIssues > 5, `"ok"` otherwise

Write `.darkflow.d/state/metrics/gsc.json` (create parent directories if needed):

```json
{
  "openIssues": <integer>,
  "status":     "ok" | "warning"
}
```

The worker will pick up this file on its next sync. You do not need to update any HTML files.
