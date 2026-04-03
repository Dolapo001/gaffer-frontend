'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Menu, ChevronDown, Calendar, Clock, X, ChevronLeft, Trophy } from 'lucide-react'
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
  venue?: string
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listFixtures, createFixture, Fixture, listRounds, Round } from '@/lib/services/fixture.service'
import { listCompetitions, Competition, listCompetitionTeams, CompetitionTeam } from '@/lib/services/competition.service'
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
  const [formCompetitionId, setFormCompetitionId] = useState('')
  const [formRoundId, setFormRoundId] = useState('')
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
  
  // 2. Fetch Competitions - Sort to find the "current/ongoing" one
  const { data: competitions, isLoading: isLoadingComps } = useQuery({
    queryKey: ['competitions', orgId],
    queryFn: () => listCompetitions(orgId!),
    enabled: !!orgId
  })

  // Determine the best default competition (Most recent + Live > Published > Draft)
  const sortedComps = (competitions || []).slice().sort((a: any, b: any) => {
    const statusPriority: Record<string, number> = { live: 3, published: 2, draft: 1, completed: 0 }
    const pA = statusPriority[a.status] ?? 0
    const pB = statusPriority[b.status] ?? 0
    if (pA !== pB) return pB - pA
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  })

  const competitionId = formCompetitionId || (sortedComps?.[0]?._id as string)

  const selectedComp = competitions?.find(c => c._id === (formCompetitionId || competitionId))
  
  // 3. Fetch Rounds (for selection)
  const { data: rounds } = useQuery({
    queryKey: ['rounds', formCompetitionId],
    queryFn: () => listRounds(formCompetitionId!),
    enabled: !!formCompetitionId
  })

  useEffect(() => {
    if (sortedComps?.length && !formCompetitionId) {
       setFormCompetitionId(sortedComps[0]._id)
    }
  }, [sortedComps, formCompetitionId])

  useEffect(() => {
    if (rounds?.length && !formRoundId) {
       setFormRoundId(rounds[0]._id)
    }
  }, [rounds, formRoundId])

  // Mutate: Create Fixture
  const createFixtureMutation = useMutation({
    mutationFn: (payload: any) => createFixture(payload.competitionId, payload),
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

  // 4. Fetch Teams (specifically for the selected tournament)
  const { data: teams } = useQuery({
    queryKey: ['competition-teams', formCompetitionId],
    queryFn: () => listCompetitionTeams(formCompetitionId!),
    enabled: !!formCompetitionId
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
      round: (f.roundId as any)?.name || 'General Schedule',
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
      round: (f.roundId as any)?.name || 'General Schedule',
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
    <div className="min-h-screen bg-[#181928] pb-32 flex flex-col pt-4 overflow-x-hidden relative">
      {/* Header */}
      {!showScheduleForm && (
        <div className="flex flex-col gap-4 px-4 md:px-6 mb-8 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 px-4 pt-4 pb-4">
              <button 
                onClick={() => router.back()}
                className="text-white/60 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/5 active:scale-95"
              >
                <ChevronLeft size={24} />
              </button>
              <h1 className="text-xl font-inter font-bold text-white uppercase tracking-wider">Your Schedule</h1>
            </div>
          </div>
          
          <div className="relative group/select">
            <select
              value={competitionId}
              onChange={(e) => setFormCompetitionId(e.target.value)}
              className="w-full h-12 bg-[#1E2032] border border-white/5 rounded-xl px-4 text-white text-[13px] font-inter font-bold uppercase tracking-wider focus:outline-none appearance-none cursor-pointer transition-all hover:border-[#FF5C00]/30 shadow-lg"
            >
              <option value="">Select Tournament</option>
              {sortedComps?.map((c: Competition) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none group-hover/select:text-[#FF5C00]/50 transition-colors" />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {showScheduleForm ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 md:px-6 pt-4 pb-6 space-y-6"
          >
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowScheduleForm(false)}
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all shadow-lg"
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="font-inter font-bold text-xl uppercase tracking-tight">Schedule Game</h2>
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
                <label className="text-[13px] text-white/50 font-medium ml-1 uppercase tracking-wider">Tournament</label>
                <div className="relative">
                  <select
                    value={formCompetitionId}
                    onChange={(e) => {
                      setFormCompetitionId(e.target.value)
                      setFormRoundId('')
                      setFormHomeTeamId('')
                      setFormAwayTeamId('')
                    }}
                    className="w-full h-14 bg-[#1E2032] border border-white/5 rounded-2xl px-4 md:px-6 text-white text-sm focus:outline-none appearance-none font-medium"
                  >
                    <option value="">Select Tournament</option>
                    {sortedComps?.map((c: Competition) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                </div>
              </div>

              {/* Dynamic Round Section */}
              <div className="space-y-2">
                <label className="text-[13px] text-white/50 font-inter font-bold ml-1 uppercase tracking-wider">
                  {selectedComp?.format === 'knockout' ? 'Tournament Stage' : 
                   selectedComp?.format === 'groups' ? 'Group Stage' : 
                   ['round_robin', 'league_knockout'].includes(selectedComp?.format || '') ? 'Matchday' : 'Round'}
                </label>
                <div className="relative">
                  <select
                    value={formRoundId}
                    onChange={(e) => setFormRoundId(e.target.value)}
                    className="w-full h-14 bg-[#1E2032] border border-white/5 rounded-2xl px-4 md:px-6 text-white text-sm focus:outline-none appearance-none font-medium"
                  >
                    <option value="">Select {selectedComp?.format === 'knockout' ? 'Stage' : 'Round'}</option>
                    
                    {/* Real Rounds from Backend */}
                    {rounds?.map((r: Round) => (
                      <option key={r._id} value={r._id}>{r.name}</option>
                    ))}

                    {/* Format-aware Suggestions if no rounds exist */}
                    {!rounds?.length && (
                      <>
                        {selectedComp?.format === 'knockout' ? (
                          <>
                            <option value="Final">Final</option>
                            <option value="Semi-final">Semi-final</option>
                            <option value="Quarter-final">Quarter-final</option>
                            <option value="Round of 16">Round of 16</option>
                            <option value="Round of 32">Round of 32</option>
                          </>
                        ) : selectedComp?.format === 'groups' ? (
                          <>
                            <option value="Group Match 1">Group Match 1</option>
                            <option value="Group Match 2">Group Match 2</option>
                            <option value="Group Match 3">Group Match 3</option>
                          </>
                        ) : (
                          <>
                            <option value="Matchday 1">Matchday 1</option>
                            <option value="Matchday 2">Matchday 2</option>
                            <option value="Matchday 3">Matchday 3</option>
                            <option value="Matchday 4">Matchday 4</option>
                            <option value="Matchday 5">Matchday 5</option>
                          </>
                        )}
                      </>
                    )}
                  </select>
                  <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] text-white/50 font-medium ml-1 uppercase tracking-wider">Home Team</label>
                <div className="relative">
                  <select
                    value={formHomeTeamId}
                    onChange={(e) => setFormHomeTeamId(e.target.value)}
                    className="w-full h-14 bg-[#1E2032] border border-white/5 rounded-2xl px-4 md:px-6 text-white text-sm focus:outline-none appearance-none font-medium"
                  >
                    <option value="">Select Home Team</option>
                    {teams?.map((t: CompetitionTeam) => (
                      <option key={t.teamId} value={t.teamId}>{t.name}</option>
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
                    className="w-full h-14 bg-[#1E2032] border border-white/5 rounded-2xl px-4 md:px-6 text-white text-sm focus:outline-none appearance-none font-medium"
                  >
                    <option value="">Select Away Team</option>
                    {teams?.map((t: CompetitionTeam) => (
                      <option key={t.teamId} value={t.teamId} disabled={t.teamId === formHomeTeamId}>{t.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                </div>
              </div>

              <div className="pt-4">
                <GradientButton
                  onClick={async () => {
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

                    const isMongoId = /^[0-9a-fA-F]{24}$/.test(formRoundId);
                    
                    const handleSubmission = async (roundId?: string) => {
                      const round = rounds?.find(r => r._id === roundId)
                      const payload = {
                        competitionId: formCompetitionId,
                        homeTeamId: formHomeTeamId,
                        awayTeamId: formAwayTeamId,
                        kickoffAt: new Date(`${formDate}T${formTime}`).toISOString(),
                        roundId: roundId || undefined,
                        stageType: round?.stageType || (selectedComp?.format === 'knockout' ? 'knockout' : selectedComp?.format === 'groups' ? 'groups' : 'league'),
                        venue: 'Stadium',
                      }
                      console.log('SUBMITTING FIXTURE:', payload)
                      createFixtureMutation.mutate(payload)
                    }

                    if (formRoundId && !isMongoId) {
                      // It's a suggestion, create the round first
                      const { createRound } = await import('@/lib/services/fixture.service')
                      try {
                        const newRound = await createRound(formCompetitionId, {
                          name: formRoundId,
                          order: (rounds?.length || 0) + 1,
                          stageType: selectedComp?.format === 'knockout' ? 'knockout' : selectedComp?.format === 'groups' ? 'groups' : 'league'
                        })
                        queryClient.invalidateQueries({ queryKey: ['rounds', formCompetitionId] })
                        handleSubmission(newRound._id)
                      } catch (err: any) {
                        addToast('Failed to create suggested round', 'error')
                      }
                    } else {
                      handleSubmission(formRoundId)
                    }
                  }}
                  loading={createFixtureMutation.isPending}
                  className="h-14 w-full rounded-2xl font-inter font-bold text-base uppercase tracking-wider"
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
            <h2 className="text-white text-3xl font-inter font-bold mb-4 uppercase leading-tight tracking-tighter">
              What&apos;s up next?
            </h2>
            <p className="text-white/40 text-sm font-medium leading-relaxed max-w-[240px]">
              Manage your schedule for matches, ceremonies, Schedule now and for later
            </p>
          </motion.div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-20 space-y-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* Next Matches Section */}
            {matches.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white text-[15px] font-bold tracking-tight">Next Match</h3>
                  <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-widest">{matches[0].round}</span>
                </div>
                {matches.map(match => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            )}

            {/* Previous Matches Section */}
            {previousMatches.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 px-4 pt-4 pb-4 border-b border-white/5">
                  <h3 className="text-white text-[15px] font-bold tracking-tight">Previous Matches</h3>
                  <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-widest">{previousMatches[0].round}</span>
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
          className="fixed bottom-32 right-6 w-12 h-12 rounded-full bg-gradient-to-br from-[#FF8A00] to-[#FF0000] flex items-center justify-center text-white z-40 active:scale-95 transition-transform"
        >
          <Plus size={24} strokeWidth={3} />
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
  const queryClient = useQueryClient()
  const [isLive, setIsLive] = useState(match.isLive)

  useEffect(() => {
    setIsLive(match.isLive)
  }, [match.isLive])

  const toggleMutation = useMutation({
    mutationFn: async (live: boolean) => {
      const { startMatch, updateFixture } = await import('@/lib/services/fixture.service')
      if (live) {
        return startMatch(match.id)
      } else {
        return updateFixture(match.id, { status: 'scheduled' })
      }
    },
    onSuccess: (_, live) => {
      queryClient.invalidateQueries({ queryKey: ['fixtures'] })
      addToast(
        live 
          ? `${match.teamA} vs ${match.teamB} is now LIVE!` 
          : `${match.teamA} vs ${match.teamB} scheduled.`, 
        'success'
      )
    },
    onError: (err: any) => {
      setIsLive(!isLive) // revert local state
      addToast(err?.message || 'Failed to update match status', 'error')
    }
  })

  const handleToggleLive = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.checked
    setIsLive(nextValue)
    toggleMutation.mutate(nextValue)
  }

  return (
    <div 
      onClick={() => router.push(`/admin/schedule/${match.id}`)}
      className="bg-[#1C1E2B] border border-white/[0.03] rounded-[24px] p-4 md:p-6 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all shadow-lg hover:bg-white/[0.02]"
    >
      <div className="flex items-center justify-between gap-2 md:gap-4">
        {/* Team A */}
        <div className="flex flex-col items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden bg-[#0F111A] flex items-center justify-center border border-white/5 shadow-2xl relative">
            <img src={match.teamALogo} className="w-full h-full object-cover p-1.5" alt="" />
          </div>
          <span className="text-[12px] md:text-[14px] font-inter font-bold text-white uppercase truncate w-full text-center tracking-wide px-1">
            {match.teamA}
          </span>
        </div>

        {/* Center Info */}
        <div className="flex flex-col items-center gap-2 shrink-0 px-1 min-w-[80px] md:min-w-[120px]">
          <span className="text-[10px] md:text-[12px] text-[#94A3B8] font-bold uppercase tracking-wider text-center truncate">
            {match.date}
          </span>
          <div className="bg-[#0F111A] w-full h-10 md:h-12 flex items-center justify-center rounded-[14px] md:rounded-[18px] border border-white/5 shadow-inner px-2">
            <span className="font-inter font-bold text-[15px] md:text-[18px] text-white tracking-widest leading-none">
              {match.score || match.time}
            </span>
          </div>
          
          {!match.score && (
            <div className="flex flex-col items-center gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
              <label className="relative inline-flex items-center cursor-pointer scale-90 md:scale-100 transform-origin-center">
                <input type="checkbox" className="sr-only peer" checked={isLive} onChange={handleToggleLive} />
                <div className="w-10 h-5 md:w-11 md:h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 md:after:h-5 md:after:w-5 after:transition-all peer-checked:bg-[#FF5C00]"></div>
              </label>
              <span className="text-[9px] text-[#FF5C00] font-bold uppercase tracking-[0.1em] italic leading-none whitespace-nowrap">Go Live</span>
            </div>
          )}
        </div>

        {/* Team B */}
        <div className="flex flex-col items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden bg-[#0F111A] flex items-center justify-center border border-white/5 shadow-2xl relative">
            <img src={match.teamBLogo} className="w-full h-full object-cover p-1.5" alt="" />
          </div>
          <span className="text-[12px] md:text-[14px] font-inter font-bold text-white uppercase truncate w-full text-center tracking-wide px-1">
            {match.teamB}
          </span>
        </div>
      </div>
    </div>
  )
}
