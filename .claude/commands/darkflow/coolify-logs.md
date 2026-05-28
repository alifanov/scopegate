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
