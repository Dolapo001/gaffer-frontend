'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { listJoinedCompetitions, joinCompetition } from '@/lib/services/competition.service'
import { GafferLogo } from '@/components/GafferLogo'
import { Trophy, ChevronRight, Search, CheckCircle2, X } from 'lucide-react'
import type { Competition } from '@/lib/services/competition.service'

function formatDateRange(start: string, end: string) {
  if (!start || !end) return ''
  const startDate = new Date(start)
  const endDate = new Date(end)
  const formatOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' }
  const formattedStart = startDate.toLocaleDateString('en-GB', formatOptions).toUpperCase()
  const formattedEnd = endDate.toLocaleDateString('en-GB', formatOptions).toUpperCase()
  return `${formattedStart} - ${formattedEnd}`
}

function JoinedCompetitionCard({
  competition,
  onClick,
}: {
  competition: Competition
  onClick: () => void
}) {
  const org = typeof competition.orgId === 'object' ? competition.orgId : null
  const orgLogoUrl = org && 'logoUrl' in org ? (org as any).logoUrl : undefined
  const displayLogo = competition.bannerUrl || orgLogoUrl

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-4 bg-gaffer-card border border-gaffer-border rounded-xl p-4 text-left"
    >
      <div className="w-14 h-14 rounded-full bg-gaffer-border overflow-hidden flex items-center justify-center flex-shrink-0">
        {displayLogo ? (
          <img src={displayLogo} alt={`${competition.name} Logo`} className="w-full h-full object-cover" />
        ) : (
          <Trophy size={24} className="text-gaffer-muted" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <p className="text-white font-display font-bold text-[15px] truncate uppercase tracking-wide">
            {competition.name}
          </p>
          <CheckCircle2 size={14} className="text-gaffer-orange flex-shrink-0" fill="currentColor" />
        </div>
        <p className="text-gaffer-muted text-xs font-body font-medium uppercase tracking-wider">
          {formatDateRange(competition.startDate, competition.endDate)}
        </p>
      </div>
      
      <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white/20 flex-shrink-0">
        <ChevronRight size={14} className="text-white" />
      </div>
    </motion.button>
  )
}

export default function LeaguePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()
  
  const initialCode = searchParams.get('code') || ''
  const [searchQuery, setSearchQuery] = useState('')
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(!!initialCode)
  const [joinCode, setJoinCode] = useState(initialCode)
  const [joinError, setJoinError] = useState('')

  const { data: competitions, isLoading } = useQuery({
    queryKey: ['joined-competitions'],
    queryFn: listJoinedCompetitions,
    enabled: isAuthenticated,
  })

  const joinMutation = useMutation({
    mutationFn: (code: string) => joinCompetition(code),
    onSuccess: (data: Competition) => {
      setIsJoinModalOpen(false)
      setJoinCode('')
      setJoinError('')
      queryClient.invalidateQueries({ queryKey: ['joined-competitions'] })
      // Navigate to the newly joined league dashboard
      router.push(`/app/league/${data._id}`)
    },
    onError: (error: any) => {
      setJoinError(error?.response?.data?.message || 'Failed to join league. Please check your code.')
    }
  })

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    setJoinError('')
    if (!joinCode.trim()) return
    joinMutation.mutate(joinCode.trim())
  }

  const filteredCompetitions = competitions?.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#181928] pb-28">
      {/* Top spacing */}
      <div className="pt-14 px-4 pb-6">
        <div className="relative mb-6">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gaffer-muted" />
          <input
            type="text"
            placeholder=""
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#202235] text-white rounded-full py-3 pl-12 pr-4 outline-none border border-gaffer-border placeholder:text-gaffer-muted focus:border-gaffer-orange/50 transition-colors"
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display font-bold text-[22px] text-white">Favourite</h1>
          <button 
            onClick={() => setIsJoinModalOpen(true)}
            className="text-gaffer-orange text-sm font-bold font-body"
          >
            JOIN LEAGUE
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[88px] bg-gaffer-card border border-gaffer-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredCompetitions && filteredCompetitions.length > 0 ? (
          <div className="space-y-3">
            {filteredCompetitions.map((comp, i) => (
              <motion.div key={comp._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <JoinedCompetitionCard competition={comp} onClick={() => router.push(`/app/league/${comp._id}`)} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-gaffer-card border border-gaffer-border rounded-xl p-10 text-center mt-8">
            <Trophy size={40} className="text-gaffer-subtle mx-auto mb-4" />
            <p className="text-white font-body font-medium mb-2 text-lg">No leagues yet</p>
            <p className="text-gaffer-muted text-sm font-body mb-6">
              Enter a league code to join a competition and see it here in your favourites.
            </p>
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="bg-gaffer-orange text-white px-6 py-2.5 rounded-full font-bold font-display text-sm hover:bg-[#e65c00] transition-colors"
            >
              Enter League Code
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isJoinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsJoinModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-gaffer-card border border-gaffer-border rounded-2xl p-6 overflow-hidden"
            >
              <button 
                onClick={() => setIsJoinModalOpen(false)}
                className="absolute top-4 right-4 text-gaffer-muted hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-xl font-display font-bold text-white mb-2">Join a League</h2>
              <p className="text-sm font-body text-gaffer-muted mb-6">
                Enter the code provided by the organization to join their competition.
              </p>
              
              <form onSubmit={handleJoin}>
                <div className="mb-6">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => {
                      setJoinCode(e.target.value.toUpperCase())
                      setJoinError('')
                    }}
                    placeholder="E.g. GAF-ABC123"
                    className={`w-full bg-[#181928] border ${joinError ? 'border-red-500' : 'border-gaffer-border'} rounded-xl p-4 text-white font-display font-medium focus:border-gaffer-orange/50 outline-none text-center tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal`}
                    autoFocus
                  />
                  {joinError && (
                    <p className="text-red-500 text-xs font-body text-center mt-2">{joinError}</p>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={joinMutation.isPending || !joinCode.trim()}
                  className="w-full py-3.5 bg-gaffer-orange text-white rounded-xl font-display font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#e65c00] transition-colors"
                >
                  {joinMutation.isPending ? 'Joining...' : 'Join League'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
