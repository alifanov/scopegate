Run a five-dimension technical design quality check + UI performance audit, then create `status:proposed` GitHub issues for each finding.

## Step 1 — Read project config

Run `bash .darkflow.d/get-config.sh` to pull the latest project settings from the Web UI and refresh the local `.darkflow` cache (silently falls back to cache if the server is unreachable).

Read `.darkflow` in the project root. Extract:
- `language=` → output/issue language (default: English)

If `.darkflow` is missing, continue with defaults.

## Step 2 — Design quality audit

/impeccable:audit

After the audit is complete, create a GitHub issue for each significant finding:
- Labels: `status:proposed`, `source:design`, priority based on severity:
  - `priority:high` — broken layouts, inaccessible elements, missing critical states
  - `priority:medium` — visual inconsistency, spacing issues, unclear hierarchy
  - **polish / minor refinements → do NOT create an issue** — note them under Recommendations in the snapshot only
- Do not create issues for findings already tracked in open GitHub issues

**Issue format (required):**

- **Title**: action-oriented verb — "Fix broken grid on /dashboard at 375px", "Add error state to payment form", "Fix contrast ratio on primary button" — never a bare observation
- **Body**:
  ```
  ## Problem
  <what was found, which page/component, why it matters>

  ## What to do
  <concrete change — specific file, component, or CSS>

  ## Acceptance criteria
  - [ ] <verifiable outcome 1>
  - [ ] <verifiable outcome 2 if needed>
  ```

Language for all GitHub issues and output: the `language=` value from `.darkflow`.

## Step 3 — UI performance audit

/impeccable:optimize

After the performance audit is complete, create a GitHub issue for each significant finding:
- Labels: `status:proposed`, `source:design`, priority based on impact:
  - `priority:high` — LCP > 2.5s, CLS > 0.1, or bundle size regressions blocking interaction
  - `priority:medium` — measurable slowdowns, large unoptimized assets, render-blocking resources
  - **minor / nice-to-have optimizations → do NOT create an issue** — note them under Recommendations in the snapshot only
- Do not create issues for findings already tracked in open GitHub issues or covered by `build-optimization`

**Issue format (required):**

- **Title**: action-oriented verb — "Reduce LCP on /landing from 4s to <2.5s", "Lazy-load hero image on /home", "Remove render-blocking font on checkout page" — never a bare observation
- **Body**:
  ```
  ## Problem
  <metric / current value / target — specific page and element>

  ## What to do
  <concrete change — specific file, asset, or config>

  ## Acceptance criteria
  - [ ] <measurable outcome, e.g. "LCP drops below 2.5s on Lighthouse mobile">
  - [ ] <secondary check if needed>
  ```

## Step 4 — Write snapshot

Write `docs/insights/design-audit/YYYY-MM-DD.md` (use today's date; append a new section if today's file already exists):

```markdown
# Design Audit — YYYY-MM-DD

**Tools:** impeccable:audit + impeccable:optimize
**Scope:** <pages / components checked>

## Quality Findings

| Dimension | Finding | Severity | Page / Component |
|---|---|---|---|
| | | P0 / P1 / P2 / P3 | |

## Performance Findings

| Metric | Current | Target | Page | Issue |
|---|---|---|---|---|
| LCP | | < 2.5s | | #N |
| CLS | | < 0.1 | | |
| Bundle | | | | |

## Recurring Issues

<findings appearing in 2+ consecutive audits — note how many audits in a row>

## Recommendations

<each with: page/component → what to fix → acceptance criterion>
```

## Step 5 — Write metrics

Run `gh issue list --state open --json number,labels --limit 200`, then:
- Count issues with label `source:design` → `openIssues`
- Count those with `priority:critical` or `priority:high` → `criticalOpen`
- Derive `status`: `"warning"` if `criticalOpen > 0`, `"warning"` if `openIssues > 5`, `"ok"` otherwise

Write `.darkflow.d/state/metrics/design-audit.json` (create parent directories if needed):

```json
{
  "openIssues":   <integer>,
  "criticalOpen": <integer>,
  "status":       "ok" | "warning"
}
```

The worker will pick up this file on its next sync. You do not need to update any HTML files.
