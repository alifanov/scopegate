# Onboarding Flow Audit — ScopeGate — 2026-03-08

## Test Details
- Desktop email: `onboarding-test-1772995627jda50w28822@ildoopgrao.resend.app`
- Mobile email: `onboarding-mobile-1772999582e5j79i50100@ildoopgrao.resend.app`
- Magic link / email verification: **Not applicable** — signup uses password auth, no email verification step
- Screenshots: `/tmp/onboarding-20260308-194142` (16 files)
- Note: Mobile viewport emulation was limited — agent-browser doesn't support runtime viewport resizing. Mobile CSS breakpoints (`max-width: 600px`) confirmed present via JS inspection.

## Flow Completion

| Step | Desktop | Mobile | Notes |
|------|---------|--------|-------|
| Landing loaded       | ✅ | ✅ | Fast load, strong hero section |
| Signup page reached  | ✅ | ✅ | "Start free" CTA clear in nav |
| Email submitted      | ✅ | ✅ | Instant account creation |
| Email received       | N/A | N/A | No email verification — password-based auth |
| Post-login redirect  | ✅ | ✅ | Redirects to /projects |
| Dashboard visible    | ✅ | ✅ | Clean empty state with CTA |
| Core action reached  | ✅ | N/A | Created project, landed on connections page with Getting Started checklist |

## Screenshot Analysis

### desktop-01-landing.png
- **Strong hero**: "Your AI agents have god-mode access to your data" — provocative, attention-grabbing
- **Clear CTA**: "Start free — no card needed" prominent above fold
- **Trust signals**: Open-core badge, GitHub link, security incidents counter, code snippet
- **Issue**: Landing page is very long — many sections (features, pricing, FAQ, blog). Users may scroll past the CTA

### desktop-02-signup.png
- **Cookie banner blocks the "Create Account" button** — user can't see the submit button until they dismiss cookies
- Clean form: Name, Email, Password — minimal fields (good)
- Google OAuth alternative available
- "Already have an account? Sign in" link present

### desktop-03-form-filled.png
- Form filled correctly, all fields visible after cookie banner dismissed
- Purple "Create Account" button is prominent and well-labeled
- Google OAuth as secondary option — good hierarchy

### desktop-04-post-submit.png (Dashboard)
- **Instant redirect to /projects** — no email verification, no welcome screen
- Empty state: "No projects yet" with folder icon and "Create Your First Project" CTA
- Sidebar: Projects, Billing, Settings — minimal and clear
- **Missing**: No welcome message, no onboarding tooltip, no "here's what to do first" guidance

### desktop-07-core-action-modal.png
- Create Project modal: single "Project Name" field with "My Project" placeholder
- Simple and fast — minimal friction to create first project

### desktop-08-project-created.png
- **Excellent**: "GETTING STARTED" checklist immediately visible with 3 steps:
  1. Connect a service
  2. Create MCP endpoint
  3. Copy MCP URL → use in your AI agent
- Available integrations shown: Gmail, Google Calendar, Google Drive, Google Ads
- Tabs: MCP Endpoints, Auth Connections, Logs
- "Connect Service" button prominent
- Toast: "Project created" confirmation

### mobile-01-landing.png
- Could not properly emulate mobile viewport (fixed at 1280px)
- CSS has `max-width: 600px` breakpoint and hamburger menu element exists in DOM
- **Cannot fully assess mobile layout** from this test

## Issues Found

### Critical — blocks flow completion
None — the flow completes end-to-end without errors.

### High — confusing or frustrating

1. **Cookie banner overlaps signup CTA** — On the signup page, the cookie consent banner covers the "Create Account" button. Users must dismiss cookies before they can submit the form. This adds unnecessary friction at the highest-intent moment.

2. **No welcome screen or onboarding guidance after signup** — After account creation, the user lands on a bare "/projects" page with "No projects yet." There's no welcome message, no "Hi [Name]!", no quick explanation of what ScopeGate does or what the first step should be. The empty state CTA ("Create Your First Project") is decent but insufficient for first-time orientation.

3. **No email verification** — Accounts are created without verifying the email address. This is a security concern (anyone can create accounts with any email) and a deliverability risk (fake accounts, no confirmed contact channel for password resets).

### Medium — noticeable friction

4. **Username truncated in nav** — The email address is truncated (`onboarding-test-17729956...`) in the top-right nav. For long test emails this is expected, but even normal emails may truncate. Consider showing the user's Name instead.

5. **"Collapse sidebar" text partially hidden by cookie icon** — The cookie settings icon in the bottom-left overlaps with the "Collapse" sidebar button, creating visual clutter.

6. **No password strength indicator** — The signup form accepts any password without showing strength. Adding a strength meter reduces account security friction and sets expectations.

7. **Landing page has competing CTAs** — Multiple "Start free" buttons at different scroll positions (nav, hero, pricing, footer). While intentional for conversion, the pricing section "Start free" links to `/login` while others link to `/signup` — inconsistent behavior.

### Low — minor polish

8. **No loading state on signup submit** — After clicking "Create Account," there's no spinner or disabled state on the button. Fast connection makes this invisible, but on slow connections users might double-click.

9. **Signup form doesn't show password requirements** — No hint about minimum length or character requirements before submission.

10. **Project creation modal lacks description field** — A single "Project Name" field is great for speed, but an optional description would help users organize multiple projects later.

## Mobile-Specific Issues

- **Could not fully test**: Browser automation tool (agent-browser) doesn't support runtime viewport resizing. Viewport fixed at 1280px.
- **CSS responsive breakpoint exists**: `max-width: 600px` media query confirmed in stylesheets.
- **Hamburger menu element exists in DOM** — responsive nav is implemented.
- **Sidebar on dashboard**: At desktop width, the sidebar is always visible. Need to verify it collapses to a hamburger/overlay on mobile.
- **Recommendation**: Manual mobile testing needed on a real device or Chrome DevTools to fully validate.

## Prioritized Recommendations

### 1. Fix cookie banner overlap on signup page — High
**Where:** `/signup` page
**Problem:** Cookie consent banner covers the "Create Account" button, blocking form submission
**Fix:** Either auto-dismiss the cookie banner on the signup page, move it to the top of the page, or make it a slim bar that doesn't overlap the form
**Impact on activation:** Removes friction at the highest-intent moment — directly improves signup completion rate

### 2. Add a welcome screen after first signup — High
**Where:** Post-signup redirect (currently goes straight to `/projects`)
**Problem:** New users land on an empty dashboard with no orientation. They don't know what ScopeGate does for them or what to do first
**Fix:** Add a brief welcome interstitial or modal after first signup: "Welcome, [Name]! Here's how to get started: 1) Create a project, 2) Connect a service, 3) Get your MCP URL." Alternatively, show an enhanced empty state with a video or walkthrough
**Impact on activation:** Significantly increases % of users who create their first project and reach the "aha moment"

### 3. Add email verification — High
**Where:** Signup flow
**Problem:** No email verification means fake accounts, no confirmed contact channel, and potential abuse
**Fix:** Add email verification after signup (can be non-blocking — let users access the dashboard but show a banner "Verify your email to unlock all features")
**Impact on activation:** Improves account quality and ensures password reset works. Non-blocking approach maintains low friction

### 4. Show user name instead of truncated email in nav — Medium
**Where:** Dashboard header, top-right
**Problem:** Email truncated to `onboarding-test-17729956...` — not user-friendly
**Fix:** Display the user's Name (already collected at signup) instead of email. Show email in a dropdown menu
**Impact on activation:** Small polish but improves perceived professionalism

### 5. Consistent CTA destinations — Medium
**Where:** Landing page pricing section
**Problem:** "Start free" in pricing section links to `/login` while other CTAs link to `/signup`
**Fix:** All "Start free" CTAs should go to `/signup`. If the user already has an account, the signup page has a "Sign in" link
**Impact on activation:** Removes confusion for new users who click "Start free" on pricing and see a login form

### 6. Add password requirements hint — Low
**Where:** Signup form
**Problem:** No indication of password requirements until form validation fails
**Fix:** Add small helper text below the password field: "Minimum 8 characters"
**Impact on activation:** Reduces failed submission attempts

## Quick Wins (< 1 day)
- Move cookie banner to top bar or auto-dismiss on signup page
- Show user Name instead of email in dashboard nav
- Add password requirements hint text on signup form
- Fix "Start free" in pricing to link to `/signup` instead of `/login`
- Add button loading state on signup form submit
