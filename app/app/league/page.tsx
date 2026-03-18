'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { listOrgs } from '@/lib/services/org.service'
import { listCompetitions } from '@/lib/services/competition.service'
import { GafferLogo } from '@/components/GafferLogo'
import { Trophy, ChevronRight } from 'lucide-react'
import type { Competition } from '@/lib/services/competition.service'

function CompetitionCard({
  competition,
  onClick,
}: {
  competition: Competition
  onClick: () => void
}) {
  const statusColor =
    competition.status === 'published'
      ? 'text-green-400 bg-green-400/10 border-green-400/30'
      : competition.status === 'draft'
      ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
      : 'text-gaffer-subtle bg-gaffer-border/20 border-gaffer-border'

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 bg-gaffer-card border border-gaffer-border rounded-2xl p-4 text-left"
    >
      <div className="w-12 h-12 rounded-xl bg-gaffer-orange/10 border border-gaffer-orange/20 flex items-center justify-center flex-shrink-0">
        <Trophy size={20} className="text-gaffer-orange" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-display font-bold text-sm truncate">{competition.name}</p>
        <p className="text-gaffer-muted text-xs font-body capitalize mt-0.5">
          {competition.sport} · {competition.gender}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className={`text-[10px] font-display font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${statusColor}`}>
          {competition.status}
        </span>
        <ChevronRight size={14} className="text-gaffer-subtle" />
      </div>
    </motion.button>
  )
}

export default function LeaguePage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

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

  return (
    <div className="min-h-screen bg-gaffer-bg pb-28">
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <GafferLogo size="sm" />
      </div>

      <div className="px-4">
        <h1 className="font-display font-bold text-2xl text-white mb-1">Competitions</h1>
        <p className="text-gaffer-muted text-sm font-body mb-6">Browse active leagues</p>

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 bg-gaffer-card border border-gaffer-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : competitions && competitions.length > 0 ? (
          <div className="space-y-3">
            {competitions.map((comp, i) => (
              <motion.div key={comp._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <CompetitionCard competition={comp} onClick={() => router.push(`/app/league/${comp._id}`)} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-gaffer-card border border-gaffer-border rounded-2xl p-10 text-center">
            <Trophy size={36} className="text-gaffer-subtle mx-auto mb-4" />
            <p className="text-white font-body font-medium mb-1">No competitions yet</p>
            <p className="text-gaffer-muted text-sm font-body">
              {isAuthenticated ? 'Join or create an organization to see competitions.' : 'Log in to continue.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
