'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Search, SlidersHorizontal } from 'lucide-react'
import { LeagueItem } from '@/components/home/LeagueItem'
import { SkeletonCard } from '@/components/home/SkeletonCard'
import { FAVOURITE_LEAGUES } from '@/lib/mockData'

function fetchLeagues() {
  return new Promise<typeof FAVOURITE_LEAGUES>((resolve) =>
    setTimeout(() => resolve(FAVOURITE_LEAGUES), 700)
  )
}

const DISCOVER_LEAGUES = ['Premier League', 'La Liga', 'Bundesliga', 'Serie A']

export default function LeaguePage() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const { data: leagues, isLoading } = useQuery({
    queryKey: ['leagues'],
    queryFn: fetchLeagues,
  })

  const filtered = (leagues ?? []).filter((l) =>
    l.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
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

      {/* Content */}
      <div className="px-4 pb-28">
        <h2 className="font-display font-bold text-white text-base tracking-wide mt-4 mb-1">
          Favourite
        </h2>

        {isLoading ? (
          <div className="divide-y divide-gaffer-border">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i}>
                <SkeletonCard size="league" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
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
                  onClick={() => router.push(`/app/league/${league.id}`)}
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
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-gaffer-card border border-gaffer-border rounded-2xl p-4 h-24 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {DISCOVER_LEAGUES.map((name, i) => (
                  <motion.button
                    key={name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.06 }}
                    onClick={() => router.push(`/app/league/discover/${encodeURIComponent(name)}`)}
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
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
