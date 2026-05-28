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
