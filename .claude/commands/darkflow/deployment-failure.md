Diagnose a failed deployment, fix the root cause, and redeploy.

Coolify is accessed via the official `coolify` CLI (not an MCP server). Config lives at `~/.config/coolify/config.json`.

## Step 1 — Read project config

Read `.darkflow` in the project root. Extract:
- `branch=` → main branch name (default: main)
- `language=` → output/issue language (default: English)
- `coolify_app=` → Coolify app UUID for this project (optional; resolve via `coolify app list` if missing)

If `.darkflow` is missing, continue with the defaults.

## Step 2 — Do the work

A deployment has just failed. Do the following:

1. Get the failed deployment and its details:
   ```bash
   coolify app deployments list APP_UUID          # find the latest failed deploy UUID
   coolify deploy get DEPLOYMENT_UUID --format pretty
   coolify app logs APP_UUID -n 100               # runtime logs for crash diagnosis
   ```
2. Identify the root cause — build error, runtime crash, missing env var, OOM, etc.
3. Fix the code or configuration that caused the failure
4. Commit and push the fix to the `branch=` value from `.darkflow`
5. Wait for the new deployment to complete, then re-check:
   ```bash
   coolify app deployments list APP_UUID
   coolify app get APP_UUID --format pretty       # status should be running
   ```
6. Check application logs (`coolify app logs APP_UUID -n 100`) to confirm the fix worked

**Hard stop:** If the root cause is unclear or the fix requires more than a small targeted change, do NOT guess — open a GitHub issue with label `priority:p0`, `source:manual`, `area:infra` and leave a comment describing what you found. Then stop.

**Safety guardrail:** Do not modify database migrations, environment variables, or infrastructure config without explicit approval — create a `priority:p0` issue instead. Pushing to `branch=` triggers the redeploy automatically; do not run `coolify deploy uuid` manually unless a push-based redeploy is not configured.

Language for all GitHub issues and output: the `language=` value from `.darkflow`.
