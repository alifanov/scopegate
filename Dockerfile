# Stage 1: install all dependencies (build-time cache layer)
FROM node:22-slim AS deps
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma/
RUN pnpm install --frozen-lockfile

# Stage 2: build application with standalone output
FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN node_modules/.bin/prisma generate && \
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

# Prisma CLI for database migrations (separate from app runtime deps)
COPY package.json /tmp/package.json
RUN PRISMA_VERSION=$(node -e "console.log(require('/tmp/package.json').dependencies.prisma)") && \
    PRISMA_SKIP_POSTINSTALL_GENERATE=1 npm install --prefix /prisma-runtime "prisma@${PRISMA_VERSION}" && \
    npm cache clean --force && \
    rm /tmp/package.json

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh && \
    chown -R node:node /app /prisma-runtime /docker-entrypoint.sh

USER node

EXPOSE 3000
CMD ["/docker-entrypoint.sh"]
