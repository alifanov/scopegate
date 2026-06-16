# Auto-approve — automatic issue approval

By default, every issue an agent creates goes through the human review gate:
`status:proposed` → human approves → `status:approved` → `fix-issues` picks it up.

For categories in the **allowlist below**, the producing command creates the issue **directly as `status:approved`**, so `fix-issues` acts without waiting for a human.

---

## Safety net

Auto-approve does **not** mean unsafe auto-merge. Before touching any code, `fix-issues`:

1. Runs the full quality-check suite for the stack (lint → test → build). If any step fails, it sets `needs-human` and stops — nothing is merged.
2. Escalates anything that needs a human (secret rotation, infra change, missing env var) to `needs-human` and stops.

Auto-approve only removes the *triage* step; the *execution* gate stays intact.

---

## Allowlist

| Category | Producing command | Match criteria | Notes |
|---|---|---|---|
| Security fix | `/darkflow:security-audit` | `source:security-review`, any priority | Static analysis + live app checks |
| Dependency version update | `/darkflow:vulnerability-check` | `source:vulnerability-report`, Dependabot alerts only | Version upgrades only |
| Database index addition | `/darkflow:observability-check` | `source:signoz`, additive index only | The command applies `status:approved` only for a plain index add — query rewrites / N+1 fixes / caching stay proposed |

### Explicit exclusions

These remain `status:proposed` (human review required):

- Code-scanning / CodeQL findings (may require architectural decisions)
- Secret-scanning findings (always require manual key rotation)

---

## How to extend

To add a new category:

1. Add a row to the allowlist table above.
2. In the producing command file (`templates/.claude/commands/darkflow/<command>.md`), change the label for matching issues from `status:proposed` to `status:approved` and add a one-line reference: *"Auto-approved — see `docs/auto-approve.md`."*
3. Update the corresponding `routines/<command>.md` "What gets created" note.
