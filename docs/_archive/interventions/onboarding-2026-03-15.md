# Onboarding Flow Audit — ScopeGate — 2026-03-15

## Test Details
- **Desktop email**: onboarding-test-1773594297cl5b342652@ildoopgrao.resend.app
- **Mobile email**: onboarding-mobile-1773598016l7vxid37803@ildoopgrao.resend.app
- **Auth method**: Email/password (Better Auth) — instant login, no email verification
- **Magic link received**: N/A — auth is password-based, not magic-link
- **Screenshots**: `/tmp/onboarding-20260315-180456` (15 files)

## Flow Completion

| Step | Desktop | Mobile | Notes |
|------|---------|--------|-------|
| Landing loaded       | ✅ | ✅ | Both load fast, hero visible |
| Signup page reached  | ✅ | ✅ | /signup direct navigation works |
| Email submitted      | ✅ | ✅ | Form fills and submits cleanly |
| Email received       | — | — | No email verification — instant account creation |
| Post-login redirect  | ✅ | ✅ | Redirects to /projects with welcome modal |
| Dashboard visible    | ✅ | ✅ | Welcome modal shows 3-step guide |
| Core action reached  | ✅ | ✅ | Project created, integrations listed |

**Overall**: Flow completes end-to-end on both desktop and mobile without blockers.

## Screenshot Analysis

### desktop-01-landing.png
Dark-themed landing page. Hero: "Your AI agents have god-mode access to your data." — provocative, clear value prop. Multiple CTA buttons ("Start free — no card needed"). Sections: features, integrations, pricing, FAQ, blog. Trust signals: "Open-core", GitHub link. Cookie banner at bottom. **Good**: strong above-fold hook. **Issue**: page is long; multiple "Start free" buttons could dilute click intent tracking.

### desktop-02-signup.png
Cookie banner overlaps the top of the signup form card. Fields: Name, Email, Password (min 8 chars). CTA: "Create Account" (purple, full-width). Alternative: "Continue with Google". "Already have an account? Sign in" link at bottom. **Issue**: cookie banner must be dismissed before interacting with form — adds friction on first visit to /signup.

### desktop-03-form-filled.png
After dismissing cookie banner, form shows brand header (ScopeGate logo + "AI Access Proxy Layer" tagline). Fields correctly filled. Clean, centered layout. Cookie settings icon in bottom-left corner. **Good**: minimal, focused form. **Missing**: no password strength indicator, no show/hide password toggle.

### desktop-05-post-login.png (Welcome Modal)
Redirected to /projects. Welcome modal: "Welcome to ScopeGate!" with numbered 3-step guide:
1. **Create a project** — group your endpoints and connections
2. **Connect a service** — link Google Drive, Gmail, Calendar, and more
3. **Get your MCP URL** — paste it into your AI agent and start using it

CTA: "Create Your First Project" (purple). Sidebar: Projects, Billing, Settings. User name in top-right. **Good**: clear next step, concise guide. **Issue**: background behind modal is empty gray — if user dismisses modal by clicking X, empty state is not helpful.

### desktop-07-core-action.png (Create Project Modal)
Simple modal: "Create Project", one field "Project Name" with placeholder "My Project", CTA: "+ Create". **Good**: minimal friction, no unnecessary fields. **Could improve**: add brief context (e.g. "Projects group your service connections and MCP endpoints").

### desktop-08-project-created.png (Project Dashboard)
Project page with breadcrumb nav. **GETTING STARTED** checklist at top: "Connect a service", "Create MCP endpoint", "Copy MCP URL → use in your AI agent" — displayed as unchecked radio items. Tabs: MCP Endpoints, Auth Connections (active), Logs. Available integrations: Gmail, Google Calendar, Google Drive, Google Ads (more below fold). Toast: "Project created". **Good**: clear next step, integrations immediately visible. **Issues**: checklist items are NOT clickable — they should link to relevant actions; "Connect Service" button in top-right is slightly disconnected from the integration cards below.

### mobile-01-landing.png
Hamburger menu (≡) in top-right. Hero text stacks well: "Your AI agents have god-mode access to your data." Badge: "Open-core · Self-hostable · MCP-native". **Issue**: cookie banner overlaps "Scopegate is a permission gateway" description text, partially hiding it.

### mobile-02-signup.png
Clean stacked layout. Logo + tagline at top. Fields are full-width, properly sized for touch. "Create Account" button full-width purple. **Issue**: "Continue with Google" option is below the fold — users who prefer OAuth must scroll to discover it.

### mobile-03-form-filled.png
Fields properly filled. No overflow, no layout issues. Password dots visible. **Good**: input fields are tall enough for comfortable tapping.

### mobile-04-post-submit.png (Welcome Modal — Mobile)
Redirects to /projects. Welcome modal fits mobile viewport well. 3-step guide readable. "Create Your First Project" CTA prominent. X button accessible. **Good**: modal is well-proportioned for mobile.

### mobile-06-dashboard.png (Create Project — Mobile)
Simple modal, single field + Create button. Behind it, the "Create Your First Project" button from the previous step peeks through. **Good**: modal is properly sized.

### mobile-07-project-created.png (Project Dashboard — Mobile)
Project page loads. GETTING STARTED checklist items are on a single line — slightly cramped but readable. Tabs work. Integration cards are full-width. Toast: "Project created". Settings button top-right. **Good**: usable mobile layout, no horizontal overflow. **Issue**: Getting Started items read as a single paragraph on mobile — would be clearer as a stacked list.

## Issues Found

### Critical — blocks flow completion
None. The onboarding flow completes end-to-end on both desktop and mobile.

### High — confusing or frustrating

1. **Cookie banner overlaps signup form on desktop** — when a user lands directly on /signup (e.g. from an ad or shared link), the cookie banner covers the form heading and partially obscures the Name field. User must dismiss it before interacting. This adds friction at the highest-intent moment.

2. **Getting Started checklist items are not clickable** — the three checklist items on the project page ("Connect a service", "Create MCP endpoint", "Copy MCP URL") are displayed as text with empty circles but are not interactive. Users expect to click them to navigate to the relevant action. This is a missed opportunity to guide users through activation.

3. **No loading/success state on signup submit** — when clicking "Create Account", there's no visible loading spinner or button state change. The redirect happens after ~3 seconds with no feedback. On slower connections this would feel broken.

### Medium — noticeable friction

4. **Empty state behind welcome modal is blank** — if a user dismisses the welcome modal (clicks X), they see an empty Projects page with minimal guidance. The empty state card behind the modal is barely visible and not clearly actionable.

5. **No password visibility toggle** — signup form lacks a show/hide password button. Standard UX pattern users expect.

6. **"Continue with Google" below fold on mobile** — OAuth signup option requires scrolling on mobile signup page. Users who prefer Google auth may not discover it.

7. **No email verification** — accounts are created with any email, no verification step. While this reduces friction, it could lead to issues with typo'd emails (user locked out) and abandoned accounts with invalid emails.

### Low — minor polish

8. **No password strength indicator** — only "Minimum 8 characters" hint. No visual bar or feedback during typing.

9. **Toast notification overlaps content** — "Project created" toast at bottom-right overlaps the integrations list on desktop and the Google Calendar card on mobile.

10. **Cookie settings icon (floating circle, bottom-left)** — appears after accepting cookies. On mobile it slightly overlaps content and looks like a chat widget, creating confusion.

11. **Multiple identical "Start free" CTAs on landing page** — 4 instances of the same link. While standard for long pages, dilutes analytics tracking. Consider unique names per section.

## Mobile-Specific Issues

1. **Cookie banner covers landing page description text** — "Scopegate is a permission gateway..." is partially hidden behind the banner on first load.
2. **OAuth option below fold on signup** — "Continue with Google" requires scrolling.
3. **Getting Started checklist cramped** — three items displayed in a paragraph-like flow on narrow screens; stacking vertically would improve readability.
4. **No visible sidebar toggle indicator** — hamburger menu (≡) works but has no label. New users may not know the sidebar contains project navigation. Consider a brief tooltip or label on first visit.

## Prioritized Recommendations

### 1. Make Getting Started checklist clickable — High
**Where**: Project dashboard (`/projects/[id]`)
**Problem**: Checklist items (Connect a service, Create MCP endpoint, Copy MCP URL) are visual-only — not clickable. Users see a task list but can't act on it directly.
**Fix**: Make each item a link/button that navigates to the relevant action. Check off items as user completes them. Consider adding a progress bar.
**Impact on activation**: Direct — reduces clicks to first connection from 2 to 1. Makes the path to "aha moment" (working MCP endpoint) explicit and actionable.

### 2. Fix cookie banner overlap on signup — High
**Where**: `/signup` page
**Problem**: Cookie banner covers the form heading and Name field for first-time visitors who land directly on signup.
**Fix**: Either (a) move the cookie banner to bottom of viewport (not top), or (b) add top padding to the signup form when the banner is visible, or (c) auto-dismiss the banner after a timeout on auth pages.
**Impact on activation**: Signup is the highest-intent page — any friction here directly reduces conversion.

### 3. Add loading state to signup button — High
**Where**: "Create Account" button on `/signup`
**Problem**: No visual feedback after clicking. ~3s delay with no indication of progress.
**Fix**: Show spinner inside button, disable button during submission, optionally show "Creating your account..." text.
**Impact on activation**: Prevents double-clicks, reduces perceived slowness, builds trust.

### 4. Improve empty state behind welcome modal — Medium
**Where**: `/projects` page (empty state)
**Problem**: If user dismisses the welcome modal, they see a near-blank page.
**Fix**: Add a prominent empty state with illustration, guidance text ("You don't have any projects yet"), and a "Create Your First Project" button that re-shows the flow.
**Impact on activation**: Catches users who accidentally dismiss the modal and prevents dead-end experience.

### 5. Move "Continue with Google" above fold on mobile — Medium
**Where**: `/signup` page (mobile viewport)
**Problem**: OAuth option hidden below fold. Users who prefer Google signup may abandon.
**Fix**: Reorder — show Google OAuth first (above the form), then "OR" divider, then email form. Or make the form more compact to fit both options above fold.
**Impact on activation**: OAuth users convert faster (fewer fields). Not showing this option immediately loses a segment.

### 6. Add password show/hide toggle — Medium
**Where**: Password field on `/signup`
**Problem**: No way to verify what was typed. Common UX expectation.
**Fix**: Add eye icon toggle to password field.
**Impact on activation**: Small but reduces form errors and password reset loops.

### 7. Consider email verification flow — Low
**Where**: Post-signup
**Problem**: No verification of email address. Typos in email = locked out account.
**Fix**: Send verification email after signup. Allow limited access before verification but prompt to verify before core actions. Or validate email format more aggressively client-side.
**Impact on activation**: Prevents support burden from typo'd emails. Improves deliverability for future transactional emails.

## Quick Wins (< 1 day)

- **Add spinner to "Create Account" button** on submit — 30 min
- **Move cookie banner to bottom** of viewport on signup page — 30 min
- **Add show/hide password toggle** to password field — 1 hr
- **Make Getting Started checklist items clickable links** — 2-3 hrs
- **Add "Continue with Google" visibility on mobile** — reorder form components — 1 hr
- **Improve empty state text** on /projects when no projects exist — 1 hr
