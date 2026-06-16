# CLAUDE.md

@.darkflow.d/claude.md

## Commands

```bash
pnpm dev            # dev server → localhost:3000
pnpm build          # prisma generate + migrate deploy + next build (requires live DB)
pnpm test           # vitest run
pnpm lint           # eslint
make df-run         # Dark Flow routine dispatcher (every 60s)
```

## Commits & CI

**Do NOT run `pnpm build` before or after commits.** The Dark Flow CI gate (`.github/workflows/darkflow-ci-gate.yml`) runs `install` → `lint` → `test` on every push/PR and verifies the build there, auto-filing a `source:ci` issue on failure. This **overrides** the global "always run `pnpm build` before committing" rule. Failing checks → `source:ci` issue → the `fix-ci-issue` worker pushes a fix (retries up to 3x, then `needs-human`); CI closes the issue on green. Running `pnpm lint`/`pnpm test` locally for fast feedback is fine but not required.

## Architecture

Next.js 16 App Router · Prisma 7 + PostgreSQL · Auth: better-auth · MCP server: Hono at `/api/mcp/[apiKey]` · OTel → SigNoz.

```
src/
  app/
    (auth)/           # login / register
    (dashboard)/      # admin / projects / settings / notifications
    api/
      mcp/[apiKey]/   # MCP HTTP endpoint (SSE keep-alive pings every 30s)
      cron/           # refresh-tokens (CRON_SECRET-guarded)
      oauth/          # OAuth callback handlers
      admin/          # invites / projects / users management
      notifications/  # notification API
      projects/[projectId]/  # per-project API
  lib/
    mcp/
      tools/          # per-service tool files (gmail, linkedin, stripe, airtable, calendar, calendly, openrouter, telegram, twitter-ads, …)
        index.ts      # TOOL_DEFINITIONS — aggregates all service tools
        types.ts      # ToolDefinition · ToolContext
      permissions.ts  # per-action permission definitions; PERMISSION_GROUPS derived from PROVIDER_REGISTRY
      handler.ts      # tool execution + audit logging; 30s per-tool timeout; OAuthTokenError detection
      metrics.ts      # lazy-init OTel counters (mcp.invalid_requests, mcp.blocked_requests)
      service-fetch.ts # unified transport — TRANSPORT_CONFIGS derived from PROVIDER_REGISTRY + SSRF-safe fetch
      safe-fetch.ts   # SSRF/DNS-rebinding-safe fetch (node:https); validates all A/AAAA records
      image-utils.ts  # image/video download helpers
      email-parser.ts # email parsing utilities
      <service>.ts    # service-specific helpers (ahrefs, semrush, email, youtube, …)
    auth.ts
    auth-middleware.ts   # AuthError / ForbiddenError / NotFoundError; requireAuth/requireProject helpers
    project-auth.ts      # project-level auth guards (verifies team membership)
    project-roles.ts     # PROJECT_ROLE constants; isProjectOwner()
    admin.ts             # isAdmin() helper (checks ADMIN_EMAIL env var)
    audit.ts             # recordAudit() — thin wrapper around mcp/audit-utils
    crypto.ts         # AES-256-GCM encrypt/decrypt (uses BETTER_AUTH_SECRET)
    oauth-flow.ts     # shared handleOAuthStart/handleOAuthCallback base logic
    oauth-state.ts    # HMAC-signed OAuth state (uses BETTER_AUTH_SECRET)
    oauth-token-lifecycle.ts  # unified token refresh for all 26 providers; OAuthTokenError class; derives config from provider-registry
    provider-registry.ts      # PROVIDER_REGISTRY — single source of truth for all 26 providers (token strategy, transport, permissions); add/remove a provider here only
    db.ts             # Prisma client
    provider-names.ts # OAuth provider display name map
  instrumentation.ts        # OTel hook (browser-safe entry point)
  instrumentation.node.ts   # OTel SDK init + PrismaInstrumentation (Node.js only)
prisma/
  schema.prisma       # User · Session · Account · Project · TeamMember ·
                      # ServiceConnection · McpEndpoint · EndpointPermission ·
                      # AuditLog · RateLimitBucket · Notification · InviteToken
docker/
  prisma.config.ts    # runtime Prisma config for migrate deploy (supplies DATABASE_URL; no dotenv)
```

## Environment

```
DATABASE_URL                 # PostgreSQL connection string
BETTER_AUTH_SECRET           # session signing key
BETTER_AUTH_URL              # full origin URL (e.g. https://scopegate.chatindex.app)
ADMIN_EMAIL / ADMIN_PASSWORD # bootstrapped on first start via bootstrap.ts
CRON_SECRET                  # Bearer token for /api/cron/* routes
GOOGLE_CLIENT_ID/SECRET      # Google OAuth
GOOGLE_ADS_DEVELOPER_TOKEN   # Google Ads API
LINKEDIN_CLIENT_ID/SECRET
GITHUB_CLIENT_ID/SECRET
HUBSPOT_CLIENT_ID/SECRET
JIRA_CLIENT_ID/SECRET
SALESFORCE_CLIENT_ID/SECRET
SLACK_CLIENT_ID/SECRET
META_APP_ID/SECRET           # Meta (Facebook/Instagram)
THREADS_APP_ID/SECRET
TWITTER_CLIENT_ID/SECRET
NOTION_CLIENT_ID/SECRET
OTEL_EXPORTER_OTLP_ENDPOINT  # SigNoz OTLP endpoint
OTEL_SERVICE_NAME            # service name for traces
OBSERVABILITY_URL            # SigNoz base URL
OBSERVABILITY_API_KEY        # SigNoz ingestion key
```

## Gotchas

- Prisma client output is `src/generated/prisma` — import from there, not `@prisma/client`
- `pnpm build` runs `prisma migrate deploy`; for DB-less CI use `prisma generate && next build`
- Docker: multi-stage build (deps → builder → runner); `node:22-slim` (not alpine) — `openssl` installed explicitly for Prisma; Next.js standalone output; runs as non-root `node` user; BuildKit pnpm cache mount
- Migrations run at container startup (`docker-entrypoint.sh`) from `/prisma-runtime/`, not at build time
- `docker/prisma.config.ts` is copied to `/prisma-runtime/` in the runner stage — Prisma 7 schema has no `datasource.url` (config-based); without it `migrate deploy` fails with "datasource.url property is required"
- `CRON_SECRET` must match `Authorization: Bearer <secret>` sent by the cron caller
- `BETTER_AUTH_SECRET` doubles as the key for AES-256-GCM token encryption (`crypto.ts`) and HMAC-SHA256 OAuth state signing (`oauth-state.ts`)
- Service credentials (API keys, tokens) are stored encrypted in `ServiceConnection.accessToken` — not in env vars
- OAuth token 4xx errors (invalid_grant etc.) are expected — `OAuthTokenError` thrown from `oauth-token-lifecycle.ts`, caught in `handler.ts` — not instrumented to avoid false-positive ERROR spans in SigNoz
- On `OAuthTokenError`: `handler.ts` calls `revokeConnectionWithNotification(connectionId, msg)` — sets connection `status="revoked"` and sends an in-app notification to all project team members; `markConnectionTokenError` still exists but is no longer called by handler
- All token refresh logic (proactive + on-demand) for all 26 providers lives in `oauth-token-lifecycle.ts` — do not duplicate in individual tool files
- `service-fetch.ts` is the unified MCP transport: use `serviceFetch(conn, provider, path, opts)` — handles token retrieval, base URL, provider-specific headers, SSRF protection, and emits OTel `CLIENT` spans (`service-fetch <provider>`) with `http.method`, `mcp.provider`, `url.path`, `http.status_code`; `safe-fetch.ts` is the low-level primitive
- `safe-fetch.ts` lives in `src/lib/mcp/` (not `src/lib/`) — import from `@/lib/mcp/safe-fetch`; timeout errors carry `err.name = "TimeoutError"` — catch by name (e.g. GSC `inspect_url`)
- MCP endpoint streams SSE; keep-alive pings sent every 30s to prevent proxy timeouts
- MCP tool execution has a 30s timeout per tool; enforced in `handler.ts`
- Middleware route-group blocking metrics tracked per-route via `mcp.blocked_requests` OTel counter (in `metrics.ts`)
- OTel route normalization (`instrumentation.node.ts`) uses `.next/routes-manifest.json` as primary source (present in production standalone output); falls back to `src/app/` walk for dev servers without a completed build — route groups (e.g. `/(auth)/`) are stripped from the fallback paths
- MCP `http.route="/api/mcp/[apiKey]"` is still set explicitly via `trace.getActiveSpan()` in `route.ts` as belt-and-suspenders — routes-manifest.json covers it but the explicit set ensures correctness regardless of build state
- Each MCP tool call is wrapped in an `mcp.tool <toolName>` OTel span (SERVER kind) in `handler.ts` — visible in SigNoz traces
- Prisma queries are traced via `PrismaInstrumentation` from `@prisma/instrumentation` — visible in SigNoz DB spans
- `RateLimitBucket` model provides atomic rate limiting (replaced `auditLog.count` pattern)
- OAuth provider helpers live in `src/lib/<provider>-oauth.ts`; shared base logic in `oauth-flow.ts`
- Google Search Console API responses are cached with retry on 429 and OTel metrics
- `safe-fetch.ts` uses `node:https` with custom lookup — validates ALL A/AAAA records before connecting, preventing DNS rebinding and multi-record SSRF (TOCTOU-safe); accepts optional `timeout` (ms) to abort slow requests (Threads uses 8 s); lookup honors `opts.all: true` (Node 20+ autoSelectFamily / Happy Eyeballs) — returns array of `{address, family}` to avoid "Invalid IP address: undefined" crash on node:22-slim
- Meta Graph API 400 errors: token-exchange failures are traced as sanitized `GET graph.facebook.com` spans with `error.code`/`error.type`; `metaAdsFetch` and `threadsFetch` read `error.code` from the JSON body — codes 190/102 → `OAuthTokenError`; other 4xx → generic error with code in the message.
- HTTP security headers (HSTS, X-Frame-Options, CSP `frame-ancestors 'none'`, nosniff) set globally in `next.config.ts`
- `@opentelemetry/sdk-trace-base` MUST be a direct dep (pinned `~2.7.1` to match the sibling `@opentelemetry/*` packages) — `instrumentation.node.ts` imports `BatchSpanProcessor`/`SpanProcessor`/`Span` from it, and pnpm's strict `node_modules` can't resolve transitive deps, so removing it breaks `next build` with "Module not found". Always change it via `pnpm add -S` so `package.json` and `pnpm-lock.yaml` stay in sync — editing `package.json` by hand causes `ERR_PNPM_OUTDATED_LOCKFILE` on deploy
- Public self-registration is disabled (`disableSignUp: true` in `auth.ts`) — `POST /api/auth/sign-up/email` returns an error; new users can only join via invite link
- Invite flow (`/api/auth/accept-invite`) uses direct Prisma calls (`db.user.create` + `db.account.create`) — NOT `auth.api.signUpEmail` (blocked by `disableSignUp`); new users get `emailVerified: true`
- To add or remove an OAuth/API-key provider, edit only `src/lib/provider-registry.ts` — `TRANSPORT_CONFIGS`, `PERMISSION_GROUPS`, and `getProviderConfig` are all derived from `PROVIDER_REGISTRY` automatically
