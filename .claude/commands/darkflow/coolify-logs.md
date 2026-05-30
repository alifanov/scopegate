Check Coolify deployment health daily: surface errors, detect failed deploys, and create GitHub issues. This is a passive health check — it does not auto-fix anything.

All Coolify data is fetched via the official `coolify` CLI (not an MCP server). Config lives at `~/.config/coolify/config.json`.

## Step 1 — Read project config

Read `.darkflow` in the project root. Extract:
- `coolify_app=` → Coolify app UUID for this project (optional; if missing, resolve it in Step 2)

If `.darkflow` is missing, continue normally.

## Step 2 — Resolve the app UUID

If `coolify_app=` is not set, list apps and find the UUID by name/project:

```bash
coolify app list
```

## Step 3 — Check deployment status

Check the deployment history for failed/red deploys first:

```bash
coolify app deployments list APP_UUID
```

- If the latest deployment is in a **failed or error state**: create a `priority:p0` GitHub issue immediately:
  - Labels: `status:proposed`, `source:infra`, `priority:p0`, `area:infra`
  - Title: "Fix failed deployment: <error summary>"
  - Body: the deployment metadata + identified error. For details of the failed deploy:
    ```bash
    coolify deploy get DEPLOYMENT_UUID --format pretty
    ```

Stop here if there is a failed deployment — do not proceed to Step 4.

## Step 4 — Review recent runtime logs

```bash
coolify app logs APP_UUID -n 100
```

Identify errors, restarts, crash loops, OOM kills, port conflicts, or missing env vars.

For each significant problem found, create a GitHub issue:
- Labels: `status:proposed`, `source:infra`, `priority:p1` for active failures, `priority:p2` for recurring warnings
- Body: paste the relevant log excerpt (truncated to ~30 lines) + what likely caused it

If no problems found, output: `Coolify health OK — no errors in the last 24h.`

## Guardrails

- Never trigger a new deployment — this is a passive check.
- Never expose secrets from logs in output — redact anything that looks like a key/token.
