Check Coolify deployment logs, fix errors, wait for successful redeployment, and verify app health.

## Step 1 — Read project config

Read `.darkflow` in the project root. No config values are required for this command; if `.darkflow` is missing, continue normally.

## Step 2 — Do the work

1. Get logs for this project in Coolify for the last 24h
2. Check for errors
3. Fix these errors
4. Wait for successful deployment
5. Check app logs after deployment

If the fix requires more than a small targeted change, create a GitHub issue instead of auto-fixing.

## Step 3 — After completing

Append a routine-log entry to `docs/overview.html`:

1. Read `docs/overview.html`
2. In the JSON inside `<script id="overview-data">`, append to the `logs` array:
   ```json
   { "timestamp": "<current UTC ISO 8601>", "routine": "coolify-logs", "summary": "<one-line summary, e.g. 'No errors in last 24h, deploy healthy'>" }
   ```
3. Cap the array at the 50 most recent entries (drop older ones if it exceeds 50)
4. Write `docs/overview.html` — change nothing else in the JSON
