# syntax=docker/dockerfile:1

# Stage 1: install all dependencies (build-time cache layer)
FROM node:22-slim AS deps
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && pnpm config set store-dir /pnpm/store
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN node -e "console.log(require('./package.json').dependencies.prisma)" > /prisma-version
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Stage 2: build application with standalone output
FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN --mount=type=cache,id=next,target=/app/.next/cache \
    node_modules/.bin/prisma generate && \
    node_modules/.bin/next build

# Stage 3: minimal production runtime
FROM node:22-slim AS runner
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Next.js standalone output (minimal node_modules via nft trace)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Prisma schema + migrations for runtime deploy
COPY --from=builder /app/prisma ./prisma

# Prisma CLI for database migrations (separate from app runtime deps).
# Reads only /prisma-version (not the whole package.json) and reuses the npm
# cache mount, instead of a second full package.json COPY straight into this stage.
COPY --from=deps /prisma-version /prisma-version
RUN --mount=type=cache,id=npm,target=/root/.npm \
    PRISMA_SKIP_POSTINSTALL_GENERATE=1 \
    npm install --prefix /prisma-runtime "prisma@$(cat /prisma-version)"

# Prisma config for runtime `migrate deploy`. The schema datasource has no url —
# it is supplied here from DATABASE_URL. Loaded from cwd /prisma-runtime by the
# entrypoint so that `prisma/config` resolves against the prisma CLI installed above.
COPY docker/prisma.config.ts /prisma-runtime/prisma.config.ts

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN mkdir -p /app/data && \
    chmod +x /docker-entrypoint.sh && \
    chown -R node:node /app /prisma-runtime /docker-entrypoint.sh

USER node

EXPOSE 3000

# node's global fetch — no curl/wget in node:22-slim, no extra layer needed
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["/docker-entrypoint.sh"]
