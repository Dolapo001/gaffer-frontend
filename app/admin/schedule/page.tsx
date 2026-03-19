'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Menu, ChevronDown, Calendar, Clock, X, ChevronLeft } from 'lucide-react'
import { GradientButton } from '@/components/GradientButton'
import { useToast } from '@/store/toastStore'
import { useUIStore } from '@/store/uiStore'

type Match = {
  id: string
  teamA: string
  teamB: string
  teamALogo: string
  teamBLogo: string
  time: string
  date: string
  round: string
  score?: string
  isLive: boolean
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listFixtures, createFixture, Fixture } from '@/lib/services/fixture.service'
import { listCompetitions } from '@/lib/services/competition.service'
import { listOrgs } from '@/lib/services/org.service'
import { listTeams } from '@/lib/services/team.service' // Added listTeams import
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'

export default function SchedulePage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [showScheduleForm, setShowScheduleForm] = useState(false)

  // Schedule form state
  const [formHomeTeamId, setFormHomeTeamId] = useState('')
  const [formAwayTeamId, setFormAwayTeamId] = useState('')
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [formTime, setFormTime] = useState('14:00')

  // 1. Fetch Org
  const { data: orgs, isLoading: isLoadingOrgs } = useQuery({
    queryKey: ['orgs'],
    queryFn: listOrgs,
    enabled: !!user
  })

  const orgId = orgs?.[0]?._id

  // 2. Fetch Competitions
  const { data: competitions, isLoading: isLoadingComps } = useQuery({
    queryKey: ['competitions', orgId],
    queryFn: () => listCompetitions(orgId!),
    enabled: !!orgId
  })

  const competitionId = competitions?.[0]?._id

  // Mutate: Create Fixture
  const createFixtureMutation = useMutation({
    mutationFn: (payload: any) => createFixture(competitionId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixtures', competitionId] })
      addToast('Game scheduled successfully!', 'success')
      setShowScheduleForm(false)
      setFormHomeTeamId('')
      setFormAwayTeamId('')
    },
    onError: (err: any) => {
      addToast(err?.message || 'Failed to schedule game', 'error')
    }
  })

  // 3. Fetch Fixtures
  const { data: backendFixtures, isLoading: isLoadingFixtures } = useQuery({
    queryKey: ['fixtures', competitionId],
    queryFn: () => listFixtures(competitionId!),
    enabled: !!competitionId
  })

  // 4. Fetch Teams (for dropdowns)
  const { data: teams } = useQuery({
    queryKey: ['teams', orgId],
    queryFn: () => listTeams(orgId!),
    enabled: !!orgId
  })

  // Format mapping
  const matches: Match[] = backendFixtures
    ?.filter(f => f.status === 'scheduled' || f.status === 'live' || f.status === 'halftime')
    .map(f => ({
      id: f._id,
      teamA: typeof f.homeTeamId === 'string' ? 'Team A' : f.homeTeamId.name,
      teamB: typeof f.awayTeamId === 'string' ? 'Team B' : f.awayTeamId.name,
      teamALogo: typeof f.homeTeamId === 'string' ? '/images/mc_logo.png' : (f.homeTeamId.logoUrl || '/images/mc_logo.png'),
      teamBLogo: typeof f.awayTeamId === 'string' ? '/images/barca_logo.png' : (f.awayTeamId.logoUrl || '/images/barca_logo.png'),
      time: new Date(f.kickoffAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date(f.kickoffAt).toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' }),
      round: (f.roundId as any)?.name || 'Round 4',
      isLive: f.status === 'live' || f.status === 'halftime'
    })) || []

  const previousMatches: Match[] = backendFixtures
    ?.filter(f => f.status === 'completed')
    .map(f => ({
      id: f._id,
      teamA: typeof f.homeTeamId === 'string' ? 'Team A' : f.homeTeamId.name,
      teamB: typeof f.awayTeamId === 'string' ? 'Team B' : f.awayTeamId.name,
      teamALogo: typeof f.homeTeamId === 'string' ? '/images/mc_logo.png' : (f.homeTeamId.logoUrl || '/images/mc_logo.png'),
      teamBLogo: typeof f.awayTeamId === 'string' ? '/images/barca_logo.png' : (f.awayTeamId.logoUrl || '/images/barca_logo.png'),
      time: new Date(f.kickoffAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date(f.kickoffAt).toLocaleDateString([], { weekday: 'short' }),
      round: (f.roundId as any)?.name || 'Round 1',
      score: `${f.score.home}:${f.score.away}`,
      isLive: false
    })) || []

  const isEmpty = (matches.length === 0 && previousMatches.length === 0) || !competitionId

  if (isLoadingOrgs || isLoadingComps || isLoadingFixtures) {
    return (
      <div className="min-h-screen bg-[#181928] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/10 border-t-orange-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#181928] pb-32 flex flex-col pt-12 overflow-x-hidden relative">
      {/* Header */}
      {!showScheduleForm && (
        <div className="flex items-center justify-between px-6 mb-8 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => addToast('Menu coming soon', 'info')}
              className="text-white/60"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-chakra font-black text-white uppercase tracking-tighter">Your Schedule</h1>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {showScheduleForm ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 space-y-8"
          >
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowScheduleForm(false)}
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all shadow-lg"
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="font-chakra font-black text-xl uppercase tracking-tight">Schedule Game</h2>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[13px] text-white/50 font-medium ml-1">Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full h-14 bg-[#1E2032] border border-white/5 rounded-2xl px-4 text-white text-sm focus:outline-none font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] text-white/50 font-medium ml-1">Start Time</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full h-14 bg-[#1E2032] border border-white/5 rounded-2xl px-4 text-white text-sm focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] text-white/50 font-medium ml-1 uppercase tracking-wider">Home Team</label>
                <div className="relative">
                  <select
                    value={formHomeTeamId}
                    onChange={(e) => setFormHomeTeamId(e.target.value)}
                    className="w-full h-14 bg-[#1E2032] border border-white/5 rounded-2xl px-6 text-white text-sm focus:outline-none appearance-none font-medium"
                  >
                    <option value="">Select Home Team</option>
                    {teams?.map(t => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] text-white/50 font-medium ml-1 uppercase tracking-wider">Away Team</label>
                <div className="relative">
                  <select
                    value={formAwayTeamId}
                    onChange={(e) => setFormAwayTeamId(e.target.value)}
                    className="w-full h-14 bg-[#1E2032] border border-white/5 rounded-2xl px-6 text-white text-sm focus:outline-none appearance-none font-medium"
                  >
                    <option value="">Select Away Team</option>
                    {teams?.map(t => (
                      <option key={t._id} value={t._id} disabled={t._id === formHomeTeamId}>{t.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                </div>
              </div>

              <div className="pt-4">
                <GradientButton
                  onClick={() => {
                    if (!competitionId) {
                      addToast('No competition found. Create a tournament first.', 'error')
                      return
                    }
                    if (!formHomeTeamId || !formAwayTeamId) {
                      addToast('Please select both teams', 'error')
                      return
                    }
                    if (formHomeTeamId === formAwayTeamId) {
                      addToast('Home and away teams must be different', 'error')
                      return
                    }
                    const kickoffAt = new Date(`${formDate}T${formTime}`).toISOString()
                    createFixtureMutation.mutate({
                      competitionId,
                      homeTeamId: formHomeTeamId,
                      awayTeamId: formAwayTeamId,
                      kickoffAt,
                      stageType: 'groups',
                      venue: 'Main Stadium',
                    })
                  }}
                  loading={createFixtureMutation.isPending}
                  className="h-14 w-full rounded-2xl font-chakra font-black text-base uppercase tracking-wider"
                >
                  Schedule Game
                </GradientButton>
              </div>
            </div>
          </motion.div>
        ) : isEmpty ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center px-10 text-center"
          >
            <h2 className="text-white text-3xl font-chakra font-black mb-4 uppercase leading-tight tracking-tighter">
              What&apos;s up next?
            </h2>
            <p className="text-white/40 text-sm font-medium leading-relaxed max-w-[240px]">
              Manage your schedule for matches, ceremonies, Schedule now and for later
            </p>
          </motion.div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 pb-20 space-y-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* Next Matches Section */}
            {matches.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white text-base font-bold tracking-tight">Next Match</h3>
                  <span className="text-[#FF4D00] text-[11px] font-black uppercase tracking-widest">{matches[0].round}</span>
                </div>
                {matches.map(match => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            )}

            {/* Previous Matches Section */}
            {previousMatches.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-t border-white/5 pt-6">
                  <h3 className="text-white text-base font-bold tracking-tight">Previous Matches</h3>
                  <span className="text-[#FF4D00] text-[11px] font-black uppercase tracking-widest">{previousMatches[0].round}</span>
                </div>
                {previousMatches.map(match => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {!showScheduleForm && (
        <button 
          onClick={() => setShowScheduleForm(true)}
          className="fixed bottom-32 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-[#FF8A00] to-[#FF0000] flex items-center justify-center text-white shadow-[0_10px_30px_rgba(255,138,0,0.4)] z-40 active:scale-95 transition-transform"
        >
          <Plus size={32} strokeWidth={3} />
        </button>
      )}

      {/* Background Blur Overlay for form */}
      <AnimatePresence>
        {showScheduleForm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md -z-10"
          />
        )}
      </AnimatePresence>
    </div>
  )
}


function MatchCard({ match }: { match: Match }) {
  const router = useRouter()
  const { addToast } = useToast()
  const [isLive, setIsLive] = useState(match.isLive)

  const handleToggleLive = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.checked;
    setIsLive(nextValue);
    if (nextValue) {
      addToast(`${match.teamA} vs ${match.teamB} is now LIVE!`, 'success');
    }
  }

  return (
    <div 
      onClick={() => router.push(`/admin/schedule/${match.id}`)}
      className="bg-[#1E2032] border border-white/5 rounded-[24px] p-6 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
    >
      <div className="flex items-center justify-between">
        {/* Team A */}
        <div className="flex flex-col items-center gap-2 w-24">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-[#0F111A] flex items-center justify-center border border-white/10">
            <img src={match.teamALogo} className="w-9 h-9 object-contain" alt="" />
          </div>
          <span className="text-[11px] font-chakra font-black text-white uppercase truncate w-full text-center tracking-wider">
            {match.teamA}
          </span>
        </div>

        {/* Center Info */}
        <div className="flex flex-col items-center gap-1.5 flex-1">
          <span className="text-[11px] text-white/40 font-bold uppercase tracking-tight">
            {match.date}
          </span>
          <div className="bg-[#0F111A] min-w-[100px] h-11 flex items-center justify-center rounded-xl border border-white/5 shadow-inner">
            <span className="font-chakra font-black text-lg text-white tracking-widest leading-none">
              {match.score || match.time}
            </span>
          </div>
          
          {!match.score && (
            <div className="flex flex-col items-center gap-1 pt-1" onClick={(e) => e.stopPropagation()}>
              <label className="relative inline-flex items-center cursor-pointer scale-90">
                <input type="checkbox" className="sr-only peer" checked={isLive} onChange={handleToggleLive} />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
              <span className="text-[9px] text-[#FF4D00] font-black uppercase tracking-[0.2em] italic leading-none">Go Live</span>
            </div>
          )}
        </div>

        {/* Team B */}
        <div className="flex flex-col items-center gap-2 w-24">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-[#0F111A] flex items-center justify-center border border-white/10">
            <img src={match.teamBLogo} className="w-9 h-9 object-contain" alt="" />
          </div>
          <span className="text-[11px] font-chakra font-black text-white uppercase truncate w-full text-center tracking-wider">
            {match.teamB}
          </span>
        </div>
      </div>
    </div>
  )
}
