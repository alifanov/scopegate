Audit the `docs/` knowledge base against the actual code and recent history — find drift between what the docs claim and what the code does — then create status:proposed GitHub issues for each significant mismatch.

This is a **verification check**: it answers "are the docs still true?" It does not rewrite docs (that is a human/`fix-issues` decision) and it does not produce a product narrative (that is `/darkflow:product-overview`).

## Step 1 — Read project config

Read `.darkflow` in the project root. Extract:
- `language=` → output/issue language (default: English)

If `.darkflow` is missing, continue with the default.

## Step 2 — Audit docs against code

Read `docs/README.md` and `docs/agent-workflow.md` first to learn the layer map, then check each layer against reality. Skip files that are missing or still placeholder stubs — note them as "not yet written", not as drift.

Check, layer by layer:

- **`spec/data-model.md` vs the real schema** — compare the documented data model against the ORM schema (`prisma/schema.prisma`, `models.py`, migrations, etc.). Flag entities/fields/relations that exist in code but not in docs, or vice versa.
- **`spec/screens/inventory.md` vs routes/pages** — compare the documented screen list against actual routes/pages/views in the code. Flag screens added or removed in code but not reflected.
- **`spec/flows/*.md` vs implemented flows** — for documented flows (auth, checkout, onboarding…), check the steps still match the code.
- **`product/metrics.md` vs instrumented events** — compare documented analytics event/metric **definitions** against event names actually fired in the code. Flag events in code that aren't documented, and documented events with no callsite.
- **`design/components.md` vs the component registry** — compare documented components against what exists in the components directory.
- **`product/pricing.md` vs billing code/config** — if pricing/plans are encoded in code or config, flag mismatches.
- **`CLAUDE.md` / `README.md` commands** — verify documented commands (build, test, dev, lint) exist in `package.json` / `Makefile` / `pyproject.toml`.
- **`decisions/` (ADRs) vs current code** — flag any accepted decision the code now contradicts (a superseded ADR that was never marked superseded).

Use git history for context on *why* something drifted:

```bash
git log --oneline -50
git diff --stat HEAD~30..HEAD 2>/dev/null
```

If a recent commit changed code in an area whose docs were not touched, that is a strong drift signal.

## Step 3 — Create issues for drift

Create a GitHub issue for each significant mismatch. Group trivially related mismatches into one issue (e.g. "Sync data-model.md with 3 new fields") rather than one issue per field.

- Labels: `status:proposed`, `source:docs`, `area:docs`, priority by impact (`p1` = docs actively misleading agents/devs, `p2` = stale, `p3` = cosmetic/minor)
- Do not create issues for drift already tracked in open GitHub issues
- Do not create issues for missing/stub files that were never written — list those in the snapshot only

**Issue format (required):**

- **Title**: action-oriented verb — "Sync X with code", "Document Y", "Remove stale Z from docs" — never just a statement ("Docs are outdated")
- **Body**:
  ```
  ## Problem
  <what the docs claim vs what the code actually does, with file paths on both sides>

  ## What to do
  <which doc file to update and to what>

  ## Acceptance criteria
  - [ ] <doc file matches code reality on this point>
  ```

Language for all GitHub issues and output: the `language=` value from `.darkflow`.

## Step 4 — Write docs snapshot

Write `docs/insights/docs-audit/YYYY-MM-DD.md` (use today's date; append a new section if today's file already exists):

```markdown
# Docs Audit — YYYY-MM-DD

**Scope:** <which docs layers were checked>

## Drift found

| Doc file | Claims | Code reality | Severity | Issue |
|---|---|---|---|---|
| | | | p1 / p2 / p3 | #N |

## Not yet written

<docs files that are still stubs / missing — informational, not drift>

## Recurring Issues

<drift appearing in 2+ consecutive audits — note how many audits in a row>

## Hypotheses

<pre-threshold signals that aren't yet ready for a GitHub issue — see agent-workflow.md>

## Recommendations

<each with: doc file → what to change → acceptance criterion>
```

## Step 5 — After completing

Save a docs-audit snapshot so the Dark Flow worker can forward it to the web UI.

Run `gh issue list --state open --json number,labels --limit 200`, then:
- Count issues with label `source:docs` → `openIssues`
- Count those with `priority:p1` → `criticalOpen`
- Derive `status`: `"warning"` if criticalOpen > 0, `"warning"` if openIssues > 5, `"ok"` otherwise

Write `.darkflow.d/state/metrics/docs-audit.json` (create parent directories if needed):

```json
{
  "openIssues":   <integer>,
  "criticalOpen": <integer>,
  "status":       "ok" | "warning"
}
```

The worker will pick up this file on its next sync. You do not need to update any HTML files.
