Check whether this project's website is actually up: resolve DNS, hit the URL, verify the HTTP status is healthy, and confirm the page really loads (not a blank/error/maintenance page). If the site is **down or broken**, create an auto-approved `priority:critical` GitHub issue so `fix-issues` picks it up immediately and restores it.

This is an **active health check**: when the site is healthy it does nothing but write a snapshot. When the site is broken it files a critical, auto-approved issue describing exactly what failed (DNS, HTTP status, or empty/error body) so the fix can start without waiting for human triage.

> **Note — cheap pre-flight.** The dispatcher (`darkflow-run.sh`) runs a fast bash `curl` probe *before* launching this agent. On the common happy path (site returns 2xx with a real body) it writes the snapshot + metrics itself and **skips this agent entirely** — so on healthy runs you are not invoked at all. This agent runs only when the probe finds the site down/broken or can't decide (no `site_url`, DNS failure, etc.). When you *are* invoked, perform the full check below from scratch (the probe is only a coarse filter) and file the issue.

## Step 1 — Read project config

Run `bash .darkflow.d/get-config.sh` to pull the latest project settings from the Web UI and refresh the local `.darkflow` cache (silently falls back to cache if the server is unreachable).

Read `.darkflow` in the project root. Extract:
- `site_url=` → the public production URL to monitor (e.g. `https://example.com`)
- `language=` → output/issue language (default: English)

If `.darkflow` is missing, continue with defaults.

## Step 2 — Resolve the URL to check

If `site_url=` is set, use it. Otherwise, auto-discover the production URL from the project (first match wins):

- Coolify: `coolify app list` then the app's FQDN/domain (if the `coolify` CLI is configured)
- `vercel.json` / `.vercel/project.json` production domain
- `netlify.toml` site URL
- `CNAME` file (GitHub Pages custom domain)
- `package.json` → `homepage`
- A production URL stated in `README.md` or `docs/`

If a URL is found this way, persist it for next time:
```bash
grep -q "^site_url=" .darkflow || echo "site_url=<discovered-url>" >> .darkflow
```

If no URL can be determined at all, **do not create an issue**. Output `uptime-check: no site_url configured and none discoverable — skipping` and still write the snapshot (Step 5) noting that the target is unknown. Done.

## Step 3 — Run the checks

Run these in order against the resolved URL. Stop classifying at the first failure but gather enough detail to describe it.

**3a. DNS resolution**

```bash
host_only=$(printf '%s' "$URL" | sed -E 's#^https?://##; s#/.*$##; s#:.*$##')
getent hosts "$host_only" 2>/dev/null || nslookup "$host_only" 2>/dev/null || host "$host_only" 2>/dev/null
```

If the hostname does not resolve → status **down**, reason `dns` (DNS does not resolve — domain expired, misconfigured, or DNS provider down).

**3b. HTTP response**

```bash
curl -sS -A "darkflow-uptime/1.0" -L --max-time 25 \
  -o /tmp/uptime_body.html \
  -w 'http_code=%{http_code} time_total=%{time_total} final_url=%{url_effective}\n' \
  "$URL"
```

- curl exits non-zero (connection refused, TLS failure, timeout) → status **down**, reason `connection` (capture curl's error: refused / TLS / timeout).
- Final `http_code` is `5xx` → status **down**, reason `http_5xx`.
- Final `http_code` is `4xx` → status **down**, reason `http_4xx` (404/403 on the root usually means a broken deploy or misrouted domain).
- `http_code` is `2xx` (or `3xx` that resolved to a `2xx`) → continue to 3c.
- `time_total` > 10s but `2xx` → note as **degraded** (slow), reason `slow` — do not file a critical issue for slowness alone; record it in the snapshot.

**3c. Page actually loads**

Inspect `/tmp/uptime_body.html`:
- Body is empty or < 200 bytes → status **down**, reason `empty_body`.
- Body contains an obvious failure marker (case-insensitive): `502 Bad Gateway`, `503 Service`, `504 Gateway`, `Application error`, `This site can't be reached`, default `Welcome to nginx`, an unstyled framework error stack, or a maintenance page when none is expected → status **down**, reason `error_page` (quote the marker found).
- Otherwise → status **ok**. Note the `<title>` for the snapshot.

## Step 4 — File a critical issue if down

Only when status is **down**:

First check for an already-open uptime issue to avoid duplicates:
```bash
gh issue list --label "source:uptime" --state open --json number,title --limit 20
```
If an open `source:uptime` issue already describes the same outage, add a comment with the new timestamp/details instead of opening a duplicate.

Otherwise create the issue **auto-approved** so `fix-issues` acts immediately:

- Labels: `status:approved`, `source:uptime`, `priority:critical`
- Title: action-oriented — e.g. "Site down: <host> returns 502" / "Site down: <host> DNS does not resolve" / "Site down: <host> serves empty page"
- Body:
  ```
  ## What's broken
  <URL> is unreachable / broken as of <timestamp>.
  - Check that failed: <dns | connection | http_5xx | http_4xx | empty_body | error_page>
  - Observed: <http_code, curl error, or marker text>

  ## What to do
  <best-effort hypothesis: redeploy, fix DNS, restart container, fix routing, renew cert>
  Investigate the deploy/infra first; if the fix needs credentials or infrastructure
  access that isn't available, escalate to `needs-human`.

  ## Acceptance criteria
  - [ ] <URL> returns HTTP 200 and the page renders expected content
  - [ ] uptime-check passes on the next run
  ```

Security-style auto-approval applies: a down production site is an emergency. `fix-issues` runs its normal quality checks and escalates to `needs-human` if the fix requires secret rotation or infrastructure changes it can't perform.

Language for all GitHub issues and output: the `language=` value from `.darkflow`.

## Step 5 — Write snapshot and metrics

Write `docs/insights/uptime/YYYY-MM-DD.md` (use today's date; append a new section if today's file already exists — each run is a timestamped row):

```markdown
# Uptime Check — YYYY-MM-DD

**Target:** <URL or "unknown">

## Checks
| Time | DNS | HTTP code | Body | Latency | Result | Issue |
|---|---|---|---|---|---|---|
| HH:MM | ok/fail | 200 | ok/empty/error | 1.2s | ok / down / degraded | #N |

## Notes
<reason on failure; page <title> on success; recurring outages if seen in prior snapshots>
```

Save a snapshot so the Dark Flow worker can forward it to the web UI.

Write `.darkflow.d/state/metrics/uptime.json` (create parent directories if needed):

```json
{
  "url":        "<URL or empty>",
  "httpCode":   <integer or 0>,
  "latencyMs":  <integer>,
  "status":     "ok" | "degraded" | "down"
}
```

The worker will pick up this file on its next sync. You do not need to update any HTML files.
