import { getImageUrl } from '@/lib/api'
import type { FeedItem } from '@/lib/services/feed.service'

/** The stock picture, used only for Gaffer's own posts that come with no picture of their own. */
export const DEFAULT_NEWS_IMAGE = '/images/news-hero.webp'

export interface NewsImageChoice {
  /** The picture to show */
  src: string
  /** True when `src` is the publisher's logo rather than a picture of the story: it is shown whole, not stretched */
  isLogo: boolean
}

/** The name an organisation or team publishes under, when the feed item carries it. */
function publisher(item: FeedItem): { logoUrl: string | null } {
  const org = item.orgId && typeof item.orgId === 'object' ? (item.orgId as unknown as { logoUrl?: string | null }) : null
  const author = item.authorId
  // An org or team post: the author is that org or team. A post written by a person has no logo to speak of.
  const authorLogo = item.authorType === 'org' || item.authorType === 'team' ? author?.logoUrl : null
  return { logoUrl: authorLogo || org?.logoUrl || null }
}

/**
 * The picture for a news item: its own picture if it has one, otherwise the account picture of the organisation (or
 * team) that published it. Only Gaffer's own posts, or posts from an account with no picture either, fall back to the
 * stock image.
 */
export function pickNewsImage(item: FeedItem): NewsImageChoice {
  const own = item.imageUrl || item.media?.find((m) => m.type === 'image')?.url
  if (own) return { src: getImageUrl(own), isLogo: false }
  const logo = publisher(item).logoUrl
  if (logo) return { src: getImageUrl(logo), isLogo: true }
  return { src: DEFAULT_NEWS_IMAGE, isLogo: false }
}
