# Agent Workflow — working with `docs/`

Rules for AI agents (Claude Code et al.): when to read and when to write in each documentation layer. Complete layer map and update frequencies — in [`docs/README.md`](./README.md).

## Tasks — recommendation cycle

Full field spec and agent loop — in [`tasks.md`](./tasks.md).

**Before each session** check the approved task queue:
```bash
~/.darkflow/df task list --status approved
```
If there are approved tasks matching the current context — take them first. Before starting: `approved` → `in-progress` + comment with branch link.

**After a data run** — turn each recommendation that clears the threshold into a task:
```bash
~/.darkflow/df task create --title "..." \
  --source <...> --priority <...> --status proposed \
  --body "<context + link to the daily log + acceptance criteria>"
```
The daily-log section remains the source of truth; the task = the work artifact.

**If a task is closed as declined (Reject)** — do not recreate the same recommendation without new data. In the next log: "Not recreating — declined as task #N".

---

## When to read (before a task)

- **Any UI / copywriting task** → `state/spec/screens.md` (screen inventory) + `state/spec/flows/`
- **Changing a user flow** → `state/spec/flows/` (checkout, auth, onboarding, etc.)
- **Product / marketing decisions** → `state/product/positioning.md` + `state/product/product.md` + `state/product/pricing.md`
- **Working with analytics events / metrics** → `state/product/metrics.md` (not guessing event names)
- **Creating tasks from analytics / ads / GSC findings** → `state/hypotheses.md` (don't re-file refuted bets)
- **Before a major architectural change** → `state/arch.md` — the current map, and its `## Decisions` table (check the change doesn't contradict a decision already recorded there)
- **Context on "what's working / broken right now"** → the last 2–3 files in `logs/`

## When to write (after a task)

- **Changed a user flow** (auth, checkout, onboarding) → update corresponding `state/spec/flows/*.md`
- **Added / removed a screen** → update `state/spec/screens.md`
- **Changed the data model** → update summary in `state/spec/data-model.md`
- **Changed pricing / billing** → update `state/product/pricing.md`
- **Made a non-trivial architectural / product decision** → one line in the `## Decisions` table of `state/arch.md`: date, decision, why, where it shows
- **Any observation from a data run** → your section of today's `logs/YYYY-MM-DD.md` (one file a day, one section per source)

## After checking data — MANDATORY

Any data analysis run must leave an artifact in the repository. Without a record, knowledge is lost between sessions; the next run starts from zero.

Everything goes into **one document per day**: `logs/YYYY-MM-DD.md`. Each routine appends its own
section — one heading per source, in whatever order they run:

| Section | Written by |
|---|---|
| `## Analytics` | analytics review, funnel/retention work |
| `## SEO` | Search Console + technical/on-page SEO |
| `## Ads` | paid ads |
| `## Performance` | observability (errors, latency, DB) **and** Core Web Vitals — same section, different cadence |
| `## Security` | GitHub alerts + code review findings |
| `## Architecture` | module boundaries + code health |
| `## Design` | visual quality, UI performance, production readiness |
| `## UX` | key flows walked in a real browser |
| `## Uptime` | DNS / HTTP status / page-load |
| `## Build` | build + deploy pipeline |
| `## Docs` | docs ↔ code drift |
| `## Changes` | what actually landed — one line per task |

Rules:

- **Create the file if it is missing; never rewrite a section someone else wrote**, and never touch yesterday's file.
- **A clean run appends nothing.** No section, no "all clear" line. Silence is the clean result — and the observation threshold in `.darkflow.d/claude.md` counts on it: a run that left no section breaks the streak.
- Interviews, feedback and session recordings are **source material**, not a daily observation. Put what they *changed* into the relevant `state/` document (and file tasks from them); the raw recording itself does not live in `docs/`.

### Section format

Enough to be re-read in a month, no more:

- **What was checked** — the GSC property, the Ads account, the URL walked, the commit range
- **Numbers** — metric / value / vs the last time it was measured
- **Anomalies** — with a file, a page or a query attached
- **Recurring** — what has been dragging on, and for how many runs in a row
- **Tasks filed** — number and title, so the log links to the queue

### Retention

Logs are **not** rotated. A file a day is small, and moving old ones away would break the
observation threshold: the history it counts against is exactly the history that would have been
archived. Superseded *documents* go to `_archive/` — daily logs never do.

### From observations to hypotheses

Not every anomaly immediately becomes a task. Before creating one, verify the signal is strong enough.

**Threshold for creating a task** (the full rule, incidents included, is in `.darkflow.d/claude.md` → *Observation → task*):

- **An incident** — broken right now — is filed on **first sight**, `--status approved`. No threshold.
- **An observation** needs the same thing in **3 consecutive runs** of one routine, OR **2 independent sources** in the same window.

Counting is over *runs*, not over files. A clean run appends no section at all, so the daily logs
alone cannot tell "ran 3 times, saw it every time" from "ran 10 times, saw it 3 times":

```bash
~/.darkflow/df runs <routine> --limit 5   # when this routine actually ran
rg -l '^## <Section>' logs/               # which of those days carried the observation
```

A run that left no section **breaks the streak**.

**Where hypotheses live** — the central ledger `state/hypotheses.md` (create it from the format described inside on first use). One entry per bet with a stable ID (`H-NNN`), status (`tracking` → `testing` → `confirmed`/`refuted`/`abandoned`) and links to the daily logs that support it. The logs stay the raw evidence; the ledger is the current state. **Read the ledger before creating tasks from findings** — a refuted hypothesis must not come back as a task without new data.

**How to record a pre-threshold hypothesis:**

1. Add or refresh its entry in `state/hypotheses.md` — append today's log link to Evidence, update the counter.
2. In your section of the daily log, keep hypotheses to one pointer line per bet:

```markdown
- **H-004**: conversion drop on /checkout — evidence 2/3, see `state/hypotheses.md`
```

**When the threshold is reached:** create the task, set the ledger entry to `testing` with a link to task #N, and include a `Based on:` line in the task body linking the supporting logs. Every task keeps a documented evidence trail.

### What to update in other layers

- **New event / metric in code** (new analytics event, new KPI) → `state/product/metrics.md`. This is about **definitions**, not values.
- **Changed the system shape** (new service, integration, stack swap) → `state/arch.md`.
- **New targeting segments / audience shift** → `state/product/product.md` (audience section) or `state/product/positioning.md`.
- **New SEO targets (keywords, pages), sitemap strategy change** → a line in `## Decisions` of `state/arch.md`; record results in the `## SEO` section of the daily log.
- **Decision that constrains future work** (architecture, stack, strategy — anything that forbids or prescribes future changes) → a line in `## Decisions` of `state/arch.md`: what we decided, why, where it shows. Ordinary data verdicts (experiment confirmed/refuted, campaign turned off) stay in the Closed table of `state/hypotheses.md` — not a decision.

`logs/` = observations over time. `state/` = how things are right now, and (in `arch.md`) why. Don't mix layers.

## What NOT to do

- Don't create new top-level folders in `docs/` — the structure is fixed in `README.md`
- Don't duplicate content between layers (product vs spec vs logs) — each has its own update cadence
- Don't write `*.md` files in the repo root for documentation — everything goes in `docs/`
- Don't edit a past daily log retroactively, and don't touch a section another routine wrote — corrections go in today's log
