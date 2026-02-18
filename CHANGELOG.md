# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2026-02-18

### Added

- Endpoint filter dropdown on Audit Logs tab to filter logs by specific endpoint
- Page resets to 1 when changing any filter (endpoint or status)

## [0.5.1] - 2026-02-18

### Fixed

- Fix 404 after Google OAuth by redirecting to `?tab=services` instead of non-existent `/services` route

## [0.5.0] - 2026-02-18

### Changed

- Switch Twitter from Bearer Token to OAuth 1.0a for full read/write access
- Store 4 OAuth credentials (API Key, API Secret, Access Token, Access Token Secret) as encrypted JSON
- Validate Twitter credentials via OAuth 1.0a-signed GET /2/users/me (returns @username as label)
- Show 4 separate input fields in Twitter connect dialog with updated help text

## [0.4.2] - 2026-02-18

### Changed

- Make developer.x.com a clickable link in Twitter setup help text

## [0.4.1] - 2026-02-18

### Added

- Help text for Twitter API key setup explaining where to get Bearer Token

## [0.4.0] - 2026-02-18

### Added

- Twitter / X service connection using bring-your-own Bearer Token approach
- 25 MCP tools for Twitter API v2: tweets, users, engagement, follows, mute/block, bookmarks, and DMs
- Twitter icon (X logo) in service icons
- Twitter API key validation on connect
- Provider-specific API key input placeholders

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
