# Tasks — recommendation cycle

Describes how the agent (Claude Code) and a human jointly run the task queue through Dark Flow's own task store (Postgres, via the `~/.darkflow/df` CLI — no GitHub Issues involved). Recommendations from `insights/*` snapshots become tasks → a human decides → the agent picks up approved ones.

See also: [`decisions/`](./decisions/) for the ADR explaining why this approach was chosen.

---

## Task fields

Every task carries: `number` (per-project, human-facing "#N"), `title`, `body`, `status`, `priority`, `source`, `action` (mailbox only), `needsHuman`, and `comments`.

### `status` — lifecycle (state machine)

Exactly one status at a time. There is no separate open/closed field — `closed` is a status value, so any status other than `closed` is implicitly "open" and vice versa.

| Value | When it's set | Who sets it |
|---|---|---|
| `proposed` | Default when the agent creates a task | Agent |
| `approved` | Human approved — agent may pick it up | Human (or Agent for categories in [`auto-approve.md`](./auto-approve.md)) |
| `in-progress` | Agent started work; left a comment with a summary | Agent |
| `closed` | Terminal — either the agent shipped the fix, or a human declined it (Reject) or dismissed it (Close). Comments explain which. | Agent or Human |

`needsHuman` (boolean) — the agent can't proceed on its own (missing access, config, failed checks, external service). See the task's comments for what's needed. Mutually exclusive with `approved`: every path that sets `needsHuman` moves status off `approved`, and approving always clears `needsHuman`.

> **Auto-approve:** for select categories (security fixes, dependency updates) the agent sets `--status approved` directly at creation time, skipping human review. Full list — [`auto-approve.md`](./auto-approve.md).

### `source` — where the recommendation came from

One value per task. The **task body** links directly to the specific snapshot or section (e.g. `docs/insights/analytics/2026-05-16.md`).

| Value | Source |
|---|---|
| `openpanel` | `docs/insights/analytics/*.md` (OpenPanel) |
| `gsc` | `docs/insights/search-console/*.md` (Google Search Console) |
| `seo` | `docs/insights/seo-audit/*.md` (technical/on-page SEO audit) |
| `ads` | `docs/insights/ads/*.md` (Google Ads) |
| `signoz` | SigNoz observability (`/check-signoz`) |
| `security-review` | Security audit (`/security-review`) |
| `user-feedback` | `docs/insights/qualitative/*` (interviews, emails) |
| `vulnerability-report` | GitHub Dependabot / Code Scanning / Secret Scanning |
| `infra` | Coolify / deployment health checks |
| `manual` | Hypothesis without a data source |

### `priority` — urgency

Exactly one, and it is **required** — every task must carry a priority. Replaces priority suffixes in titles.

| Value | Semantics |
|---|---|
| `critical` | Hits revenue or disables a feature right now |
| `high` | This week |
| `medium` | This month |
| `low` | Someday / nice-to-have |

> **Rule for filing tasks:** agents and routines create tasks **only for `critical` / `high` / `medium`**. `low`-level findings never become tasks — they're recorded in the snapshot (`docs/insights/*`) instead. `low` remains valid for manually filed tasks.
>
> **Enforcement:** the rule isn't left to a single prompt — `POST /api/tasks` enforces the project's configured `minPriority` server-side: a routine-sourced task below the threshold is silently skipped (never created) instead of entering the queue.

---

## Roles: who does what

### Agent (Claude Code)

1. **Creates a task** from each recommendation in an `insights/*` snapshot:
   ```bash
   ~/.darkflow/df task create \
     --title "Short, action-oriented description" \
     --source <...> --priority <...> --status proposed \
     --body "$(cat <<'EOF'
   ## Context

   Source: docs/insights/analytics/2026-05-16.md

   <Brief description of the problem and its impact on the metric>

   ## Acceptance criteria

   - [ ] <concrete, measurable outcome>
   - [ ] <second criterion if needed>
   EOF
   )"
   ```

2. **Before starting any session** — checks the approved queue:
   ```bash
   ~/.darkflow/df task list --status approved
   ```
   If there's an approved task matching the current context — pick it up first.

3. **When starting work on a task** — switches its status and leaves a comment:
   ```bash
   ~/.darkflow/df task set-status <N> in-progress
   ~/.darkflow/df task comment <N> --body "Starting implementation. Branch: <branch-name>"
   ```

4. **When done** — commits (direct push, or PR referencing "Task #N" if `mergeStrategy=pr`), then `~/.darkflow/df task close <N>` — the task moves to closed (done).

### Human

- Reviews tasks with `status=proposed` in the Web UI → approves or rejects.
- On reject — the task is closed (`status=closed`). The agent **does not recreate** it in future snapshots without new data; the snapshot notes: "Not recreating — declined as task #N."

---

## Antipatterns

- **Don't encode dates in `source`** (`openpanel-2026-05-16`) — use `--source openpanel` + a link to the snapshot in the body.
- **Don't encode priority in the title** (`[SEO/P0]`) — use `--priority critical`.
- **Don't recreate a declined task** without new data — note in the snapshot: "Not recreating — declined as task #N."
- **Don't close a task manually as "done"** without a summary comment — leave a comment describing what was done before closing, for traceability.
