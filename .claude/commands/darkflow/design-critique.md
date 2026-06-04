Run a scored design review with persona tests and automated detection, then create `status:proposed` GitHub issues for each finding.

## Step 1 — Read project config

Run `bash .darkflow.d/get-config.sh` to pull the latest project settings from the Web UI and refresh the local `.darkflow` cache (silently falls back to cache if the server is unreachable).

Read `.darkflow` in the project root. Extract:
- `language=` → output/issue language (default: English)

If `.darkflow` is missing, continue with defaults.

## Step 2 — Do the work

/impeccable:critique

After the critique is complete, create a GitHub issue for each significant finding:
- Labels: `status:proposed`, `source:design`, priority based on impact:
  - `priority:p1` — broken or confusing user journeys, low design score on key flows
  - `priority:p2` — friction points, persona test failures, inconsistent patterns
  - `priority:p3` — minor UX polish, low-impact scoring gaps
- Do not create issues for findings already tracked in open GitHub issues

**Issue format (required):**

- **Title**: action-oriented verb — "Fix confusing CTA hierarchy on pricing page", "Clarify empty state on projects list", "Improve onboarding flow for first-time users" — never a bare observation
- **Body**:
  ```
  ## Problem
  <what was found, which persona was tested, what friction or failure occurred>

  ## What to do
  <concrete change — specific page, flow, copy, or component>

  ## Acceptance criteria
  - [ ] <verifiable outcome 1>
  - [ ] <verifiable outcome 2 if needed>
  ```

Language for all GitHub issues and output: the `language=` value from `.darkflow`.

## Step 3 — Write snapshot

Write `docs/insights/design-critique/YYYY-MM-DD.md` (use today's date; append a new section if today's file already exists):

```markdown
# Design Critique — YYYY-MM-DD

**Tool:** impeccable:critique
**Scope:** <pages / flows reviewed>

## Score Summary

| Area | Score | vs Previous |
|---|---|---|
| | /10 | ↑ / ↓ / — |

## Persona Test Results

| Persona | Flow | Outcome | Notes |
|---|---|---|---|
| | | pass / fail / friction | |

## Findings

| Page / Component | Problem | Severity |
|---|---|---|
| | | p1 / p2 / p3 |

## Recurring Issues

<findings appearing in 2+ consecutive critiques — note how many in a row>

## Recommendations

<each with: page/flow → what to improve → acceptance criterion>
```

## Step 4 — Write metrics

Run `gh issue list --state open --json number,labels --limit 200`, then:
- Count issues with label `source:design` → `openIssues`
- Count those with `priority:p1` → `criticalOpen`
- Derive `status`: `"warning"` if `criticalOpen > 0`, `"warning"` if `openIssues > 5`, `"ok"` otherwise

Write `.darkflow.d/state/metrics/design-critique.json` (create parent directories if needed):

```json
{
  "openIssues":   <integer>,
  "criticalOpen": <integer>,
  "status":       "ok" | "warning"
}
```

The worker will pick up this file on its next sync. You do not need to update any HTML files.
