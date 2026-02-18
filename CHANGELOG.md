# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.11.4] - 2026-02-18

### Fixed

- Auto-discover enabled non-manager Google Ads account instead of blindly picking the first one (fixes CUSTOMER_NOT_ENABLED error)

## [0.11.3] - 2026-02-18

### Fixed

- Update Google Ads API version from v18 to v23 (v18 returned 404)

## [0.11.2] - 2026-02-18

### Fixed

- Include HTTP status and API response body in error messages across all services (Google Ads, Calendar, Search Console, Twitter, OpenRouter, OAuth) for better debugging in audit logs

## [0.11.1] - 2026-02-18

### Added

- Error details dialog in audit logs — click on truncated error text to view full error message with log metadata

## [0.11.0] - 2026-02-18

### Added

- Negative keywords support for Google Ads: list, add, and remove at both campaign and ad-group levels
- New permissions: `list_negative_keywords`, `add_negative_keyword`, `remove_negative_keyword`

## [0.10.1] - 2026-02-18

### Fixed

- Fix "v.map is not a function" crash in audit tab by correctly extracting endpoints array from API response

## [0.10.0] - 2026-02-18

### Added

- Implement all 43 Google Ads API handlers with real API calls (replacing stubs)
- Google Ads helper module (`google-ads.ts`) with GAQL query, mutate, and recommendation endpoints
- Auto-discover and cache Google Ads customer ID during OAuth callback
- `metadata` JSON field on ServiceConnection for storing provider-specific data (e.g., customer ID)
- Prisma migration for metadata field

## [0.9.0] - 2026-02-18

### Added

- Expand Google Ads permissions from 7 to 43 actions covering full API surface
- Read operations: ads, search terms, audiences, conversions, extensions, budgets, bid strategies, recommendations, change history, labels, assets, asset groups, geo and device performance
- Write operations: create/update/pause/enable campaigns, ad groups, ads, keywords, budgets, recommendations, labels

## [0.8.0] - 2026-02-18

### Changed

- Switch to Lavender Mist theme: violet-tinted backgrounds, soft violet accents, warm neutrals across light and dark modes

### Removed

- Design system page (`/design-system`)

## [0.7.0] - 2026-02-18

### Added

- Design system page at `/design-system` with living reference of all UI components
- Sections for colors, typography, buttons, badges, form elements, cards, tabs, icons, skeletons, separators, border radius, and spacing

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
