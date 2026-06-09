Review Google Search Console data **and** run a technical + on-page SEO audit, then create status:proposed GitHub issues with concrete fixes.

This routine has two halves:
1. **GSC data** — what's actually happening in search (positions, CTR, impressions, indexing).
2. **SEO audit** — why it's happening (on-page + technical issues in the codebase / live pages).

## Step 1 — Read project config

Run `bash .darkflow.d/get-config.sh` to pull the latest project settings from the Web UI and refresh the local `.darkflow` cache (silently falls back to cache if the server is unreachable).

Read `.darkflow` in the project root. Extract:
- `language=` → output/issue language (default: English)
- `site_url=` → the public production URL (used for live-page SEO checks)

If `.darkflow` is missing, continue with the defaults. If `site_url=` is absent, try to auto-discover the production URL (Coolify FQDN, `vercel.json`/`.vercel/project.json`, `netlify.toml`, `CNAME`); if none is found, skip the live-page checks and audit the codebase only.

## Step 2 — GSC data analysis

**IMPORTANT: Never use the browser to access Google Search Console. All GSC data must be fetched exclusively via the Google Search Console MCP tools. If the GSC MCP is not connected or its tools are unavailable, skip this step (do NOT abort the whole routine — Step 3 still runs) and note in the snapshot:**

```
GSC data skipped: Google Search Console MCP is not connected.
Connect the GSC MCP in your project's .claude/settings.json to enable it.
```

Do not fall back to browser automation for GSC data.

Check Google Search Console data for the last week using MCP tools. Analyse positions, CTR, impressions, and indexing issues. For each meaningful finding, suggest a concrete fix and file it as an issue (see issue format below) with `source:gsc`.

## Step 3 — Technical + on-page SEO audit

Audit the project's site for SEO problems. Work primarily from the **codebase** (it's the source of truth and lets you propose exact fixes); use `site_url=` to spot-check rendered pages where code alone is ambiguous.

> ⚠️ **Schema markup detection:** `curl`/`web_fetch` strip `<script>` tags, so JSON-LD injected client-side won't show in static HTML. Detect structured data from the **source code** (e.g. `application/ld+json` blocks, Next.js metadata, schema components) or a rendered browser DOM — never report "no schema" based on a raw fetch alone.

Check, in priority order:

**Crawlability & indexation**
- `robots.txt` — no unintentional blocks on important paths; sitemap referenced
- `sitemap.xml` (or framework sitemap route) exists, lists only canonical/indexable URLs
- No stray `noindex` on pages that should rank; canonicals are self-referencing and point the right way
- HTTPS + consistent host (www vs non-www, trailing slash)

**On-page**
- Title tags — unique per page, primary keyword near the front, ~50–60 chars, no duplicates/missing
- Meta descriptions — unique, ~150–160 chars, compelling; none auto-generated/missing
- Heading structure — exactly one `<h1>` per page, logical `h1→h2→h3` hierarchy
- Image `alt` text on meaningful images
- OpenGraph / Twitter card tags present for shareable pages
- Structured data (JSON-LD) for the relevant page types (Organization, Product, Article, BreadcrumbList, etc.)
- Internal linking — no orphan pages, descriptive anchor text

**Technical foundations**
- Readable URL structure (lowercase, hyphenated, no needless params)
- Mobile viewport configured; no obvious mobile-breaking layout
- Obvious performance regressions affecting Core Web Vitals (giant unoptimized images, render-blocking assets) — flag, don't deep-profile

For each real issue found, file an issue (format below) with `source:seo`. Prefer a small number of high-impact, specific issues over an exhaustive nitpick list — group trivial same-type findings (e.g. "Add meta descriptions to 6 blog pages") into one issue.

## Issue format (required, both sources)

Add all recommendations as GitHub Issues to the project's remote GitHub repo. Labels: `status:proposed`, `source:gsc` **or** `source:seo`, plus `area:*`, `priority:*`, `effort:*` as appropriate.

- **Title**: action-oriented verb — "Improve title tag on /pricing", "Add JSON-LD Product schema to product pages", "Fix missing meta descriptions on /blog/*" — never just a statement of the finding ("Low CTR on /pricing", "No structured data")
- **Body**:
  ```
  ## Problem
  <metric/finding, current value, affected URL or page group, and how it was detected (GSC vs code audit)>

  ## What to do
  <concrete SEO action — specific tag, file, component, or config to change>

  ## Acceptance criteria
  - [ ] <verifiable outcome, e.g. "Every /blog/* page has a unique <meta name='description'> 150–160 chars">
  - [ ] <additional criterion if needed>
  ```

Before posting recommendations, write the snapshots:
- GSC snapshot → `docs/insights/search-console/YYYY-MM-DD.md`
- SEO audit snapshot → `docs/insights/seo-audit/YYYY-MM-DD.md`

Language for all GitHub issues and output: the `language=` value from `.darkflow`.

## Step 4 — After completing

Run `gh issue list --state open --json number,labels --limit 200`, then:
- Count open issues with label `source:gsc` **or** `source:seo` → `openIssues`
- Derive `status`: `"warning"` if openIssues > 5, `"ok"` otherwise

Write `.darkflow.d/state/metrics/gsc.json` (create parent directories if needed):

```json
{
  "openIssues": <integer>,
  "status":     "ok" | "warning"
}
```

The worker will pick up this file on its next sync. You do not need to update any HTML files.
