import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { path: '', priority: 1 },
    { path: '/privacy', priority: 0.3 },
    { path: '/terms', priority: 0.3 },
    { path: '/contact', priority: 0.4 },
  ]
  return pages.map((p) => ({ url: `${SITE_URL}${p.path}`, changeFrequency: 'monthly' as const, priority: p.priority }))
}
