'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { listOrgs } from '@/lib/services/org.service'
import { listCompetitions } from '@/lib/services/competition.service'
import { LeagueItem } from '@/components/home/LeagueItem'
import { Search, Trophy } from 'lucide-react'
import type { Competition } from '@/lib/services/competition.service'

function formatDateRange(startDate: string, endDate: string): string {
  const fmt = (d: string) => {
    const date = new Date(d)
    const day = date.getDate()
    const month = date.toLocaleString('en', { month: 'short' }).toUpperCase()
    return `${day} ${month}`
  }
  return `${fmt(startDate)} - ${fmt(endDate)}`
}

export default function LeaguePage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [search, setSearch] = useState('')

  const { data: orgs, isLoading: orgsLoading } = useQuery({
    queryKey: ['orgs'],
    queryFn: listOrgs,
    enabled: isAuthenticated,
  })

  const firstOrgId = orgs?.[0]?._id
  const { data: competitions, isLoading: compsLoading } = useQuery({
    queryKey: ['competitions', firstOrgId],
    queryFn: () => listCompetitions(firstOrgId!),
    enabled: !!firstOrgId,
  })

  const isLoading = orgsLoading || compsLoading

  const filtered = (competitions ?? []).filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-[#181928] pb-28">
      {/* Search bar */}
      <div className="px-4 pt-12 pb-3">
        <div className="flex items-center gap-3 bg-[#1e1f30] rounded-2xl px-4 h-12">
          <Search size={18} className="text-gaffer-subtle flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leagues..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-gaffer-subtle outline-none font-body"
          />
        </div>
      </div>

      <div className="px-4">
        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display font-bold text-xl text-white">Favourite</h1>
          <button className="text-gaffer-orange font-display font-bold text-sm tracking-wide">
            JOIN LEAGUE
          </button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 bg-gaffer-card/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="divide-y divide-gaffer-border/20">
            {filtered.map((comp: Competition, i: number) => (
              <motion.div
                key={comp._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <LeagueItem
                  id={comp._id}
                  name={comp.name}
                  dateRange={formatDateRange(comp.startDate, comp.endDate)}
                  avatar={comp.bannerUrl}
                  verified={comp.status === 'published' || comp.status === 'live'}
                  onClick={() => router.push(`/app/league/${comp._id}`)}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-gaffer-card border border-gaffer-border flex items-center justify-center mb-6">
              <Trophy size={32} className="text-gaffer-subtle" />
            </div>
            <p className="text-white font-display font-bold text-lg mb-2">No leagues yet</p>
            <p className="text-gaffer-muted text-sm font-body max-w-[220px] mb-8 leading-relaxed">
              Enter a league code to join a competition and see it here in your favourites.
            </p>
            <button className="bg-gaffer-orange text-white font-display font-bold text-sm px-8 py-3.5 rounded-full shadow-orange-glow">
              Enter League Code
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
