'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, SlidersHorizontal } from 'lucide-react'
import { LeagueItem } from '@/components/home/LeagueItem'
import { ArticleDetail } from '@/components/home/ArticleDetail'
import { FAVOURITE_LEAGUES, TOP_NEWS, type Article } from '@/lib/mockData'

export default function LeaguePage() {
  const [query, setQuery] = useState('')
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)

  const filtered = FAVOURITE_LEAGUES.filter((l) =>
    l.name.toLowerCase().includes(query.toLowerCase())
  )

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
          key="leagues"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-gaffer-bg"
        >
          {/* Safe area spacer */}
          <div className="h-12 pt-safe" />

          {/* Search bar */}
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gaffer-subtle"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search leagues..."
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-gaffer-card border border-gaffer-border text-white placeholder:text-gaffer-subtle font-body text-sm focus:outline-none focus:border-gaffer-orange transition-colors"
                />
              </div>
              <button className="w-11 h-11 flex items-center justify-center rounded-xl bg-gaffer-card border border-gaffer-border text-gaffer-muted hover:text-white transition-colors flex-shrink-0">
                <SlidersHorizontal size={17} />
              </button>
            </div>
          </div>

          {/* Favourites */}
          <div className="px-4 pb-28">
            <h2 className="font-display font-bold text-white text-base tracking-wide mt-4 mb-1">
              Favourite
            </h2>

            {filtered.length === 0 ? (
              <p className="text-gaffer-muted text-sm font-body text-center py-10">
                No leagues found
              </p>
            ) : (
              <div className="divide-y divide-gaffer-border">
                {filtered.map((league, i) => (
                  <motion.div
                    key={league.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                  >
                    <LeagueItem
                      {...league}
                      onClick={() => setSelectedArticle(TOP_NEWS[i % TOP_NEWS.length])}
                    />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Discover more leagues */}
            {query === '' && (
              <div className="mt-8">
                <h2 className="font-display font-bold text-white text-base tracking-wide mb-3">
                  Discover Leagues
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {['Premier League', 'La Liga', 'Bundesliga', 'Serie A'].map((name, i) => (
                    <motion.button
                      key={name}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.06 }}
                      className="bg-gaffer-card border border-gaffer-border rounded-2xl p-4 text-left hover:border-gaffer-orange/40 transition-all"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gaffer-orange/10 flex items-center justify-center mb-2">
                        <span className="text-gaffer-orange font-display font-black text-sm">
                          {name[0]}
                        </span>
                      </div>
                      <p className="text-white font-body font-semibold text-xs leading-tight">{name}</p>
                      <p className="text-gaffer-muted text-[10px] font-body mt-0.5">Global</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
