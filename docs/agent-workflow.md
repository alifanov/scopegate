# Agent Workflow — working with `docs/`

Rules for AI agents (Claude Code et al.): when to read and when to write in each documentation layer. Complete layer map and update frequencies — in [`docs/README.md`](./README.md).

## Tasks — recommendation cycle

Full field spec and agent loop — in [`tasks.md`](./tasks.md).

**Before each session** check the approved task queue:
```bash
~/.darkflow/df task list --status approved
```
If there are approved tasks matching the current context — take them first. Before starting: `approved` → `in-progress` + comment with branch link.

**After analyzing an `insights/*` snapshot** — turn each recommendation into a task:
```bash
~/.darkflow/df task create --title "..." \
  --source <...> --priority <...> --status proposed \
  --body "<context + link to snapshot + acceptance criteria>"
```
The snapshot entry remains the source of truth; the task = the work artifact.

**If a task is closed as declined (Reject)** — do not recreate the same recommendation without new data. In the next snapshot: "Not recreating — declined as task #N".

---

## When to read (before a task)

- **Any UI / copywriting task** → `design/components.md` (registry + UI-state patterns)
- **Changing a user flow** → `spec/flows/` (checkout, auth, onboarding, etc.)
- **Product / marketing decisions** → `product/positioning.md` + `product/product.md` + `product/pricing.md`
- **Working with analytics events / metrics** → `product/metrics.md` (not guessing event names)
- **Before a major architectural change** → `spec/architecture.md` for the current map, then `decisions/` (check it doesn't contradict existing ADRs)
- **Context on "what's working / broken right now"** → last 2–3 files from `insights/analytics/`

## When to write (after a task)

- **Changed a user flow** (auth, checkout, onboarding) → update corresponding `spec/flows/*.md`
- **Added / removed a screen** → update `spec/screens.md`
- **Changed the data model** → update summary in `spec/data-model.md`
- **Changed pricing / billing** → update `product/pricing.md`
- **Added a new UI component or state pattern** → update `design/components.md`
- **Made a non-trivial architectural / product decision** → add entry to `decisions/` in ADR format: context → decision → consequences
- **Analytics observations by day** → `insights/analytics/YYYY-MM-DD.md` (don't multiply files — update today's file if already created)

## After checking data — MANDATORY

Any data analysis run must leave an artifact in the repository. Without a record, knowledge is lost between sessions; the next run starts from zero.

Rule is universal — only the folder changes by data source:

| Data source | Where to write snapshot | Triggers |
|---|---|---|
| Analytics, funnels, retention, metric investigation | `insights/analytics/YYYY-MM-DD.md` | Any OpenPanel MCP queries, funnel analysis |
| Google Search Console — positions, CTR, impressions, indexing | `insights/search-console/YYYY-MM-DD.md` | Any GSC data review, position checks, indexing audit |
| SEO audit — technical + on-page (titles, meta, schema, crawlability) | `insights/seo-audit/YYYY-MM-DD.md` | On-page/technical SEO review, meta/heading/schema audit |
| Paid ads — campaigns, keywords, spend, CPA, ROAS | `insights/ads/YYYY-MM-DD.md` | Any ads account check, campaign optimization |
| Observability — errors, latency, DB performance | `insights/observability/YYYY-MM-DD.md` | SigNoz/Datadog checks, latency alerts |
| Security audit — vulnerabilities, code scanning | `insights/security/YYYY-MM-DD.md` | `/darkflow:security-audit`, Dependabot alerts |
| Docs audit — docs ↔ code drift | `insights/docs-audit/YYYY-MM-DD.md` | `/darkflow:docs-audit` |
| Product overview — state + recent improvements + hypotheses digest | `insights/product-overview/YYYY-MM-DD.md` | `/darkflow:product-overview` |
| Build optimization — build + deploy pipeline efficiency | `insights/build-optimization/YYYY-MM-DD.md` | `/darkflow:build-optimization` |
| Uptime check — DNS / HTTP status / page-load health | `insights/uptime/YYYY-MM-DD.md` | `/darkflow:uptime-check` |
| Code health — dead code, duplication, cycles, complexity (fallow) | `insights/code-health/YYYY-MM-DD.md` | `/darkflow:code-health` |
| Design audit — five-dimension technical quality (impeccable:audit) | `insights/design-audit/YYYY-MM-DD.md` | `/darkflow:design-audit` |
| Design critique — scored review, persona tests (impeccable:critique) | `insights/design-critique/YYYY-MM-DD.md` | `/darkflow:design-critique` |
| Design harden — edge cases, i18n, error states (impeccable:harden) | `insights/design-harden/YYYY-MM-DD.md` | `/darkflow:design-harden` |
| Interviews, feedback, session recordings | `insights/qualitative/YYYY-MM-DD-{topic}.md` | Session recording review, email/chat feedback analysis |

### Snapshot format (any source)

Minimum a file must contain:

- Title + **data source** (what exactly was checked — GSC property, Ads account ID, OpenPanel project) + **period**
- **Key Metrics** — table "metric / value / vs previous snapshot"
- Breakdowns that were requested (queries / pages / campaigns / keywords / funnels — as applicable)
- Anomalies and errors
- **Recurring issues** — what's been dragging from previous snapshots (how many snapshots in a row)
- **Recommendations** — each with metric-basis, specific action, and expected impact

**When to write**: before returning recommendations to the user. The file is the source of truth, the chat response is the summary.

**When to append, not create**: if today's file for this source already exists — append a section to the existing file.

### Retention policy for `insights/*/`

- **Older than 4 weeks** → consolidate into `insights/{source}/weekly/YYYY-Www.md` (one summary per ISO week: key metric shifts, what shipped, what was confirmed/refuted). Delete daily files for that week.
- **Older than 3 months** → consolidate weekly into `insights/{source}/monthly/YYYY-MM.md` (only trends and key events for the month). Delete weekly files for that month.
- **Exception**: snapshots referenced by ADRs in `decisions/` — do not delete, they are part of the decision's historical context.

### From observations to hypotheses

Not every anomaly immediately becomes a task. Before creating one, verify the signal is strong enough.

**Threshold for creating a task:**
- The same anomaly appears in **3 or more consecutive snapshots** for one source, OR
- **Two or more independent sources** point to the same problem area in the same time window

**How to record a pre-threshold hypothesis** — add a `## Hypotheses` section at the end of the snapshot file:

```markdown
## Hypotheses

- **H1**: [what we think is causing the drop] — [expected impact if confirmed] — [what data would confirm it]
  - Evidence: 2026-05-27 (−12% conversion), 2026-05-28 (−8%)
  - Status: 2/3 snapshots — not yet ready for a task
```

**When the threshold is reached:** create the task and include in its body a `Based on:` line with links to the supporting snapshots. This ensures every task has a documented evidence trail.

### What to update in other layers

- **New event / metric in code** (new analytics event, new KPI) → `product/metrics.md`. This is about **definitions**, not values.
- **Changed the system shape** (new service, integration, stack swap) → `spec/architecture.md`.
- **New targeting segments / audience shift** → `product/product.md` (audience section) or `product/positioning.md`.
- **New SEO targets (keywords, pages), sitemap strategy change** → a new entry in `decisions/`; record results as snapshots under `insights/search-console/`.
- **Decision made based on data** (launch an experiment, turn off a campaign, reprioritize roadmap) → ADR in `decisions/`: what we saw → what we decided → how we'll verify.

`insights/` = observations over time (snapshots). `product/` = current definitions. `decisions/` = what we did about it. Don't mix layers.

## What NOT to do

- Don't create new top-level folders in `docs/` — the structure is fixed in `README.md`
- Don't duplicate content between layers (product vs spec vs design) — each has its own update cadence
- Don't write `*.md` files in the repo root for documentation — everything goes in `docs/`
- Don't edit `insights/analytics/*` retroactively (these are time-stamped snapshots) — for corrections add a new file
