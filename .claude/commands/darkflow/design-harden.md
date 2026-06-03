Run a production-readiness check on the interface — edge cases, i18n, error states, overflow — then create `status:proposed` GitHub issues for each gap.

## Step 1 — Read project config

Read `.darkflow` in the project root. Extract:
- `language=` → output/issue language (default: English)

If `.darkflow` is missing, continue with defaults.

## Step 2 — Do the work

/impeccable:harden

After the hardening review is complete, create a GitHub issue for each gap found:
- Labels: `status:proposed`, `source:design`, priority based on risk:
  - `priority:p1` — missing error states on critical flows, broken overflow, untranslated strings in production
  - `priority:p2` — edge cases that cause layout breaks, unhandled empty states
  - `priority:p3` — cosmetic overflow, optional i18n gaps, low-risk edge cases
- Do not create issues for findings already tracked in open GitHub issues

**Issue format (required):**

- **Title**: action-oriented verb — "Add error state to checkout form", "Fix text overflow in user name field at 320px", "Handle empty state on notifications panel" — never a bare observation
- **Body**:
  ```
  ## Problem
  <what is missing or broken — specific component, edge case, or locale>

  ## What to do
  <concrete change — which file, component, or copy to add/fix>

  ## Acceptance criteria
  - [ ] <verifiable outcome 1>
  - [ ] <verifiable outcome 2 if needed>
  ```

Language for all GitHub issues and output: the `language=` value from `.darkflow`.

## Step 3 — Write snapshot

Write `docs/insights/design-harden/YYYY-MM-DD.md` (use today's date; append a new section if today's file already exists):

```markdown
# Design Harden — YYYY-MM-DD

**Tool:** impeccable:harden
**Scope:** <pages / components reviewed>

## Gaps Found

| Category | Component / Page | Gap | Risk | Issue |
|---|---|---|---|---|
| error states | | | p1 / p2 / p3 | #N |
| overflow | | | | |
| i18n | | | | |
| edge cases | | | | |

## Recurring Gaps

<gaps appearing in 2+ consecutive reviews — note how many in a row>

## Recommendations

<each with: component/page → what to add → acceptance criterion>
```

## Step 4 — Write metrics

Run `gh issue list --state open --json number,labels --limit 200`, then:
- Count issues with label `source:design` → `openIssues`
- Count those with `priority:p1` → `criticalOpen`
- Derive `status`: `"warning"` if `criticalOpen > 0`, `"ok"` otherwise

Write `.darkflow.d/state/metrics/design-harden.json` (create parent directories if needed):

```json
{
  "openIssues":   <integer>,
  "criticalOpen": <integer>,
  "status":       "ok" | "warning"
}
```

The worker will pick up this file on its next sync. You do not need to update any HTML files.
