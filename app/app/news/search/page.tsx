'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ArrowLeft, TrendingUp } from 'lucide-react'
import { NewsCard } from '@/components/home/NewsCard'
import { TOP_NEWS, type Article } from '@/lib/mockData'
import { ArticleDetail } from '@/components/home/ArticleDetail'

const HOT_TOPICS = ['Barcelona', 'Transfer News', 'Premier League', 'Champions League', 'Samuel Marae', 'Bowen League']

export default function NewsSearchPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const results = query.trim().length > 1
    ? TOP_NEWS.filter(
        (a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.source.name.toLowerCase().includes(query.toLowerCase()) ||
          a.excerpt.toLowerCase().includes(query.toLowerCase())
      )
    : []

  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-gaffer-bg flex flex-col">
        <ArticleDetail article={selectedArticle} onBack={() => setSelectedArticle(null)} />
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
          {/* No query — show hot topics */}
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
                  {TOP_NEWS.map((article, i) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="pt-3 first:pt-0"
                    >
                      <NewsCard {...article} size="small" onClick={() => setSelectedArticle(article)} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Has query — show results */}
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
                  {results.map((article, i) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="pt-4 first:pt-0"
                    >
                      <NewsCard {...article} size="small" onClick={() => setSelectedArticle(article)} />
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
