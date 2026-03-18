'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ArrowLeft, TrendingUp } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { NewsCard } from '@/components/home/NewsCard'
import { ArticleDetail } from '@/components/home/ArticleDetail'
import { getGlobalFeed, type FeedItem } from '@/lib/services/feed.service'

const HOT_TOPICS = ['Football', 'Transfer News', 'League', 'Champions League', 'Results', 'Fantasy']

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function toNewsCardProps(item: FeedItem) {
  return {
    id: item._id,
    image: item.media?.find((m) => m.type === 'image')?.url ?? '/images/news-hero.jpg',
    source: { name: 'GAFFER', verified: true },
    title: item.body.split('\n')[0].slice(0, 120),
    excerpt: item.body.length > 120 ? item.body.slice(0, 160) + '...' : undefined,
    likes: item.likesCount,
    timeAgo: timeAgo(item.createdAt),
  }
}

function toArticleProps(item: FeedItem) {
  return {
    id: item._id,
    title: item.body.split('\n')[0].slice(0, 100),
    content: item.body,
    image: item.media?.find((m) => m.type === 'image')?.url ?? '/images/news-hero.jpg',
    date: new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    likes: item.likesCount,
    author: {
      name: item.authorType === 'org' ? 'Organization' : 'Gaffer',
      handle: `${item.authorType}_${item.authorId.slice(-6)}`,
      verified: item.authorType === 'org',
    },
  }
}

export default function NewsSearchPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const { data } = useQuery({
    queryKey: ['global-feed-search'],
    queryFn: () => getGlobalFeed(1),
    staleTime: 60_000,
  })

  const allItems: FeedItem[] = (data?.items ?? data?.data ?? []) as FeedItem[]

  const results = query.trim().length >= 2
    ? allItems.filter((item) => item.body.toLowerCase().includes(query.toLowerCase()))
    : []

  if (selectedItem) {
    return (
      <div className="min-h-screen bg-gaffer-bg flex flex-col">
        <ArticleDetail article={toArticleProps(selectedItem)} onBack={() => setSelectedItem(null)} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gaffer-bg flex flex-col">
      {/* Search header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 border-b border-gaffer-border/50">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full text-gaffer-muted hover:text-white transition-colors flex-shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gaffer-subtle pointer-events-none" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search news, leagues, players..."
            className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-gaffer-card border border-gaffer-border text-white placeholder:text-gaffer-subtle font-body text-sm focus:outline-none focus:border-gaffer-orange transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gaffer-subtle hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        <AnimatePresence mode="wait">
          {query.trim().length < 2 && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={16} className="text-gaffer-orange" />
                  <h2 className="font-display font-bold text-white text-base">Hot Topics</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {HOT_TOPICS.map((topic) => (
                    <motion.button
                      key={topic}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setQuery(topic)}
                      className="px-4 py-2 rounded-xl bg-gaffer-card border border-gaffer-border text-sm font-body text-white hover:border-gaffer-orange/40 hover:bg-gaffer-orange/5 transition-all"
                    >
                      {topic}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="font-display font-bold text-white text-base mb-3">Recent</h2>
                <div className="space-y-3 divide-y divide-gaffer-border">
                  {allItems.slice(0, 10).map((item, i) => (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="pt-3 first:pt-0"
                    >
                      <NewsCard {...toNewsCardProps(item)} size="small" onClick={() => setSelectedItem(item)} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {query.trim().length >= 2 && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-gaffer-muted text-xs font-body mb-4">
                {results.length} result{results.length !== 1 ? 's' : ''} for &quot;{query}&quot;
              </p>

              {results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Search size={40} className="text-gaffer-subtle" />
                  <p className="text-white font-body font-medium">No results found</p>
                  <p className="text-gaffer-muted text-sm font-body text-center">
                    Try different keywords or browse the news feed
                  </p>
                </div>
              ) : (
                <div className="space-y-4 divide-y divide-gaffer-border">
                  {results.map((item, i) => (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="pt-4 first:pt-0"
                    >
                      <NewsCard {...toNewsCardProps(item)} size="small" onClick={() => setSelectedItem(item)} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
