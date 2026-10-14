import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// The public pages can be found; the signed-in areas are not for search engines.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: ['/', '/privacy', '/terms', '/contact'], disallow: ['/app/', '/admin/', '/hq/', '/auth/', '/onboarding/'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
