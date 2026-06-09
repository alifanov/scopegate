# Agent Workflow — working with `docs/`

Rules for AI agents (Claude Code et al.): when to read and when to write in each documentation layer. Complete layer map and update frequencies — in [`docs/README.md`](./README.md).

## GitHub Issues — recommendation cycle

Full label spec and agent loop — in [`github-issues.md`](./github-issues.md).

**Before each session** check the approved task queue:
```bash
gh issue list --label "status:approved" --state open --json number,title,labels,body --limit 20
```
If there are approved issues matching the current context — take them first. Before starting: `status:approved` → `status:in-progress` + comment with branch link.

**After analyzing an `insights/*` snapshot** — turn each recommendation into an issue:
```bash
gh issue create --title "..." \
  --label "status:proposed,source:<...>,priority:<...>" \
  --body "<context + link to snapshot + acceptance criteria>"
```
The snapshot entry remains the source of truth; the issue = the work artifact.

**If an issue is closed with `status:rejected`** — do not recreate the same recommendation without new data. In the next snapshot: "Not recreating — rejected in #N".

---

## When to read (before a task)

- **Any UI / copywriting task** → `design/voice-and-tone.md` + `design/tokens.md` + `design/patterns.md` + `design/components.md`
- **Changing a user flow** → `spec/flows/` (checkout, auth, onboarding, etc.)
- **Product / marketing decisions** → `product/positioning.md` + `product/audience.md` + `product/pricing.md`
- **Working with analytics events / metrics** → `product/metrics.md` (not guessing event names)
- **Before a major architectural change** → `decisions/` (check it doesn't contradict existing ADRs)
- **Context on "what's working / broken right now"** → last 2–3 files from `insights/analytics/`

## When to write (after a task)

- **Changed a user flow** (auth, checkout, onboarding) → update corresponding `spec/flows/*.md`
- **Added / removed a screen** → update `spec/screens/inventory.md`
- **Changed the data model** → update summary in `spec/data-model.md`
- **Changed pricing / billing** → update `product/pricing.md`
- **Added a new UI component or pattern** → update `design/components.md` / `design/patterns.md`
- **Made a non-trivial architectural / product decision** → add entry to `decisions/` in ADR format: context → decision → consequences
- **Analytics observations by day** → `insights/analytics/YYYY-MM-DD.md` (don't multiply files — update today's file if already created)

## After checking data — MANDATORY

Any data analysis run must leave an artifact in the repository. Without a record, knowledge is lost between sessions; the next run starts from zero.

Rule is universal — only the folder changes by data source:

| Data source | Where to write snapshot | Triggers |
|---|---|---|
| Analytics, funnels, retention, metric investigation | `insights/analytics/YYYY-MM-DD.md` | Any HogQL queries, PostHog MCP, funnel analysis |
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

- Title + **data source** (what exactly was checked — GSC property, Ads account ID, PostHog project) + **period**
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

Not every anomaly immediately becomes a GitHub issue. Before creating one, verify the signal is strong enough.

**Threshold for creating a GitHub issue:**
- The same anomaly appears in **3 or more consecutive snapshots** for one source, OR
- **Two or more independent sources** point to the same problem area in the same time window

**How to record a pre-threshold hypothesis** — add a `## Hypotheses` section at the end of the snapshot file:

```markdown
## Hypotheses

- **H1**: [what we think is causing the drop] — [expected impact if confirmed] — [what data would confirm it]
  - Evidence: 2026-05-27 (−12% conversion), 2026-05-28 (−8%)
  - Status: 2/3 snapshots — not yet ready for issue
```

**When the threshold is reached:** create the GitHub issue and include in its body a `Based on:` line with links to the supporting snapshots. This ensures every issue has a documented evidence trail.

### What to update in other layers

- **New event / metric in code** (new analytics event, new KPI) → `product/metrics.md`. This is about **definitions**, not values.
- **New targeting segments, new landing pages for campaigns, budget/strategy change** → `product/marketing.md` / `product/gtm.md`.
- **New SEO targets (keywords, pages), sitemap strategy change** → `product/marketing.md` or a new entry in `decisions/`.
- **Decision made based on data** (launch an experiment, turn off a campaign, reprioritize roadmap) → ADR in `decisions/`: what we saw → what we decided → how we'll verify.

`insights/` = observations over time (snapshots). `product/` = current definitions. `decisions/` = what we did about it. Don't mix layers.

## What NOT to do

- Don't create new top-level folders in `docs/` — the structure is fixed in `README.md`
- Don't duplicate content between layers (product vs spec vs design) — each has its own update cadence
- Don't write `*.md` files in the repo root for documentation — everything goes in `docs/`
- Don't edit `insights/analytics/*` retroactively (these are time-stamped snapshots) — for corrections add a new file
