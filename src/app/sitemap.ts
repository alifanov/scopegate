import { MetadataRoute } from 'next'
import { comparisons } from '@/data/comparisons'
import { integrations } from '@/data/integrations-seo'
import { glossaryEntries } from '@/data/glossary'
import { blogPosts } from '@/data/blog'

const baseUrl = 'https://scopegate.dev'

// <lastmod> is the only per-URL field Google reads here — "Google ignores
// <priority> and <changefreq> values", and it "uses the <lastmod> value if it's
// consistently and verifiably accurate":
// https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
//
// Every entry below used to be `new Date()`, i.e. the moment the sitemap was
// rendered. Because the site hadn't been redeployed since July, that made all 37
// URLs claim they last changed at 2026-07-15T07:20:29.155Z — one timestamp, to
// the millisecond, for the whole site. Deploy more often and the same code flips
// to the opposite lie ("everything changed just now"). Neither is ever true, and
// a lastmod Google can disprove costs the site's trust in the field entirely:
// "eventually we're not going to believe you anymore when it comes to the last
// modified date of your pages" (Illyes, Search Central Blog, 2023-06-26).
//
// Dates are the real content dates from git history. Bump one in the same commit
// that changes what a visitor sees; leave it for refactors and styling.
const PAGE_DATES: Record<string, string> = {
  '': '2026-08-24',
  '/features': '2026-03-23',
  '/pricing': '2026-03-23',
  '/docs': '2026-03-23',
  '/compare': '2026-03-23',
  '/integrations': '2026-03-23',
  '/glossary': '2026-03-23',
  '/blog': '2026-03-20',
}

// Programmatic clusters render from one data file each, so the file's own date
// is the content date for every page it produces.
const COMPARISONS_DATE = '2026-08-24' // src/data/comparisons.ts
const INTEGRATIONS_DATE = '2026-03-06' // src/data/integrations-seo.ts
const GLOSSARY_DATE = '2026-08-24' // src/data/glossary.ts

const at = (date: string) => new Date(`${date}T00:00:00Z`)

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = Object.entries(PAGE_DATES).map(
    ([path, date]) => ({ url: `${baseUrl}${path}`, lastModified: at(date) })
  )

  const comparisonPages: MetadataRoute.Sitemap = comparisons.map((c) => ({
    url: `${baseUrl}/compare/${c.slug}`,
    lastModified: at(COMPARISONS_DATE),
  }))

  const integrationPages: MetadataRoute.Sitemap = integrations.map((i) => ({
    url: `${baseUrl}/integrations/${i.slug}`,
    lastModified: at(INTEGRATIONS_DATE),
  }))

  const glossaryPages: MetadataRoute.Sitemap = glossaryEntries.map((g) => ({
    url: `${baseUrl}/glossary/${g.slug}`,
    lastModified: at(GLOSSARY_DATE),
  }))

  const blogPages: MetadataRoute.Sitemap = blogPosts.map((p) => ({
    url: `${baseUrl}/blog/${p.slug}`,
    lastModified: new Date(p.publishedAt),
  }))

  return [
    ...staticPages,
    ...comparisonPages,
    ...integrationPages,
    ...glossaryPages,
    ...blogPages,
  ]
}
