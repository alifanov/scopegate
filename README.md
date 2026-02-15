# ScopeGate

AI Access Proxy Layer. Connect external services (e.g. Google), define granular permissions, and receive an MCP endpoint URL for use in AI agents. Acts as a permission gateway — exposing only the specific capabilities you authorize, more granular than native OAuth scopes.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma 7
- **UI**: Tailwind CSS v4, shadcn/ui
- **Auth**: Better Auth (database-backed sessions, Prisma adapter)
- **MCP**: `@modelcontextprotocol/sdk` (Streamable HTTP)
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL

### Setup

1. Clone the repository and install dependencies:

```bash
pnpm install
```

2. Copy the environment file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Secret key for session signing |
| `BETTER_AUTH_URL` | App base URL (e.g. `http://localhost:3000`) |
| `ADMIN_EMAIL` | Bootstrap admin email |
| `ADMIN_PASSWORD` | Bootstrap admin password |

3. Run database migrations:

```bash
pnpm prisma migrate dev
```

4. Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login & register pages
│   ├── (dashboard)/         # Protected dashboard pages
│   │   └── projects/        # Project management, endpoints, audit, settings
│   ├── api/
│   │   ├── auth/[...all]/    # Better Auth catch-all handler
│   │   ├── projects/        # Projects CRUD, endpoints, services, audit
│   │   └── mcp/[apiKey]/    # MCP Streamable HTTP handler
│   ├── layout.tsx
│   └── page.tsx             # Landing page
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── layout/              # Sidebar, header
│   └── shared/              # Reusable app components
├── lib/
│   ├── db.ts                # Prisma client singleton
│   ├── auth.ts              # Better Auth server instance
│   ├── auth-client.ts       # Better Auth client SDK
│   ├── auth-middleware.ts   # getCurrentUser() helper
│   ├── bootstrap.ts         # Admin user bootstrap on empty DB
│   └── mcp/
│       ├── permissions.ts   # Permission groups (source of truth)
│       ├── tools.ts         # MCP tool definitions
│       └── handler.ts       # MCP server factory
├── generated/prisma/        # Generated Prisma client
└── middleware.ts             # Route protection
```

## Available Scripts

```bash
pnpm dev              # Start development server
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm prisma generate  # Regenerate Prisma client
pnpm prisma migrate dev  # Create and apply migrations
pnpm prisma studio    # Open Prisma Studio (DB browser)
```

## How It Works

1. **Login** — sign in with admin credentials (bootstrapped from env vars on first run)
2. **Create a Project** — organize endpoints and services by project
3. **Connect a Service** — add a service connection to the project
4. **Create an MCP Endpoint** — select a service connection and pick specific permissions (e.g. `gmail:read_emails`, `calendar:create_event`)
5. **Use the MCP URL** — plug the endpoint URL into any MCP-compatible AI agent; only the allowed actions are exposed
6. **Monitor** — track every request in the audit log

## Permissions

Permissions are defined in `src/lib/mcp/permissions.ts` and grouped by service:

| Group | Actions |
|---|---|
| Gmail | `gmail:read_emails`, `gmail:send_email`, `gmail:list_labels`, `gmail:search_emails` |
| Google Calendar | `calendar:list_events`, `calendar:create_event`, `calendar:update_event`, `calendar:delete_event` |
| Google Drive | `drive:list_files`, `drive:read_file`, `drive:create_file`, `drive:delete_file` |

## Database Schema

- **User** — authentication, team membership
- **Session** — database-backed auth sessions
- **Account** — auth provider credentials (email/password)
- **Project** — logical grouping for services and endpoints
- **TeamMember** — user-project relationship with roles (owner/member)
- **ServiceConnection** — OAuth tokens for connected services
- **McpEndpoint** — MCP endpoint with API key, rate limit, active status
- **EndpointPermission** — allowed actions per endpoint
- **AuditLog** — request log with action, status, duration, errors

## License

See [LICENSE](LICENSE).
