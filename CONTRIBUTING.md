# Contributing to ScopeGate

Thanks for your interest in contributing to ScopeGate! Here's how to get started.

## Development Setup

1. Fork and clone the repository
2. Install dependencies:

```bash
pnpm install
```

3. Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

4. Start PostgreSQL and run migrations:

```bash
pnpm prisma migrate dev
```

5. Start the dev server:

```bash
pnpm dev
```

## Making Changes

1. Create a branch from `master`:

```bash
git checkout -b my-feature
```

2. Make your changes
3. Run the linter:

```bash
pnpm lint
```

4. Make sure the project builds:

```bash
pnpm build
```

5. Commit your changes and open a pull request

## Prisma Schema Changes

When modifying Prisma models, always create a migration:

```bash
pnpm prisma migrate dev --name describe-your-change
```

## Code Style

- TypeScript strict mode
- ESLint for linting (`pnpm lint`)
- Use `pnpm add -S` when adding dependencies

## Reporting Issues

Open an issue on GitHub with:
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node.js version, etc.)
