# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ScopeGate** is an AI Access Proxy Layer built with Next.js. Users connect external services (e.g., Google), define granular permissions, and receive an MCP endpoint URL for use in AI agents. It acts as a permission gateway — exposing only the specific capabilities the user authorizes, more granular than the service's native OAuth scopes.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Package Manager**: pnpm (use `pnpm add -S` to install with save)
- **Database ORM**: Prisma
- **Language**: TypeScript

## Commands

```bash
pnpm dev          # Start development server
pnpm build        # Production build
pnpm lint         # Run linter
pnpm prisma generate   # Regenerate Prisma client after schema changes
pnpm prisma migrate dev # Create and apply migrations
```

## Prisma Convention

Always create a migration when changing Prisma models (`pnpm prisma migrate dev`).
