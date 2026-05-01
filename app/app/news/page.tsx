'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { NewsCard } from '@/components/home/NewsCard'
import { TrendingPost } from '@/components/home/TrendingPost'
import { ArticleDetail } from '@/components/home/ArticleDetail'
import { SkeletonCard } from '@/components/home/SkeletonCard'
import { getNewsFeed, getGlobalFeed, getOrgFeed, type FeedItem, type FeedPage } from '@/lib/services/feed.service'
import { listJoinedCompetitions } from '@/lib/services/competition.service'
import { getImageUrl } from '@/lib/api'
import { useUIStore } from '@/store/uiStore'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function toNewsCardProps(item: FeedItem) {
  const isSystem = item.authorType === 'system'
  const rawImage = item.imageUrl ?? item.media?.find((m) => m.type === 'image')?.url
  const body = item.body ?? ''
  const title = item.title ?? body.split('\n')[0].slice(0, 120)
  return {
    id: item._id,
    image: rawImage ? getImageUrl(rawImage) : '/images/news-hero.jpg',
    source: {
      name: isSystem ? (item.authorName ?? 'GAFFER') : (item.authorId?.name ?? item.authorId?.fullName ?? 'GAFFER'),
      verified: true,
    },
    title,
    excerpt: body.length > 120 ? body.slice(120, 280) + '...' : undefined,
    likes: item.likesCount,
    initialLiked: item.isLiked ?? false,
    timeAgo: timeAgo(item.createdAt),
    isSystemPost: isSystem,
  }
}

function toTrendingProps(item: FeedItem) {
  const authorLabel =
    item.authorType === 'org' ? (item.authorId?.name ?? 'Organization')
    : item.authorType === 'team' ? (item.authorId?.name ?? 'Team')
    : (item.authorId?.fullName ?? 'User')
  return {
    id: item._id,
    author: {
      name: authorLabel,
      handle: item.authorId?._id?.slice(-8) ?? '',
      verified: item.authorType === 'org',
    },
    content: item.body ?? '',
    image: item.imageUrl ?? item.media?.find((m) => m.type === 'image')?.url,
    likes: item.likesCount,
    initialLiked: item.isLiked ?? false,
  }
}

function toArticleProps(item: FeedItem) {
  const isSystem = item.authorType === 'system'
  const rawImage = item.imageUrl ?? item.media?.find((m) => m.type === 'image')?.url
  const body = item.body ?? ''
  const authorDisplayName = isSystem
    ? (item.authorName ?? 'GAFFER')
    : (item.authorId?.name ?? item.authorId?.fullName ?? 'GAFFER')
  return {
    id: item._id,
    title: item.title ?? body.split('\n')[0].slice(0, 100),
    content: body,
    image: rawImage ? getImageUrl(rawImage) : '/images/news-hero.jpg',
    date: new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    likes: item.likesCount,
    commentsCount: item.commentCount ?? item.commentsCount,
    isLiked: item.isLiked ?? false,
    isSystem,
    allowComments: item.allowComments ?? true,
    author: {
      name: authorDisplayName,
      handle: isSystem ? 'gaffer' : (item.authorId?.handle ?? item.authorId?._id?.slice(-6) ?? ''),
      verified: isSystem || item.authorType === 'org',
    },
  }
}

export default function NewsPage() {
  const router = useRouter()
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null)
  const { activeOrgId } = useUIStore()

  // ── Active-competition news (when inside a league) ─────────────────────────
  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: activeOrgId ? ['org-feed-news', activeOrgId] : ['news-feed', 1],
    queryFn: () => activeOrgId ? getOrgFeed(activeOrgId) : getNewsFeed(1),
    staleTime: 60_000,
  })

  // ── Joined competitions → fetch each org's feed ────────────────────────────
  // Only when the user is NOT inside a specific competition.
  const { data: joinedComps } = useQuery({
    queryKey: ['joined-competitions'],
    queryFn: listJoinedCompetitions,
    staleTime: 5 * 60_000,
    enabled: !activeOrgId,
  })

  // orgId may be a populated object from the backend (e.g. { _id, name, logoUrl })
  // or a plain string — handle both to avoid passing "[object Object]" to getOrgFeed.
  const joinedOrgIds = (joinedComps ?? [])
    .map((c) => (typeof c.orgId === 'object' && c.orgId !== null ? (c.orgId as any)._id : c.orgId) as string | null)
    .filter((id): id is string => Boolean(id))

  const { data: joinedOrgNewsData, isLoading: joinedNewsLoading } = useQuery({
    queryKey: ['joined-orgs-news', ...joinedOrgIds],
    queryFn: async (): Promise<FeedPage> => {
      const feeds = await Promise.allSettled(joinedOrgIds.map((id) => getOrgFeed(id)))
      const allItems = feeds
        .filter((r): r is PromiseFulfilledResult<FeedPage> => r.status === 'fulfilled')
        .flatMap((r) => (r.value?.items ?? r.value?.data ?? []) as FeedItem[])
      return { items: allItems, total: allItems.length, page: 1 }
    },
    enabled: joinedOrgIds.length > 0 && !activeOrgId,
    staleTime: 60_000,
    meta: { suppressGlobalError: true },
  })

  // ── Trending posts — global feed ───────────────────────────────────────────
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['global-feed', 1],
    queryFn: () => getGlobalFeed(1),
    staleTime: 60_000,
    enabled: !activeOrgId,
  })

  // ── Merge news: joined orgs first (most relevant), then global fallback ────
  const globalItems: FeedItem[] = (newsData?.items ?? newsData?.data ?? []) as FeedItem[]
  const orgItems: FeedItem[] = (joinedOrgNewsData?.items ?? []) as FeedItem[]

  // Deduplicate by _id; joined-org items take priority (listed first)
  const mergedItems = [...orgItems, ...globalItems].filter(
    (item, index, arr) => arr.findIndex((x) => x._id === item._id) === index
  )

  // Prefer explicit news/system/org items; fall back to everything so the page
  // is never empty when items exist but have a different type.
  const strictItems = mergedItems.filter(
    (i) => i.type === 'news' || i.authorType === 'system' || i.authorType === 'org'
  )
  const rawNewsItems: FeedItem[] = strictItems.length > 0 ? strictItems : mergedItems
  // System posts (authorType==='system') act as pinned/welcome items — surface them first
  const allNewsItems: FeedItem[] = [...rawNewsItems].sort((a, b) => {
    const aSystem = a.authorType === 'system' ? 1 : 0
    const bSystem = b.authorType === 'system' ? 1 : 0
    if (bSystem !== aSystem) return bSystem - aSystem
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const allFeedItems: FeedItem[] = (postsData?.items ?? postsData?.data ?? []) as FeedItem[]
  const postItems: FeedItem[] = allFeedItems.filter((i) => i.type === 'post' || i.type === 'repost')

  const isLoading = newsLoading || (joinedOrgIds.length > 0 && joinedNewsLoading)

  return (
    <AnimatePresence mode="wait">
      {selectedItem ? (
        <motion.div
          key="article"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-gaffer-bg flex flex-col"
        >
          <ArticleDetail article={toArticleProps(selectedItem)} onBack={() => setSelectedItem(null)} />
        </motion.div>
      ) : (
        <motion.div
          key="news"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-gaffer-bg"
        >
          <div className="h-12 pt-safe" />

          {/* Search bar */}
          <div className="sticky top-0 z-10 bg-gaffer-bg/95 backdrop-blur-md px-4 py-3 border-b border-gaffer-border/50">
            <button
              onClick={() => router.push('/app/news/search')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gaffer-card border border-gaffer-border text-gaffer-subtle hover:border-gaffer-orange/40 transition-colors"
            >
              <Search size={15} />
              <span className="text-sm font-body">Search news, leagues, players...</span>
            </button>
            {activeOrgId && (
              <p className="text-[10px] font-black uppercase tracking-[3px] text-gaffer-orange text-center mt-2">
                Competition News
              </p>
            )}
          </div>

          <div className="px-4 py-4 space-y-6 pb-24">
            {/* Top News */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-bold text-white text-base tracking-wide">Top News</h2>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  <SkeletonCard size="large" />
                  <div className="divide-y divide-gaffer-border">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="pt-3 first:pt-0">
                        <SkeletonCard size="small" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : allNewsItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gaffer-muted text-sm font-body">No news yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allNewsItems.slice(0, 1).map((item) => (
                    <motion.div key={item._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                      <NewsCard
                        {...toNewsCardProps(item)}
                        size="large"
                        onClick={() => setSelectedItem(item)}
                      />
                    </motion.div>
                  ))}
                  <div className="divide-y divide-gaffer-border">
                    {allNewsItems.slice(1, 5).map((item, i) => (
                      <motion.div
                        key={item._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="pt-3 first:pt-0"
                      >
                        <NewsCard
                          {...toNewsCardProps(item)}
                          size="small"
                          onClick={() => setSelectedItem(item)}
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Trending posts */}
            {(postsLoading || postItems.length > 0) && (
              <section>
                <h2 className="font-display font-bold text-white text-base tracking-wide mb-3">Trending</h2>
                {postsLoading ? (
                  <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="bg-gaffer-card border border-gaffer-border rounded-2xl p-4 animate-pulse h-24" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {postItems.slice(0, 5).map((item, i) => (
                      <motion.div
                        key={item._id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                      >
                        <TrendingPost {...toTrendingProps(item)} onClick={() => setSelectedItem(item)} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
