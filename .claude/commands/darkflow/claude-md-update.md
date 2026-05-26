Scan the current codebase state and regenerate CLAUDE.md to keep it accurate.

## Step 1 — Read project config

Read `.darkflow` in the project root. Extract:
- `branch=` → main branch name for push (default: main)

If `.darkflow` is missing or has no `<!-- darkflow:start -->` marker in `CLAUDE.md`, skip the run without committing — leave no comment.

## Step 2 — Do the work

Study the current state of the code and update `CLAUDE.md` to reflect what is currently in the code.

Rules:
- Keep everything between `<!-- darkflow:start -->` and `<!-- darkflow:end -->` exactly as-is — do not touch it
- Only update the project-specific sections outside those markers (commands, architecture, env vars, patterns)
- Commit and push the changes to the `branch=` value from `.darkflow` only if something actually changed

If `CLAUDE.md` has no `<!-- darkflow:start -->` marker, skip the run without committing.

## Step 3 — After completing

Only if `CLAUDE.md` was actually updated and committed, append a routine-log entry to `docs/overview.html`:

1. Read `docs/overview.html`
2. In the JSON inside `<script id="overview-data">`, append to the `logs` array:
   ```json
   { "timestamp": "<current UTC ISO 8601>", "routine": "claude-md-update", "summary": "<one-line summary, e.g. 'Updated commands section and added 2 new env vars'>" }
   ```
3. Cap the array at the 50 most recent entries (drop older ones if it exceeds 50)
4. Write `docs/overview.html` — change nothing else in the JSON

Skip this step entirely if no changes were made to `CLAUDE.md`.
