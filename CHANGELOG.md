# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1] - 2026-02-18

### Changed

- Use distinct sidebar icons: Waypoints for Endpoints, Plug for Connections
- Center-align global settings page content
- Add collapsible sidebar with toggle button (desktop only)

## [0.3.0] - 2026-02-18

### Changed

- Move project settings access to gear icon next to project name in sidebar
- Redirect to project page after saving project name in settings
- Merge admin user management into global Settings page
- Remove separate Admin link from sidebar

## [0.2.3] - 2026-02-18

### Changed

- Add spacing between service icons and names in endpoint dialogs
- Redirect to endpoint detail page after successful MCP endpoint creation
- Replace "Details" button with clickable endpoint name link in endpoints list

## [0.2.2] - 2026-02-18

### Changed

- Flatten permission scopes list in endpoint create/edit dialogs (remove nesting, add single "Select All" checkbox)

## [0.2.1] - 2026-02-18

### Fixed

- Add missing migration to make `ServiceConnection.refreshToken` nullable (fixes P2011 null constraint violation)

## [0.2.0] - 2026-02-18

### Added

- OpenRouter connection support with API key authentication
- 9 OpenRouter MCP tools: chat completion, embeddings, list models, get model endpoints, get generation, key info, credits, activity, and list providers
- OpenRouter API helper (`openRouterFetch`) for authenticated API calls
- API key connection route (`POST /api/projects/:projectId/services/connect-api-key`)
- OpenRouter icon in service icons
- API key input form in Connect Service dialog for non-OAuth providers

### Changed

- Made `refreshToken` optional in `ServiceConnection` Prisma model to support API-key-based services
- Updated services dialog description from "Google service" to generic "service"

## [0.1.1] - 2026-02-17

### Added

- CHANGELOG.md with project history
- Versioning & changelog convention in CLAUDE.md

## [0.1.0] - 2026-02-17

### Added

- Initial release of ScopeGate
- Google Search Console API integration with all 10 methods
- Google service logos in connect modal, service cards, and endpoint views
- Lucide-react icons across all buttons
- Generated logo, favicon, and branding
- Better Auth authentication with Prisma adapter
- MCP endpoint generation with granular permissions
