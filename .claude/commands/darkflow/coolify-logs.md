Check Coolify deployment health daily: surface errors, detect failed deploys, and create GitHub issues. This is a passive health check — it does not auto-fix anything.

## Step 1 — Read project config

Read `.darkflow` in the project root. No config values are required for this command; if `.darkflow` is missing, continue normally.

## Step 2 — Check deployment status

Check the current deployment status in Coolify for this project:

- If the latest deployment is in a **failed or error state**: create a `priority:p0` GitHub issue immediately:
  - Labels: `status:proposed`, `source:infra`, `priority:p0`, `area:infra`
  - Title: "Fix failed deployment: <error summary>"
  - Body: latest deployment logs (truncated to ~50 lines) + the identified error

Stop here if there is a failed deployment — do not proceed to Step 3.

## Step 3 — Review recent logs

Get Coolify logs for this project for the last 24h. Identify errors, restarts, or crash loops.

For each significant problem found:
- Labels: `status:proposed`, `source:infra`, `priority:p1` for active failures, `priority:p2` for recurring warnings
- Body: paste the relevant log excerpt (truncated to ~30 lines) + what likely caused it

If no problems found, output: `Coolify health OK — no errors in the last 24h.`
