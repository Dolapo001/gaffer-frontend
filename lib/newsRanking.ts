import type { FeedItem } from '@/lib/services/feed.service'

/**
 * Orders feed items for "Top News" slots: real news from an organisation first,
 * then pinned, then newest. Auto-generated welcome posts only appear when
 * there is nothing else to show.
 */
export function rankTopNews(items: FeedItem[]): FeedItem[] {
  const real = items.filter((i) => !i.isDefault)
  const pool = real.length > 0 ? real : items
  const weight = (i: FeedItem) => (i.type === 'news' ? 2 : 0) + (i.isPinned ? 1 : 0)
  return [...pool].sort((a, b) => {
    const w = weight(b) - weight(a)
    if (w !== 0) return w
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

export function resolveOrgId(raw: unknown): string | undefined {
  if (!raw) return undefined
  if (typeof raw === 'object' && (raw as any)._id) return (raw as any)._id as string
  if (typeof raw === 'string' && raw.length > 0) return raw
  return undefined
}
