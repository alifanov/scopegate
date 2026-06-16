Check the Coolify **deployment status** for this project: detect failed/red deploys and create a high-priority GitHub issue. This is a passive health check — it does not auto-fix or trigger anything.

This command only looks at the deployment pipeline status. Runtime container errors, crashes, and OOM signals are covered by your observability tool (SigNoz/Datadog/Grafana) via `/darkflow:observability-check`, since container logs already ship there.

All Coolify data is fetched via the official `coolify` CLI (not an MCP server). Config lives at `~/.config/coolify/config.json`.

## Step 1 — Read project config

Run `bash .darkflow.d/get-config.sh` to pull the latest project settings from the Web UI and refresh the local `.darkflow` cache (silently falls back to cache if the server is unreachable).

Read `.darkflow` in the project root. Extract:
- `coolify_app=` → Coolify app UUID for this project (optional; if missing, resolve it in Step 2)
- `language=` → output/issue language (default: English)

If `.darkflow` is missing, continue normally.

## Step 2 — Resolve the app UUID

If `coolify_app=` is not set, list apps and find the UUID by name/project:

```bash
coolify app list
```

## Step 3 — Check deployment status

Check the deployment history for failed/red deploys:

```bash
coolify app deployments list APP_UUID
```

- If the latest deployment is in a **failed or error state**: create a `priority:critical` GitHub issue:
  - Labels: `status:proposed`, `source:infra`, `priority:critical`
  - Title: "Fix failed deployment: <error summary>"
  - Body: the deployment metadata + identified error. For details of the failed deploy:
    ```bash
    coolify deploy get DEPLOYMENT_UUID --format pretty
    ```

If the latest deployment succeeded, output: `Coolify deployment OK — latest deploy succeeded.`

Language for all GitHub issues and output: the `language=` value from `.darkflow`.

## Guardrails

- Never trigger a new deployment — this is a passive check.
- Never expose secrets from deployment output — redact anything that looks like a key/token.
