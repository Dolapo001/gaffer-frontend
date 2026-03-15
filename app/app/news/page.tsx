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
import { TOP_NEWS, TRENDING_POSTS, type Article } from '@/lib/mockData'

function fetchNews() {
  return new Promise<{ topNews: Article[]; trending: Article[] }>((resolve) =>
    setTimeout(() => resolve({ topNews: TOP_NEWS, trending: TRENDING_POSTS }), 900)
  )
}

export default function NewsPage() {
  const router = useRouter()
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['news-feed'],
    queryFn: fetchNews,
  })

  const topNews = data?.topNews ?? []
  const trending = data?.trending ?? []

  return (
    <AnimatePresence mode="wait">
      {selectedArticle ? (
        <motion.div
          key="article"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-gaffer-bg flex flex-col"
        >
          <ArticleDetail article={selectedArticle} onBack={() => setSelectedArticle(null)} />
        </motion.div>
      ) : (
        <motion.div
          key="news"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-gaffer-bg"
        >
          {/* Safe area */}
          <div className="h-12 pt-safe" />

          {/* Search bar header */}
          <div className="sticky top-0 z-10 bg-gaffer-bg/95 backdrop-blur-md px-4 py-3 border-b border-gaffer-border/50">
            <button
              onClick={() => router.push('/app/news/search')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gaffer-card border border-gaffer-border text-gaffer-subtle hover:border-gaffer-orange/40 transition-colors"
            >
              <Search size={15} />
              <span className="text-sm font-body">Search news, leagues, players...</span>
            </button>
          </div>

          <div className="px-4 py-4 space-y-6 pb-28">

            {/* Top News */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-bold text-white text-base tracking-wide">
                  Top News
                </h2>
                <button className="text-gaffer-orange text-xs font-body font-medium">
                  See all
                </button>
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
              ) : (
                <div className="space-y-3">
                  {topNews[0] && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <NewsCard
                        {...topNews[0]}
                        size="large"
                        onClick={() => setSelectedArticle(topNews[0])}
                      />
                    </motion.div>
                  )}

                  <div className="divide-y divide-gaffer-border">
                    {topNews.slice(1).map((article, i) => (
                      <motion.div
                        key={article.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="pt-3 first:pt-0"
                      >
                        <NewsCard
                          {...article}
                          size="small"
                          onClick={() => setSelectedArticle(article)}
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Trending section */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-bold text-white text-base tracking-wide">
                  Trending
                </h2>
                <button className="text-gaffer-orange text-xs font-body font-medium">
                  See all
                </button>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="bg-gaffer-card border border-gaffer-border rounded-2xl p-4 animate-pulse">
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-9 h-9 rounded-full bg-gaffer-surface" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 bg-gaffer-surface rounded w-1/3" />
                          <div className="h-2.5 bg-gaffer-surface rounded w-1/4" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gaffer-surface rounded w-full" />
                        <div className="h-3 bg-gaffer-surface rounded w-4/5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {trending.map((post, i) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                    >
                      <TrendingPost {...post} />
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
