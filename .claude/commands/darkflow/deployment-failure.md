Diagnose a failed deployment, fix the root cause, and redeploy.

## Step 1 — Read project config

Read `.darkflow` in the project root. Extract:
- `branch=` → main branch name (default: main)
- `language=` → output/issue language (default: English)

If `.darkflow` is missing, continue with the defaults.

## Step 2 — Do the work

A deployment has just failed. Do the following:

1. Get the deployment logs from the last failed deployment (Coolify or the platform configured for this project)
2. Identify the root cause — build error, runtime crash, missing env var, OOM, etc.
3. Fix the code or configuration that caused the failure
4. Commit and push the fix to the `branch=` value from `.darkflow`
5. Wait for the new deployment to complete
6. Check application logs to confirm the fix worked

**Hard stop:** If the root cause is unclear or the fix requires more than a small targeted change, do NOT guess — open a GitHub issue with label `priority:p0`, `source:signoz`, `area:infra` and leave a comment describing what you found. Then stop.

**Safety guardrail:** Do not modify database migrations, environment variables, or infrastructure config without explicit approval — create a `priority:p0` issue instead.

Language for all GitHub issues and output: the `language=` value from `.darkflow`.
