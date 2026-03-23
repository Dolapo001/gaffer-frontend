'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { listJoinedCompetitions, joinCompetition, joinCompetitionById, searchCompetitions } from '@/lib/services/competition.service'
import { LeagueItem } from '@/components/home/LeagueItem'
import { Trophy, Search, X, Plus } from 'lucide-react'
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

function DiscoveryCompetitionCard({
  competition,
  onJoin,
  isJoining
}: {
  competition: Competition
  onJoin: () => void
  isJoining: boolean
}) {
  const org = typeof competition.orgId === 'object' ? competition.orgId : null
  const orgLogoUrl = org && 'logoUrl' in org ? (org as any).logoUrl : undefined
  const displayLogo = competition.bannerUrl || orgLogoUrl

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="w-full flex items-center gap-4 bg-[#202235]/40 border border-white/5 rounded-xl p-4 text-left"
    >
      <div className="w-14 h-14 rounded-full bg-gaffer-border overflow-hidden flex items-center justify-center flex-shrink-0">
        {displayLogo ? (
          <img src={displayLogo} alt={`${competition.name} Logo`} className="w-full h-full object-cover opacity-60" />
        ) : (
          <Trophy size={24} className="text-gaffer-muted" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-white/80 font-display font-bold text-[15px] truncate uppercase tracking-wide mb-0.5">
          {competition.name}
        </p>
        <p className="text-gaffer-muted text-[10px] font-body font-medium uppercase tracking-[2px]">
          {org && 'name' in org ? (org as any).name : 'Global League'}
        </p>
      </div>
      
      <button 
        onClick={(e) => {
          e.stopPropagation()
          onJoin()
        }}
        disabled={isJoining}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gaffer-orange/10 border border-gaffer-orange/20 flex-shrink-0 hover:bg-gaffer-orange/20 transition-colors"
      >
        <Plus size={18} className="text-gaffer-orange" />
      </button>
    </motion.div>
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

  // Code-based join — used by the "Join League" modal
  const joinMutation = useMutation({
    mutationFn: (code: string) => joinCompetition(code),
    onSuccess: (data: Competition) => {
      setIsJoinModalOpen(false)
      setJoinCode('')
      setJoinError('')
      queryClient.invalidateQueries({ queryKey: ['joined-competitions'] })
      router.push(`/app/league/${data._id}`)
    },
    onError: (error: any) => {
      setJoinError(error?.response?.data?.message || 'Failed to join league. Please check your code.')
    }
  })

  // Id-based join — used when tapping a search result card
  const joinByIdMutation = useMutation({
    mutationFn: (competitionId: string) => joinCompetitionById(competitionId),
    onSuccess: (data: Competition) => {
      queryClient.invalidateQueries({ queryKey: ['joined-competitions'] })
      router.push(`/app/league/${data._id}`)
    },
    onError: (error: any) => {
      // Surface the error inline on the card; keep the modal closed
      console.error('Failed to join competition:', error?.response?.data?.message || error)
    }
  })

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    setJoinError('')
    if (!joinCode.trim()) return
    joinMutation.mutate(joinCode.trim())
  }

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['search-competitions', searchQuery],
    queryFn: () => searchCompetitions(searchQuery),
    enabled: searchQuery.trim().length >= 2,
    staleTime: 30000,
  })

  const filteredCompetitions = competitions?.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDiscoveryJoin = (competitionId: string) => {
    joinByIdMutation.mutate(competitionId)
  }

  // Hide search results that are already joined
  const discoveries = searchResults?.filter(res =>
    !competitions?.some(joined => joined._id === res._id)
  )

  return (
    <div className="min-h-screen bg-[#181928] pb-28">
      {/* Search bar */}
      <div className="px-4 pt-12 pb-3">
        <div className="flex items-center gap-3 bg-[#1e1f30] rounded-2xl px-4 h-12">
          <Search size={18} className="text-gaffer-subtle flex-shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leagues..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-gaffer-subtle outline-none font-body"
          />
        </div>
      </div>

      <div className="px-4">
        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display font-bold text-xl text-white">Favourite</h1>
          <button
            onClick={() => setIsJoinModalOpen(true)}
            className="text-gaffer-orange font-display font-bold text-sm tracking-wide"
          >
            JOIN LEAGUE
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 bg-gaffer-card/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Favourites list */}
            {filteredCompetitions && filteredCompetitions.length > 0 ? (
              <div className="divide-y divide-gaffer-border/20">
                {filteredCompetitions.map((comp, i) => (
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
            ) : !searchQuery && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-gaffer-card border border-gaffer-border flex items-center justify-center mb-6">
                  <Trophy size={32} className="text-gaffer-subtle" />
                </div>
                <p className="text-white font-display font-bold text-lg mb-2">No leagues yet</p>
                <p className="text-gaffer-muted text-sm font-body max-w-[220px] mb-8 leading-relaxed">
                  Enter a league code to join a competition and see it here in your favourites.
                </p>
                <button
                  onClick={() => setIsJoinModalOpen(true)}
                  className="bg-gaffer-orange text-white font-display font-bold text-sm px-8 py-3.5 rounded-full shadow-orange-glow"
                >
                  Enter League Code
                </button>
              </div>
            )}

            {/* Discover section */}
            {searchQuery && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center gap-2 mb-4 px-1">
                  <div className="h-px bg-white/5 flex-1" />
                  <span className="text-[10px] text-gaffer-muted font-black tracking-[4px] uppercase">Discover Leagues</span>
                  <div className="h-px bg-white/5 flex-1" />
                </div>

                {isSearching ? (
                  <div className="space-y-3">
                    {[0, 1].map((i) => (
                      <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : discoveries && discoveries.length > 0 ? (
                  <div className="space-y-3">
                    {discoveries.map((res) => (
                      <DiscoveryCompetitionCard
                        key={res._id}
                        competition={res}
                        isJoining={joinByIdMutation.isPending}
                        onJoin={() => handleDiscoveryJoin(res._id)}
                      />
                    ))}
                  </div>
                ) : searchQuery.length >= 2 && (
                  <div className="text-center py-6">
                    <p className="text-gaffer-muted text-xs font-medium italic">No public matches for "{searchQuery}"</p>
                    <button
                      onClick={() => setIsJoinModalOpen(true)}
                      className="mt-3 text-gaffer-orange text-[10px] font-black underline uppercase tracking-widest"
                    >
                      Try a league code instead
                    </button>
                  </div>
                )}
              </div>
            )}
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
