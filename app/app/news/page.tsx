'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search } from 'lucide-react'
import { NewsCard } from '@/components/home/NewsCard'
import { TrendingPost } from '@/components/home/TrendingPost'
import { ArticleDetail } from '@/components/home/ArticleDetail'
import { TOP_NEWS, TRENDING_POSTS, type Article } from '@/lib/mockData'

export default function NewsPage() {
  const router = useRouter()
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)

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
          <ArticleDetail
            article={selectedArticle}
            onBack={() => setSelectedArticle(null)}
          />
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

              <div className="space-y-3">
                {/* Large featured card */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <NewsCard
                    {...TOP_NEWS[1]}
                    size="large"
                    onClick={() => setSelectedArticle(TOP_NEWS[1])}
                  />
                </motion.div>

                {/* Smaller cards below */}
                <div className="divide-y divide-gaffer-border">
                  {TOP_NEWS.slice(1).map((article, i) => (
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

              <div className="space-y-3">
                {TRENDING_POSTS.map((post, i) => (
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
            </section>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
