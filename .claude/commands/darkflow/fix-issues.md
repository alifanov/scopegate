Pick up one status:approved GitHub issue, implement the fix, and close it.

## Step 1 — Read project config

Run `bash .darkflow.d/get-config.sh` to pull the latest project settings from the Web UI and refresh the local `.darkflow` cache (silently falls back to cache if the server is unreachable).

Read `.darkflow` in the project root. Extract:
- `branch=` → main branch name (default: main)
- `merge_strategy=` → `pr` or `direct` (default: pr)
- `language=` → output/issue language (default: English)

If `.darkflow` is missing, continue with the defaults.

## Step 2 — Pick the next issue

Pick exactly **one** open issue with the `status:approved` label, choosing strictly by priority. Walk the priority labels in this order and stop at the first level that has any issues:

1. `priority:p0`
2. `priority:p1`
3. `priority:p2`
4. `priority:p3`
5. `status:approved` without any `priority:*` label (treat as lowest)

Within the chosen level, take the **oldest** issue (smallest issue number). Concretely:

Issues with `action:reply` are handled exclusively by `mailbox-check` — skip them here.

```bash
for p in p0 p1 p2 p3; do
  n=$(gh issue list --state open --label "status:approved" --label "priority:$p" \
        --json number,labels \
        --jq '[.[] | select(.labels | map(.name) | index("action:reply") | not)]
              | sort_by(.number) | .[0].number')
  [[ -n "$n" ]] && break
done
# Fallback for status:approved issues with no priority label:
if [[ -z "$n" ]]; then
  n=$(gh issue list --state open --label "status:approved" \
        --json number,labels \
        --jq '[.[] | select(
                (.labels | map(.name) | map(startswith("priority:")) | any) | not
              ) | select(
                .labels | map(.name) | index("action:reply") | not
              )]
              | sort_by(.number) | .[0].number')
fi
```

If `$n` is empty after all levels, stop — skip the run.

## Step 3 — Read the issue

Fetch the full issue content before touching any code:

```bash
gh issue view $n --json title,body,comments,labels
```

Read the title, body, and all comments carefully. If the issue references other issues or PRs, read those too.

## Step 4 — Do the work

Implement all the changes needed for it.

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

**If the fix requires human intervention** (examples: missing environment variable, external credentials, third-party service setup, infrastructure change, secret rotation, manual config change that the agent cannot perform):
- Do NOT attempt the fix
- Leave a comment on the issue explaining exactly what human action is needed
- Label the issue `needs-human`
- Stop the run

**If any check fails:**
- Do NOT merge or push
- Leave a comment on the issue: what failed and the relevant error output (truncated to ~20 lines)
- Label the issue `status:blocked`
- Stop the run

**If all checks pass (or no checks apply), proceed:**

## Step 5 — Update documentation

Before merging, check whether the fix changes any user-visible behavior, configuration, API, or interface. If yes, update the relevant documentation files:

- If the project has a `README.md` that describes the changed behavior — update it.
- If the project has a `docs/` directory with relevant pages — update them.
- If a changelog exists (`CHANGELOG.md`, `HISTORY.md`, etc.) — add an entry.

Skip this step if the fix is purely internal (refactor, test, build config) with no user-visible effect.

## Step 6 — Land the fix

**Branch rule — never cherry-pick to main/master on your own:**
If the `branch=` value from `.darkflow` is `dev`, `develop`, or any non-main/non-master branch, land the fix **only** on that branch. Do NOT cherry-pick, merge, or push to `main` or `master` independently — that is a human decision. Leave the fix in the configured branch and close the issue.

**If `merge_strategy=pr`:**
Open a pull request targeting the `branch=` value from `.darkflow` with `Closes #N` in the description. Merge the pull request into that branch.

**If `merge_strategy=direct`:**
Commit and push directly to the `branch=` value from `.darkflow`.

After landing, leave a comment on the issue with a brief summary of what was done:
- What was broken or missing
- What files were changed and how
- Any documentation that was updated

Then close the issue.

Language for GitHub comments and output: the `language=` value from `.darkflow`.
