import { MetadataRoute } from 'next'
import { isCloud } from '@/lib/cloud'

export default function robots(): MetadataRoute.Robots {
  // Self-hosted instances serve the same marketing pages but must never be
  // indexed — otherwise every deployment competes with the cloud site for the
  // same content.
  if (!isCloud()) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/billing/', '/projects/', '/settings/'],
    },
    sitemap: 'https://scopegate.dev/sitemap.xml',
  }
}
