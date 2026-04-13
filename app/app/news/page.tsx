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
import { getNewsFeed, getGlobalFeed, getOrgFeed, type FeedItem } from '@/lib/services/feed.service'
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
  const rawImage = item.media?.find((m) => m.type === 'image')?.url
  return {
    id: item._id,
    // getImageUrl resolves backend-relative paths (e.g. "images/gaffer-welcome-banner.jpg")
    // to absolute URLs; leaves already-absolute URLs untouched.
    image: rawImage ? getImageUrl(rawImage) : '/images/news-hero.jpg',
    source: {
      name: isSystem ? (item.authorName ?? 'GAFFER') : 'GAFFER',
      verified: true,
    },
    title: item.body.split('\n')[0].slice(0, 120),
    excerpt: item.body.length > 120 ? item.body.slice(120, 280) + '...' : undefined,
    likes: item.likesCount,
    initialLiked: item.isLiked ?? false,
    timeAgo: timeAgo(item.createdAt),
    isSystemPost: isSystem,
  }
}

function toTrendingProps(item: FeedItem) {
  const authorLabel = item.authorType === 'org' ? 'Organization' : item.authorType === 'team' ? 'Team' : 'User'
  return {
    id: item._id,
    author: {
      name: authorLabel,
      handle: item.authorId.slice(-8),
      verified: item.authorType === 'org',
    },
    content: item.body,
    image: item.media?.find((m) => m.type === 'image')?.url,
    likes: item.likesCount,
    initialLiked: item.isLiked ?? false,
  }
}

function toArticleProps(item: FeedItem) {
  const isSystem = item.authorType === 'system'
  const rawImage = item.media?.find((m) => m.type === 'image')?.url
  return {
    id: item._id,
    title: item.body.split('\n')[0].slice(0, 100),
    content: item.body,
    image: rawImage ? getImageUrl(rawImage) : '/images/news-hero.jpg',
    date: new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    likes: item.likesCount,
    commentsCount: item.commentsCount,
    isLiked: item.isLiked ?? false,
    isSystem,
    author: {
      name: isSystem
        ? (item.authorName ?? 'GAFFER')
        : item.authorType === 'org' ? 'Organization' : 'Gaffer',
      handle: isSystem ? 'gaffer' : `${item.authorType}_${item.authorId?.slice(-6) ?? ''}`,
      verified: isSystem || item.authorType === 'org',
    },
  }
}

export default function NewsPage() {
  const router = useRouter()
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null)
  const { activeOrgId } = useUIStore()

  // News items (type=news) — dedicated endpoint
  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: activeOrgId ? ['org-feed-news', activeOrgId] : ['news-feed', 1],
    queryFn: () => activeOrgId ? getOrgFeed(activeOrgId) : getNewsFeed(1),
    staleTime: 60_000,
  })

  // Community posts (type=post/repost) — global feed
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['global-feed', 1],
    queryFn: () => getGlobalFeed(1),
    staleTime: 60_000,
    enabled: !activeOrgId,
  })

  // Show all feed items — news, org posts, and system posts.
  // Prefer explicit news/system items first; fall back to all items so the
  // page is never empty when the backend only returns 'post' type items.
  const rawItems: FeedItem[] = (newsData?.items ?? newsData?.data ?? []) as FeedItem[]
  const strictItems = rawItems.filter((i) => i.type === 'news' || i.authorType === 'system')
  const allNewsItems: FeedItem[] = strictItems.length > 0 ? strictItems : rawItems

  const allFeedItems: FeedItem[] = (postsData?.items ?? postsData?.data ?? []) as FeedItem[]
  const postItems: FeedItem[] = allFeedItems.filter((i) => i.type === 'post' || i.type === 'repost')

  const isLoading = newsLoading || postsLoading

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

          <div className="px-4 py-4 space-y-6 pb-28">
            {/* Top News */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-bold text-white text-base tracking-wide">Top News</h2>
              </div>

              {newsLoading ? (
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
