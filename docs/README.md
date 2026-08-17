# scopegate Docs

Two things live here, and they behave differently:

- **`state/`** — how things are **right now**. Overwritten in place; there is one current answer,
  not a history of answers. Product, spec, the architecture map, the hypothesis ledger.
- **`logs/`** — what **happened**. One document per day, appended to, never rewritten.

Plus a few cross-cutting **process** files.

The split is the whole point: a routine that observes something writes to `logs/`, a routine that
learns the shape of the system changed rewrites `state/`. Neither touches the other's ground.
There is no third place — "why we decided X" is a line in `state/arch.md`, under `## Decisions`.

Agent rules "when to read / when to write" — in [`agent-workflow.md`](./agent-workflow.md).

## How this folder gets populated

A fresh install scaffolds only the **process files + empty layer folders** — it does
**not** drop empty stubs for every doc. Everything in the manifest below marked
`on demand` is created later, by you or by a routine, when there's something real to
put in it. So a file being absent means "not written yet", not "missing" — don't treat
gaps as drift (the `docs-audit` routine follows the same rule).

## File manifest

**Scaffolded on install** (present in every project from day one):

| File | Purpose | Update frequency |
|---|---|---|
| `README.md` | This map | As structure changes |
| `agent-workflow.md` | When agents read / write each doc + task triage loop | As changed |
| `tasks.md` | Task field taxonomy + agent triage loop | Quarterly |
| `auto-approve.md` | Which findings a routine may auto-approve | As changed |
| `ci-runner.md` | Self-hosted CI runner requirements (**only if `ci-gate` module enabled**) | As changed |
| `byo-credentials.md` | BYO OAuth app configuration (**only if a project registers its own OAuth app**) | As changed |

**Created on demand** (folder exists; file appears when there's content):

| File | Layer / frequency | Purpose |
|---|---|---|
| `state/product/product.md` | product · quarterly | What/for whom/why + audience segments + key use cases + stage |
| `state/product/positioning.md` | product · quarterly | Positioning, value prop, competitive landscape |
| `state/product/pricing.md` | product · as changed | Pricing tiers, billing |
| `state/product/metrics.md` | product · monthly | North-star metrics + analytics event **definitions** |
| `state/hypotheses.md` | product · as tracked | Central hypothesis ledger: bet → evidence → verdict |
| `state/product/glossary.md` | product · as changed | Domain terms and entities |
| `state/arch.md` | spec · on system change | System map: stack, modules, entry points, integrations **+ `## Decisions`** |
| `state/spec/flows/*.md` | spec · weekly | User-flow descriptions (`TEMPLATE.md` inside) |
| `state/spec/screens.md` | spec · weekly | Screen inventory |
| `state/spec/data-model.md` | spec · per migration | Data model summary (from ORM schema) |

**The daily log** (`logs/` — one document per day, a section per source; see
[`agent-workflow.md`](./agent-workflow.md) for the section list):

| Path | Contents |
|---|---|
| `logs/YYYY-MM-DD.md` | Every routine's findings for that day, appended as `## Security`, `## Analytics`, `## Changes`, … A clean run appends nothing at all |

Logs are never rotated: the observation threshold counts back over them.

**The archive** (`_archive/`) — one place, not one per layer. A document that is superseded or
retired moves here instead of being deleted; the installer puts the old per-routine snapshot
folders (`insights/`) and the old ADR folder (`decisions/`) here when it brings a project forward.
Two rules: **nothing under `state/` is ever archived** (state is overwritten in place — the old
value is in git, not in a folder), and **daily logs never go here** either.

## Reading order for newcomer / AI agent

Once the docs are filled in, read them in this order (skip any not yet written):

1. `state/product/product.md` — what is this, who it's for, key use cases
2. `state/product/positioning.md` — what's different from the alternatives
3. `state/arch.md` — how the system is put together, and why (`## Decisions`)
4. `state/spec/data-model.md` + `state/spec/screens.md` — how it's built
5. `state/product/metrics.md` + the last 2–3 files in `logs/` — what's working now
