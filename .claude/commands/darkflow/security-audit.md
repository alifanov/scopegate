Run a full security review — static code analysis and live app check — then create status:proposed GitHub issues for each finding.

## Step 1 — Read project config

Read `.darkflow` in the project root. Extract:
- `language=` → output/issue language (default: English)

If `.darkflow` is missing, continue with the default.

## Step 2 — Do the work

/security-review

After the review is complete, create a GitHub issue for each finding:
- Labels: `status:approved`, `source:security-review`, priority based on severity (`p0`=critical, `p1`=high, `p2`=medium, `p3`=low), `area:api` / `area:auth` / `area:infra` as appropriate
- Security findings are auto-approved — see `docs/auto-approve.md`
- Do not create issues for findings already tracked in open GitHub issues

**Issue format (required):**

- **Title**: action-oriented verb — "Fix X", "Restrict Y", "Add Z" — never just a statement of the finding ("X is vulnerable", "Found Y")
- **Body**:
  ```
  ## Problem
  <what was found and why it is a risk>

  ## What to do
  <concrete steps to resolve it — specific files, configs, or APIs to change>

  ## Acceptance criteria
  - [ ] <verifiable outcome 1>
  - [ ] <verifiable outcome 2 if needed>
  ```

Language for all GitHub issues and output: the `language=` value from `.darkflow`.

## Step 3 — Write docs snapshot

Write `docs/insights/security/YYYY-MM-DD.md` (use today's date; append a new section if today's file already exists):

```markdown
# Security Audit — YYYY-MM-DD

**Period:** <date range reviewed>

## Findings

| Category | Finding | Severity | File / Config |
|---|---|---|---|
| | | critical / high / medium / low | |

## Recurring Issues

<vulnerabilities appearing in 2+ consecutive audits — note how many audits in a row>

## Hypotheses

<pre-threshold signals that aren't yet ready for a GitHub issue — see agent-workflow.md>

## Recommendations

<each with: what was found → specific fix → acceptance criterion>
```

## Step 4 — After completing

Save a security snapshot so the Dark Flow worker can forward it to the web UI.

Run `gh issue list --state open --json number,labels --limit 200`, then:
- Count issues with label `source:security-review` → `openIssues`
- Count those with `priority:p0` or `priority:p1` → `criticalOpen`
- Derive `status`: `"critical"` if criticalOpen > 0, `"warning"` if openIssues > 5, `"ok"` otherwise

Write `.darkflow.d/state/metrics/security.json` (create parent directories if needed):

```json
{
  "openIssues":   <integer>,
  "criticalOpen": <integer>,
  "status":       "ok" | "warning" | "critical"
}
```

The worker will pick up this file on its next sync. You do not need to update any HTML files.
