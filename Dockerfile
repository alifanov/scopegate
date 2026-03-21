FROM node:22-slim

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma/
RUN pnpm install --frozen-lockfile

COPY . .

ARG BETTER_AUTH_SECRET
ARG BETTER_AUTH_URL
ARG ADMIN_EMAIL
ARG ADMIN_PASSWORD

# Generate Prisma client and build Next.js; migrations run at container startup
RUN pnpm exec prisma generate && pnpm exec next build

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000
CMD ["/docker-entrypoint.sh"]
