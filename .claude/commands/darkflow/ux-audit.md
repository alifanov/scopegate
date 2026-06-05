Run a UX and visual quality review, then create status:proposed GitHub issues for each finding.

## Step 1 — Read project config

Run `bash .darkflow.d/get-config.sh` to pull the latest project settings from the Web UI and refresh the local `.darkflow` cache (silently falls back to cache if the server is unreachable).

Read `.darkflow` in the project root. Extract:
- `language=` → output/issue language (default: English)

If `.darkflow` is missing, continue with the default.

## Step 2 — Do the work

/impeccable

After the review is complete, create a GitHub issue for each significant finding:
- Labels: `status:proposed`, `source:ux-audit`, priority based on impact (`priority:high` = broken UX or inaccessible, `priority:medium` = significant friction), `area:ui` / `area:ux` / `area:landing` as appropriate. **Polish-level findings → do NOT create an issue** — note them in the snapshot only
- Focus on actionable problems: broken layouts, missing states (empty/loading/error), accessibility failures, confusing flows, inconsistent components
- Do not create issues for pure stylistic preferences or findings already tracked in open GitHub issues

**Issue format (required):**

- **Title**: action-oriented verb — "Fix broken layout on /dashboard at mobile width", "Add empty state to settings table", "Improve contrast on primary CTA" — never a bare observation
- **Body**:
  ```
  ## Problem
  <what was found and why it hurts the user experience>

  ## What to do
  <concrete change — specific page, component, or CSS to fix>

  ## Acceptance criteria
  - [ ] <verifiable outcome 1>
  - [ ] <verifiable outcome 2 if needed>
  ```

Language for all GitHub issues and output: the `language=` value from `.darkflow`.

## Step 3 — Write docs snapshot

Write `docs/insights/ux-audit/YYYY-MM-DD.md` (use today's date; append a new section if today's file already exists):

```markdown
# UX Audit — YYYY-MM-DD

**Period:** <date range reviewed>

## Findings

| Page / Component | Problem | Severity | Screenshot / Recording |
|---|---|---|---|
| | | high (broken) / medium (friction) | |

## Recurring Issues

<issues appearing in 2+ consecutive audits — note how many audits in a row>

## Hypotheses

<pre-threshold signals that aren't yet ready for a GitHub issue — see agent-workflow.md>

## Recommendations

<each with: specific page/component → what to fix → acceptance criterion>
```

## Step 4 — After completing

Save a UX snapshot so the Dark Flow worker can forward it to the web UI.

Run `gh issue list --state open --json number,labels --limit 200`, then:
- Count issues with label `source:ux-audit` → `openIssues`
- Count those with `priority:critical` or `priority:high` → `criticalOpen`
- Derive `status`: `"warning"` if criticalOpen > 0, `"ok"` otherwise

Write `.darkflow.d/state/metrics/ux.json` (create parent directories if needed):

```json
{
  "openIssues":   <integer>,
  "criticalOpen": <integer>,
  "status":       "ok" | "warning"
}
```

The worker will pick up this file on its next sync. You do not need to update any HTML files.
