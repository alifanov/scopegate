Check the Coolify **runtime logs** for this project: surface errors, crashes, and warnings, and create GitHub issues for significant problems. This is a passive health check — it does not auto-fix anything.

For deployment-pipeline status (failed/red deploys), use `/darkflow:coolify-check-deployment` instead — this command only looks at runtime container logs.

Application **discovery** uses the official `coolify` CLI (not an MCP server). Config lives at `~/.config/coolify/config.json`.

> **Per-container logs require SSH.** The `coolify` CLI cannot return the logs of a specific
> container, so this command reads them over SSH with `docker logs`. **You MUST get explicit
> permission before opening any SSH connection:**
> - **Interactive run:** ask the user plainly — *«Можно ли использовать SSH-подключение к серверу Coolify (`<host>`) для чтения логов контейнера?»* — and wait for an explicit "yes". If denied, **stop** and report that container logs cannot be inspected without SSH access.
> - **Unattended / scheduled run:** SSH must be pre-approved (host/user/key configured in `.darkflow`). If it is not configured, **skip** log fetching, say so in the output, and open a `priority:p3` issue titled "Coolify SSH access not configured for log checks".

## Step 1 — Read project config

Read `.darkflow` in the project root. Extract:
- `coolify_app=` → Coolify app UUID for this project (optional; if missing, resolve it in Step 2)
- `coolify_ssh=` → SSH target for the Coolify host, e.g. `user@host` (used in Step 4 to read container logs)

If `.darkflow` is missing, continue normally. If `coolify_ssh=` is missing, handle SSH access per the permission rule above (ask the user interactively, or skip on unattended runs).

## Step 2 — Resolve the app UUID

If `coolify_app=` is not set, list apps and find the UUID by name/project:

```bash
coolify app list
```

## Step 3 — Get SSH permission and locate the containers

**First, get permission to use SSH** (see the permission rule at the top). Do not connect until
approved. On an interactive run, ask the user; on an unattended run, require `coolify_ssh=` to be
configured — otherwise skip to the "SSH not available" handling above.

Once approved, list the running containers on the Coolify host and match them to the app:

```bash
ssh <coolify_ssh> 'docker ps --format "{{.Names}}\t{{.Image}}\t{{.Status}}"'
```

An app may run **more than one container** — multiple replicas, or a docker-compose stack with
several services. **If more than one container belongs to the app, you must review the logs of
every one — not just one.** Missing a single crashing or OOM-killed container means missing the
actual incident.

## Step 4 — Review per-container runtime logs over SSH

For **each** container that belongs to the app, read its recent logs directly with `docker logs`:

```bash
ssh <coolify_ssh> 'docker logs --tail 200 <container-name>'
```

- Bound the output with `--tail N` and/or `--since 1h`. **Never** use `--follow` — it never returns in an automated run.
- Repeat for every container belonging to the app; evaluate each one separately — do not stop at the first container's logs.

For each container, identify errors, restarts, crash loops, OOM kills, port conflicts, or missing env vars. For each significant problem found, create a GitHub issue:
- Labels: `status:proposed`, `source:infra`, `priority:p1` for active failures, `priority:p2` for recurring warnings
- Title: include the affected container/service name when the app is multi-container
- Body: paste the relevant log excerpt (truncated to ~30 lines) + which container it came from + what likely caused it

If no problems found in any container, output: `Coolify logs OK — no errors across all containers in the last 24h.`

## Guardrails

- Never trigger a new deployment or restart — this is a passive check.
- Never expose secrets from logs in output — redact anything that looks like a key/token.
- **Always get explicit approval before opening any SSH connection.** If denied (or SSH is not configured on an unattended run), skip log fetching and report — do not work around it.
- Over SSH, run only **read-only** commands (`docker ps`, `docker logs`). Never restart, stop, exec into, or otherwise modify containers.
