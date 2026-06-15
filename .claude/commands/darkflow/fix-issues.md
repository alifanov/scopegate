Pick up one status:approved GitHub issue, implement the fix, and close it.

## Step 1 — Read project config

Run `bash .darkflow.d/get-config.sh` to pull the latest project settings from the Web UI and refresh the local `.darkflow` cache (silently falls back to cache if the server is unreachable).

Read `.darkflow` in the project root. Extract:
- `branch=` → main branch name (default: main)
- `merge_strategy=` → `pr` or `direct` (default: pr)
- `language=` → output/issue language (default: English)

If `.darkflow` is missing, continue with the defaults.

## Step 2 — Pick the next issue

Pick exactly **one** open issue with the `status:approved` label, choosing strictly by priority. The priority order, highest first, is:

1. `priority:critical`
2. `priority:high`
3. `priority:medium`
4. `priority:low`
5. `status:approved` without any `priority:*` label (treat as lowest)

The canonical labels are `critical/high/medium/low`, but some agents tag issues with the equivalent `p0/p1/p2/p3` scheme (`p0`=critical, `p1`=high, `p2`=medium, `p3`=low). Treat those as **aliases** — an issue must never be stranded just because it carries `priority:p2` instead of `priority:medium`. Within a level, take the **oldest** issue (smallest number).

Skip issues that are not actually actionable here, even if they still carry `status:approved`:
- `action:reply` — handled exclusively by `mailbox-check`.
- `source:ci` — handled exclusively by `fix-ci-issue` (it has its own bounded-retry logic); picking it here would bypass the retry cap.
- `needs-human` — already parked for a human (failed checks or an external blocker); re-running only posts duplicate comments.

Rank every selectable issue and take the single best one — one query, no per-level loop:

```bash
n=$(gh issue list --state open --label "status:approved" \
      --json number,labels \
      --jq '
        def prio($l):
          if   ($l|index("priority:critical")) or ($l|index("priority:p0")) then 0
          elif ($l|index("priority:high"))     or ($l|index("priority:p1")) then 1
          elif ($l|index("priority:medium"))   or ($l|index("priority:p2")) then 2
          elif ($l|index("priority:low"))      or ($l|index("priority:p3")) then 3
          else 4 end;
        [ .[]
          | (.labels | map(.name)) as $l
          | select(($l | index("action:reply")   | not)
               and ($l | index("source:ci")      | not)
               and ($l | index("needs-human")    | not))
          | {number, rank: prio($l)} ]
        | sort_by([.rank, .number]) | .[0].number // empty')
```

If `$n` is empty, stop — skip the run.

## Step 3 — Read the issue

Fetch the full issue content before touching any code:

```bash
gh issue view $n --json title,body,comments,labels
```

Read the title, body, and all comments carefully. If the issue references other issues or PRs, read those too.

## Step 4 — Do the work

Implement all the changes needed for it.

**Product language is always English.** The `language=` setting is the *communication* language (issues, comments, commits, chat) — it never changes what you write inside the product. All source code, identifiers, code comments, UI copy, user-facing strings, and logs you add must be in English, even when `language=` is set to something else.

**Before merging or pushing — run quality checks:**

Detect the project's tech stack and run all available checks. Stop at the first failure.

| Stack | Commands to run (in order) |
|---|---|
| Node / pnpm | `pnpm lint` (if script exists) → `pnpm test` (if script exists) → `pnpm build` (if script exists) |
| Node / npm | `npm run lint` → `npm test` → `npm run build` (skip any that aren't defined) |
| Python | `ruff check .` (if ruff installed) → `pytest` (if pytest installed) |
| Rust | `cargo clippy` → `cargo test` → `cargo build` |
| Go | `go vet ./...` → `go test ./...` → `go build ./...` |
| Other | Check for `Makefile` targets `lint`, `test`, `build` and run those that exist |

**Skip the `build` step when the CI gate is active.** If `.darkflow`'s `modules=` includes `ci-gate` (or `.github/workflows/darkflow-ci-gate.yml` exists), do **not** run `build` locally — the CI gate verifies the build on push/PR. Still run `lint` and `test`.

**If the fix requires human intervention** (examples: missing environment variable, external credentials, third-party service setup, infrastructure change, secret rotation, manual config change that the agent cannot perform):
- Do NOT attempt the fix
- Leave a comment on the issue explaining exactly what human action is needed
- **Before commenting, check the existing comments — if you (the bot) already left an equivalent `needs-human` explanation, do NOT post another one; just ensure the labels are correct and stop.**
- Move the issue out of the queue so the next run does not re-pick it: `gh issue edit $n --add-label needs-human --remove-label status:approved`
- Stop the run

**If any check fails:**
- Do NOT merge or push
- Leave a comment on the issue: what failed and the relevant error output (truncated to ~20 lines)
- Failed checks need a human to look — the agent can't get past them on its own. Move the issue out of the queue: `gh issue edit $n --add-label needs-human --remove-label status:approved`
- Stop the run

**If all checks pass (or no checks apply), proceed:**

## Step 5 — Update documentation

Before merging, check whether the fix changes any user-visible behavior, configuration, API, or interface. If yes, update the relevant documentation files:

- If the project has a `README.md` that describes the changed behavior — update it.
- If the project has a `docs/` directory with relevant pages — update them.
- If a changelog exists (`CHANGELOG.md`, `HISTORY.md`, etc.) — add an entry.

Skip this step if the fix is purely internal (refactor, test, build config) with no user-visible effect.

## Step 6 — Land the fix

**Workspace rule — never create a git worktree:**
Always work in the project root on the configured base branch — never run `git worktree add` or check work out into a separate directory. The dispatcher runs you in `cwd = project root`; keep it that way. If the PR strategy needs a feature branch, create it **in place** with `git checkout -b <branch>` on top of the configured base branch, then switch back when done — do not spin up a worktree.

**Branch rule — never cherry-pick to main/master on your own:**
The base branch is the `branch=` value from `.darkflow` (it may be `main`, `master`, `dev`, `develop`, or anything else — always read it from config, never assume `main`). If it is a non-main/non-master branch, land the fix **only** on that branch. Do NOT cherry-pick, merge, or push to `main` or `master` independently — that is a human decision. Leave the fix in the configured branch and close the issue.

**If `merge_strategy=pr`:**
From the project root, create a feature branch in place with `git checkout -b` based off the `branch=` value from `.darkflow`, implement and commit there, then open a pull request targeting `branch=` with `Closes #N` in the description and merge it into that branch. No worktree — the branch lives in the same working directory.

**If `merge_strategy=direct`:**
Commit and push directly to the `branch=` value from `.darkflow`.

After landing, leave a comment on the issue with a brief summary of what was done:
- What was broken or missing
- What files were changed and how
- Any documentation that was updated

Then close the issue.

Language for GitHub comments and output: the `language=` value from `.darkflow`. Code and everything shipped inside the product stays in English regardless of this value.
