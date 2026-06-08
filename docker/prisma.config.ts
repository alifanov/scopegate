// Prisma config used ONLY inside the production container by docker-entrypoint.sh
// to run `prisma migrate deploy`. It is intentionally separate from the repo-root
// prisma.config.ts: the standalone runner image has no app-level node_modules, so
// the Prisma CLI is installed into /prisma-runtime and this config is loaded from
// there (cwd /prisma-runtime). Paths point at the schema/migrations copied to /app.
//
// DATABASE_URL is provided by the container environment (Coolify), so there is no
// `dotenv` import here — keeping this config dependency-free aside from `prisma`.
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "/app/prisma/schema.prisma",
  migrations: {
    path: "/app/prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
