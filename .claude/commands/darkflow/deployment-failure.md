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

## Step 3 — After completing

Append a routine-log entry to `docs/overview.html`:

1. Read `docs/overview.html`
2. In the JSON inside `<script id="overview-data">`, append to the `logs` array:
   ```json
   { "timestamp": "<current UTC ISO 8601>", "routine": "deployment-failure", "summary": "<one-line summary, e.g. 'Fixed missing env DATABASE_URL, redeploy OK'>" }
   ```
3. Cap the array at the 50 most recent entries (drop older ones if it exceeds 50)
4. Write `docs/overview.html` — change nothing else in the JSON
