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
      tools/          # per-service tool files (gmail, linkedin, stripe, etc.)
        index.ts      # TOOL_DEFINITIONS — aggregates all service tools
        types.ts      # ToolDefinition · ToolContext
      permissions.ts  # per-action permission definitions
      handler.ts      # tool execution + audit logging; 30s per-tool timeout; OAuthTokenError detection
      metrics.ts      # lazy-init OTel counters (mcp.invalid_requests, mcp.blocked_requests)
      service-fetch.ts # unified transport — TRANSPORT_CONFIGS per provider + SSRF-safe fetch
      safe-fetch.ts   # SSRF/DNS-rebinding-safe fetch (node:https); validates all A/AAAA records
      <service>.ts    # service-specific helpers (ahrefs, semrush, email, youtube, …)
    auth.ts
    crypto.ts         # AES-256-GCM encrypt/decrypt (uses BETTER_AUTH_SECRET)
    oauth-flow.ts     # shared handleOAuthStart/handleOAuthCallback base logic
    oauth-state.ts    # HMAC-signed OAuth state (uses BETTER_AUTH_SECRET)
    oauth-token-lifecycle.ts  # unified token refresh for all 11 providers; OAuthTokenError class
    db.ts             # Prisma client
    audit-utils.ts    # audit log helpers
    image-utils.ts    # image/video download helpers
    email-parser.ts   # email parsing utilities
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
- All token refresh logic (proactive + on-demand) for all 11 providers lives in `oauth-token-lifecycle.ts` — do not duplicate in individual tool files
- `service-fetch.ts` is the unified MCP transport: use `serviceFetch(conn, provider, path, opts)` — handles token retrieval, base URL, provider-specific headers, SSRF protection; `safe-fetch.ts` is the low-level primitive
- `safe-fetch.ts` lives in `src/lib/mcp/` (not `src/lib/`) — import from `@/lib/mcp/safe-fetch`
- MCP endpoint streams SSE; keep-alive pings sent every 30s to prevent proxy timeouts
- MCP tool execution has a 30s timeout per tool; enforced in `handler.ts`
- Middleware route-group blocking metrics tracked per-route via `mcp.blocked_requests` OTel counter (in `metrics.ts`)
- MCP `http.route="/api/mcp/[apiKey]"` is set explicitly via `trace.getActiveSpan()` in `route.ts` — production build has no `src/app/`, so framework-level route normalization returns the raw path with the API key instead of the pattern
- Prisma queries are traced via `PrismaInstrumentation` from `@prisma/instrumentation` — visible in SigNoz DB spans
- `RateLimitBucket` model provides atomic rate limiting (replaced `auditLog.count` pattern)
- OAuth provider helpers live in `src/lib/<provider>-oauth.ts`; shared base logic in `oauth-flow.ts`
- Google Search Console API responses are cached with retry on 429 and OTel metrics
- `safe-fetch.ts` uses `node:https` with custom lookup — validates ALL A/AAAA records before connecting, preventing DNS rebinding and multi-record SSRF (TOCTOU-safe); accepts optional `timeout` (ms) to abort slow requests (Threads uses 8 s)
- HTTP security headers (HSTS, X-Frame-Options, CSP `frame-ancestors 'none'`, nosniff) set globally in `next.config.ts`
