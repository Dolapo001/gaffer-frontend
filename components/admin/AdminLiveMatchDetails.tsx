'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, Info, Plus, MessageSquare, Clock, BarChart2,
  AlertTriangle, Repeat, Square, Play, Edit2, Trophy, X, ChevronDown
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { GradientButton } from '@/components/GradientButton'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getFixture, startMatch, updateFixture, listEvents, listLineups, submitLineup, recordEvent, type FixtureEvent } from '@/lib/services/fixture.service'
import { listPlayers, getTeam } from '@/lib/services/team.service'
import { useToast } from '@/store/toastStore'
import { useUIStore } from '@/store/uiStore'

export function AdminLiveMatchDetails({ id }: { id: string }) {
  const router = useRouter()
  const { addToast } = useToast()
  const { hideNavbar, showNavbar } = useUIStore()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<'lineup' | 'commentary'>('lineup')
  const [commentaryStep, setCommentaryStep] = useState<'idle' | 'menu' | 'minute' | 'team' | 'scorer' | 'assist' | 'custom'>('idle')
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away' | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [selectedScorer, setSelectedScorer] = useState<any | null>(null)
  const [matchMinute, setMatchMinute] = useState<string>('')
  const [commentaryText, setCommentaryText] = useState('')

  const [homeFormation, setHomeFormation] = useState<'4-4-2' | '4-3-3' | '3-5-2'>('4-3-3')
  const [awayFormation, setAwayFormation] = useState<'4-4-2' | '4-3-3' | '3-5-2'>('4-3-3')
  const [isSelectingFormation, setIsSelectingFormation] = useState<'home' | 'away' | null>(null)
  const [homeLineup, setHomeLineup] = useState<Record<number, any>>({})
  const [awayLineup, setAwayLineup] = useState<Record<number, any>>({})
  const [isSelectingPlayer, setIsSelectingPlayer] = useState<{ team: 'home' | 'away', idx: number } | null>(null)

  // 1. Fetch Fixture
  const { data: fixture, isLoading: isFixtureLoading } = useQuery({
    queryKey: ['fixture', id],
    queryFn: () => getFixture(id),
    enabled: !!id
  })

  // 2. Persist Go Live Status
  const updateFixtureMutation = useMutation({
    mutationFn: (payload: any) => updateFixture(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixture', id] })
      addToast("Match updated successfully", "success")
    },
    onError: (err: any) => addToast(err?.message || "Failed to update match", "error")
  })

  const toggleMutation = useMutation({
    mutationFn: async (live: boolean) => {
      if (live) return startMatch(id)
      return updateFixture(id, { status: 'scheduled' })
    },
    onSuccess: (_, live) => {
      queryClient.invalidateQueries({ queryKey: ['fixture', id] })
      addToast(live ? "Match is now LIVE!" : "Match scheduled.", "success")
    },
    onError: (err: any) => addToast(err?.message || "Failed to update status", "error")
  })

  // 2.1 Save Lineup — POST /fixtures/:id/lineups (once per team)
  const saveLineupMutation = useMutation({
    mutationFn: async () => {
      const toPlayerIds = (lineup: Record<number, any>): string[] =>
        Object.values(lineup)
          .map((v: any) => v?._id || v?.id || (typeof v === 'string' ? v : null))
          .filter(Boolean) as string[]

      const saves: Promise<any>[] = []
      if (homeId && Object.keys(homeLineup).length > 0) {
        saves.push(submitLineup(id, { teamId: homeId, starters: toPlayerIds(homeLineup) }))
      }
      if (awayId && Object.keys(awayLineup).length > 0) {
        saves.push(submitLineup(id, { teamId: awayId, starters: toPlayerIds(awayLineup) }))
      }
      return Promise.all(saves)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lineups', id] })
      queryClient.invalidateQueries({ queryKey: ['fixture', id] })
      addToast("Changes saved successfully", "success")
    },
    onError: (err: any) => addToast(err?.message || "Failed to save changes", "error")
  })

  // Sync formation state from fixture (lineup is handled separately via listLineups)
  useEffect(() => {
    if (fixture) {
      if (fixture.homeFormation) setHomeFormation(fixture.homeFormation as any)
      if (fixture.awayFormation) setAwayFormation(fixture.awayFormation as any)
    }
  }, [fixture])

  const isLive = fixture?.status === 'live' || fixture?.status === 'halftime'

  const homeId = typeof fixture?.homeTeamId === 'string' ? fixture.homeTeamId : fixture?.homeTeamId?._id
  const awayId = typeof fixture?.awayTeamId === 'string' ? fixture.awayTeamId : fixture?.awayTeamId?._id

  // 1.1 Fetch Full Teams
  const { data: teamA } = useQuery({
    queryKey: ['team', homeId],
    queryFn: () => homeId ? getTeam(homeId) : Promise.resolve(null),
    enabled: !!homeId
  })

  const { data: teamB } = useQuery({
    queryKey: ['team', awayId],
    queryFn: () => awayId ? getTeam(awayId) : Promise.resolve(null),
    enabled: !!awayId
  })

  // 1.2 Fetch Squads
  const { data: homeSquad, isLoading: isHomeSquadLoading } = useQuery({
    queryKey: ['squad', homeId],
    queryFn: () => homeId ? listPlayers(homeId) : Promise.resolve([]),
    enabled: !!homeId
  })

  const { data: awaySquad, isLoading: isAwaySquadLoading } = useQuery({
    queryKey: ['squad', awayId],
    queryFn: () => awayId ? listPlayers(awayId) : Promise.resolve([]),
    enabled: !!awayId
  })

  // 1.25 Fetch existing lineups (GET /fixtures/:id/lineups)
  const { data: existingLineups } = useQuery({
    queryKey: ['lineups', id],
    queryFn: () => listLineups(id),
    enabled: !!id,
    throwOnError: false,
  })

  // Populate slot state from server lineup when the page first loads
  useEffect(() => {
    if (!existingLineups || !homeId || !awayId) return
    const homeServerLineup = existingLineups.find((l: any) => {
      const tid = (typeof l.teamId === 'object' && l.teamId !== null) ? (l.teamId as any)._id : l.teamId
      return tid === homeId
    })
    const awayServerLineup = existingLineups.find((l: any) => {
      const tid = (typeof l.teamId === 'object' && l.teamId !== null) ? (l.teamId as any)._id : l.teamId
      return tid === awayId
    })
    if (homeServerLineup?.starters?.length && Object.keys(homeLineup).length === 0) {
      const mapped: Record<number, any> = {}
      ;(homeServerLineup.starters as any[]).forEach((p: any, i: number) => {
        if (p && typeof p === 'object') mapped[i] = p
      })
      if (Object.keys(mapped).length) setHomeLineup(mapped)
    }
    if (awayServerLineup?.starters?.length && Object.keys(awayLineup).length === 0) {
      const mapped: Record<number, any> = {}
      ;(awayServerLineup.starters as any[]).forEach((p: any, i: number) => {
        if (p && typeof p === 'object') mapped[i] = p
      })
      if (Object.keys(mapped).length) setAwayLineup(mapped)
    }
  // Only run when lineup data first arrives — not on every homeLineup/awayLineup change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingLineups, homeId, awayId])

  // 1.3 Fetch Events (poll every 10s when live)
  const { data: events = [], isLoading: isEventsLoading } = useQuery({
    queryKey: ['events', id],
    queryFn: () => listEvents(id),
    enabled: !!id,
    refetchInterval: isLive ? 10_000 : false,
  })

  const flattenSquad = (squad: any) => {
    const list = Array.isArray(squad) ? squad : (squad?.players || [])
    if (!list || !Array.isArray(list)) return []

    return list.map((membership: any) => {
      const p = (membership.playerId && typeof membership.playerId === 'object') ? membership.playerId : {}
      const profilePic = p.photoUrl || p.photo || membership.photoUrl || membership.photo
      return {
        ...p,
        _id: p._id || membership.playerId,
        firstName: p.firstName || membership.firstName || 'Player',
        lastName: p.lastName || membership.lastName || '',
        photoUrl: profilePic,
        membershipId: membership._id,
        teamId: membership.teamId,
        role: membership.role || 'Member',
        jerseyNumber: membership.jerseyNumber || p.jerseyNumber || '?'
      }
    })
  }

  const flattenedHomeSquad = flattenSquad(homeSquad)
  const flattenedAwaySquad = flattenSquad(awaySquad)
  const isSquadLoading = isHomeSquadLoading || isAwaySquadLoading
  const commentarySquad = selectedTeam === 'home' ? flattenedHomeSquad : selectedTeam === 'away' ? flattenedAwaySquad : []
  const recordEventMutation = useMutation({
    mutationFn: (payload: any) => recordEvent(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', id] })
      queryClient.invalidateQueries({ queryKey: ['fixture', id] })
      addToast('Event recorded', 'success')
      resetCommentary()
    },
    onError: (err: any) => addToast(err?.message || 'Failed to record event', 'error')
  })

  const ACTION_TYPE_MAP: Record<string, string> = {
    'GOAL':           'goal',
    'YELLOW CARD':    'yellow_card',
    'RED CARD':       'red_card',
    'SUBSTITUTION':   'substitution',
    'ATTEMPT MISSED': 'attempt_missed',
    'HALFTIME':       'halftime',
    'FULLTIME':       'fulltime',
    'START':          'start',
    'PENALTY':        'penalty',
    'CUSTOM':         'custom',
  }

  const NEEDS_TEAM_PLAYER = ['GOAL', 'RED CARD', 'YELLOW CARD', 'SUBSTITUTION', 'ATTEMPT MISSED', 'PENALTY']
  const NEEDS_SECOND_PLAYER = ['GOAL', 'SUBSTITUTION']
  const NEEDS_TEXT = ['CUSTOM']

  const formations = {
    '4-4-2': [
      { t: 88, l: 50 }, { t: 72, l: 15 }, { t: 72, l: 38 }, { t: 72, l: 62 }, { t: 72, l: 85 },
      { t: 45, l: 15 }, { t: 45, l: 38 }, { t: 45, l: 62 }, { t: 45, l: 85 },
      { t: 18, l: 35 }, { t: 18, l: 65 }
    ],
    '4-3-3': [
      { t: 88, l: 50 }, { t: 72, l: 15 }, { t: 72, l: 38 }, { t: 72, l: 62 }, { t: 72, l: 85 },
      { t: 45, l: 25 }, { t: 45, l: 50 }, { t: 45, l: 75 },
      { t: 18, l: 15 }, { t: 18, l: 50 }, { t: 18, l: 85 }
    ],
    '3-5-2': [
      { t: 88, l: 50 }, { t: 72, l: 25 }, { t: 72, l: 50 }, { t: 72, l: 75 },
      { t: 45, l: 10 }, { t: 45, l: 30 }, { t: 45, l: 50 }, { t: 45, l: 70 }, { t: 45, l: 90 },
      { t: 18, l: 35 }, { t: 18, l: 65 }
    ]
  }

  const assignPlayer = (team: 'home' | 'away', idx: number, player: any) => {
    if (team === 'home') setHomeLineup({ ...homeLineup, [idx]: player })
    else setAwayLineup({ ...awayLineup, [idx]: player })
    setIsSelectingPlayer(null)
  }

  useEffect(() => {
    const shouldHide = commentaryStep !== 'idle' || !!isSelectingPlayer || !!isSelectingFormation

    if (shouldHide) {
      document.body.style.overflow = 'hidden'
      hideNavbar()
    } else {
      document.body.style.overflow = ''
      showNavbar()
    }
    return () => {
      document.body.style.overflow = ''
      showNavbar()
    }
  }, [commentaryStep, isSelectingPlayer, isSelectingFormation, hideNavbar, showNavbar])

  const actionTypes = [
    { label: 'FULLTIME', icon: "/icons/Live Game/Commentary/mdi_whistle-outline.svg" },
    { label: 'HALFTIME', icon: "/icons/Live Game/Commentary/mdi_whistle-outline.svg" },
    { label: 'PENALTY', icon: "/icons/Live Game/Commentary/emojione-monotone_goal-net.svg" },
    { label: 'ATTEMPT MISSED', icon: "/icons/Live Game/Commentary/subway_missing.svg" },
    { label: 'SUBSTITUTION', icon: "/icons/Live Game/Commentary/Vector.svg" },
    { label: 'RED CARD', color: '#EF4444' },
    { label: 'YELLOW CARD', color: '#FACC15' },
    { label: 'GOAL', icon: "/icons/Live Game/Commentary/emojione-monotone_goal-net.svg" },
    { label: 'START', icon: "/icons/Live Game/Commentary/mdi_whistle-outline.svg" },
    { label: 'CUSTOM', icon: "/icons/Live Game/Commentary/ri_edit-line.svg" },
  ]

  const resetCommentary = () => {
    setCommentaryStep('idle')
    setSelectedAction(null)
    setSelectedTeam(null)
    setSelectedTeamId(null)
    setSelectedScorer(null)
    setMatchMinute('')
    setCommentaryText('')
  }

  if (isFixtureLoading) return <div className="min-h-screen bg-[#0F111A] flex items-center justify-center text-white">Loading...</div>
  if (!fixture) return <div className="min-h-screen bg-[#0F111A] flex items-center justify-center text-white">Fixture not found</div>

  return (
    <div className="bg-[#0F111A] text-white relative flex flex-col min-h-screen">
      <header className="px-6 pt-4 pb-3 flex items-center justify-between sticky top-0 bg-[#0F111A]/80 backdrop-blur-md z-40 shrink-0">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full border border-white/10 text-white/60 hover:text-white transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-inter font-bold text-xl uppercase tracking-wider">{fixture.status === 'completed' ? 'Final Score' : isLive ? 'Live Game' : 'Match Details'}</h1>
        <button className="w-10 h-10 flex items-center justify-center rounded-full border border-white/10 text-white/60 hover:text-white transition-colors">
          <Info size={20} />
        </button>
      </header>

      <main className={`px-6 flex flex-col flex-1 ${activeTab === 'lineup' ? 'space-y-8 pb-20' : ''}`}>
        <section className="flex flex-col items-center space-y-6 pt-4 shrink-0">
          <div className="text-center flex flex-col gap-1">
            <span className={`font-inter font-bold text-[12px] uppercase tracking-[0.2em] ${isLive ? 'text-[#00FF85] animate-pulse' : 'text-white/40'}`}>
              {fixture.status === 'live' ? 'Live' : fixture.status === 'completed' ? 'Full Time' : 'Scheduled'}
            </span>
          </div>

          <div className="flex items-center justify-between w-full max-w-md px-2 sm:px-4 gap-x-1 sm:gap-x-2">
             <div className="flex flex-col items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-white/5 border border-white/10 relative overflow-hidden flex items-center justify-center">
                   {teamA?.logoUrl ? (
                      <img src={teamA.logoUrl} className="w-full h-full object-cover p-3 sm:p-4" alt="" />
                   ) : (
                      <Trophy size={20} className="text-white/10 sm:w-7 sm:h-7" />
                   )}
                </div>
                <span className="text-[10px] sm:text-[13px] font-inter font-bold text-white uppercase text-center mt-1 tracking-wide truncate w-full">{teamA?.name || 'Home'}</span>
             </div>

             <div className="flex items-center gap-2 sm:gap-4 px-2 sm:px-4 shrink-0">
                <span className="font-inter font-bold text-4xl sm:text-6xl text-white tracking-tighter tabular-nums leading-none">{fixture.score?.home ?? 0}</span>
                <span className="text-white/20 font-inter font-bold text-2xl sm:text-4xl leading-none">-</span>
                <span className="font-inter font-bold text-4xl sm:text-6xl text-white tracking-tighter tabular-nums leading-none">{fixture.score?.away ?? 0}</span>
             </div>

             <div className="flex flex-col items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-white/5 border border-white/10 relative overflow-hidden flex items-center justify-center">
                   {teamB?.logoUrl ? (
                      <img src={teamB.logoUrl} className="w-full h-full object-cover p-3 sm:p-4" alt="" />
                   ) : (
                      <Trophy size={20} className="text-white/10 sm:w-7 sm:h-7" />
                   )}
                </div>
                <span className="text-[10px] sm:text-[13px] font-inter font-bold text-white uppercase text-center mt-1 tracking-wide truncate w-full">{teamB?.name || 'Away'}</span>
             </div>
          </div>

          <div className="grid grid-cols-2 w-full gap-8 px-8 mt-2">
            <div className="flex flex-col gap-0.5 items-start">
              {events
                .filter(e => e.type === 'goal' && (typeof e.teamId === 'string' ? e.teamId === homeId : (e.teamId as any)?._id === homeId))
                .map(s => (
                  <span key={(s as any)._id} className="text-[11px] font-inter font-bold text-white whitespace-nowrap">
                    {(s.playerId && typeof s.playerId === 'object') ? ((s.playerId as any).lastName || s.playerId.firstName) : 'Player'} {s.minute}&apos;
                  </span>
                ))}
            </div>
            <div className="flex flex-col gap-0.5 items-end text-right">
              {events
                .filter(e => e.type === 'goal' && (typeof e.teamId === 'string' ? e.teamId === awayId : (e.teamId as any)?._id === awayId))
                .map(s => (
                  <span key={(s as any)._id} className="text-[11px] font-inter font-bold text-white whitespace-nowrap">
                    {(s.playerId && typeof s.playerId === 'object') ? ((s.playerId as any).lastName || s.playerId.firstName) : 'Player'} {s.minute}&apos;
                  </span>
                ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 pt-2">
            <label className="relative inline-flex items-center cursor-pointer scale-100">
              <input type="checkbox" className="sr-only peer" checked={isLive} onChange={(e) => toggleMutation.mutate(e.target.checked)} disabled={toggleMutation.isPending} />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#22C55E]"></div>
            </label>
            <span className={`text-[10px] font-inter font-bold uppercase tracking-widest mt-1 ${isLive ? 'text-[#22C55E]' : 'text-[#FF5C00]'}`}>
               {toggleMutation.isPending ? 'Updating...' : isLive ? 'Live' : 'Go Live'}
            </span>
          </div>
        </section>

        <div className="flex border-b border-white/5 shrink-0">
          <button onClick={() => setActiveTab('lineup')} className={`flex-1 py-2.5 font-inter font-bold text-xs uppercase tracking-wider transition-colors ${activeTab === 'lineup' ? 'text-white border-b-2 border-[#FF5C00]' : 'text-white/40'}`}>Line-up</button>
          <button onClick={() => setActiveTab('commentary')} className={`flex-1 py-2.5 font-inter font-bold text-xs uppercase tracking-wider transition-colors ${activeTab === 'commentary' ? 'text-white border-b-2 border-[#FF5C00]' : 'text-white/40'}`}>Commentary</button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'lineup' ? (
            <motion.div key="lineup" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="space-y-6">
                {/* Away Team Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="font-inter font-bold text-[12px] uppercase text-white/50 tracking-widest">AWAY TEAM</span>
                    <button onClick={() => setIsSelectingFormation('away')} className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 group">
                      <span className="text-[10px] font-inter font-bold text-white/60 uppercase tracking-widest">{awayFormation}</span>
                      <ChevronDown size={12} className="text-white/40 group-hover:text-white transition-colors" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(formations[awayFormation]|| formations['4-3-3']).map((_, idx) => {
                      const player = awayLineup[idx]
                      return (
                        <div key={`a-list-${idx}`} onClick={() => setIsSelectingPlayer({ team: 'away', idx })} className="flex items-center justify-between bg-[#1C1F2D] p-4 rounded-[20px] border border-white/[0.03] active:scale-[0.98] transition-all cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-inter font-bold text-xs ${player ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/20'}`}>
                              {player?.jerseyNumber || '—'}
                            </div>
                            <div>
                              <h4 className={`font-inter font-bold text-sm uppercase ${player ? 'text-white' : 'text-white/20'}`}>{player ? `${player.firstName} ${player.lastName}` : 'Empty Slot'}</h4>
                              <p className="text-[10px] font-inter font-bold text-white/30 uppercase tracking-widest mt-0.5">{player?.position || 'UNASSIGNED'}</p>
                            </div>
                          </div>
                          <Plus size={18} className="text-white/10" />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Home Team Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1 border-t border-white/5 pt-6">
                    <span className="font-inter font-bold text-[12px] uppercase text-white/50 tracking-widest">HOME TEAM</span>
                    <button onClick={() => setIsSelectingFormation('home')} className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 group">
                      <span className="text-[10px] font-inter font-bold text-white/60 uppercase tracking-widest">{homeFormation}</span>
                      <ChevronDown size={12} className="text-white/40 group-hover:text-white transition-colors" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(formations[homeFormation]|| formations['4-3-3']).map((_, idx) => {
                      const player = homeLineup[idx]
                      return (
                        <div key={`h-list-${idx}`} onClick={() => setIsSelectingPlayer({ team: 'home', idx })} className="flex items-center justify-between bg-[#1C1F2D] p-4 rounded-[20px] border border-white/[0.03] active:scale-[0.98] transition-all cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-inter font-bold text-xs ${player ? 'bg-[#FF5C00]/20 text-[#FF5C00]' : 'bg-white/5 text-white/20'}`}>
                              {player?.jerseyNumber || '—'}
                            </div>
                            <div>
                              <h4 className={`font-inter font-bold text-sm uppercase ${player ? 'text-white' : 'text-white/20'}`}>{player ? `${player.firstName} ${player.lastName}` : 'Empty Slot'}</h4>
                              <p className="text-[10px] font-inter font-bold text-white/30 uppercase tracking-widest mt-0.5">{player?.position || 'UNASSIGNED'}</p>
                            </div>
                          </div>
                          <Plus size={18} className="text-white/10" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="pb-10 pt-4 px-2">
                 <GradientButton
                   onClick={() => saveLineupMutation.mutate()}
                   loading={saveLineupMutation.isPending}
                   className="h-14 w-full rounded-xl font-inter font-bold text-lg uppercase tracking-wider"
                 >
                   Save Squad
                 </GradientButton>
              </div>

              <AnimatePresence>
                {isSelectingPlayer && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[999] flex items-end justify-center px-4 pb-10">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsSelectingPlayer(null)} />
                    <motion.div initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }} className="bg-[#1C1F2D] w-full max-w-md rounded-[32px] border border-white/10 z-10 max-h-[70vh] flex flex-col shadow-2xl relative">
                      <div className="p-8 border-b border-white/5 flex items-center justify-between text-white">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full border border-white/10 bg-[#0F111A] overflow-hidden flex items-center justify-center">
                               <img src={(isSelectingPlayer.team === 'home' ? teamA : teamB)?.logoUrl || "/images/mc_logo.png"} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="space-y-1">
                               <h3 className="font-inter font-bold text-lg uppercase tracking-tight">Assign Player</h3>
                               <p className="text-[11px] text-white/30 font-inter font-bold uppercase tracking-widest">
                                 {(isSelectingPlayer.team === 'home' ? teamA : teamB)?.name || 'TBC'} Squad
                               </p>
                            </div>
                         </div>
                         <button onClick={() => setIsSelectingPlayer(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/40"><X size={20} /></button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar min-h-[400px]">
                        {isSquadLoading ? (
                          <div className="flex flex-col items-center justify-center py-20 text-white/20">
                            <div className="w-8 h-8 border-2 border-[#FF5C00]/30 border-t-[#FF5C00] rounded-full animate-spin mb-4" />
                            <p className="font-inter font-bold text-sm uppercase">Loading Squad Roster...</p>
                          </div>
                        ) : (
                          <>
                            {(isSelectingPlayer.team === 'home' ? flattenedHomeSquad : flattenedAwaySquad)
                              ?.map((player: any) => {
                              const lineup = isSelectingPlayer.team === 'home' ? homeLineup : awayLineup
                              const isAssigned = Object.values(lineup).some((p: any) => p?._id && p?._id === player?._id)
                              return (
                                <button
                                  key={player._id || player.membershipId}
                                  disabled={isAssigned}
                                  onClick={() => assignPlayer(isSelectingPlayer.team, isSelectingPlayer.idx, player)}
                                  className={`w-full flex items-center justify-between gap-5 p-5 rounded-2xl border border-white/5 transition-all ${isAssigned ? 'opacity-20 cursor-not-allowed bg-black/20' : 'bg-white/10 hover:bg-white/20 active:scale-x-[0.98]'}`}
                                >
                                <div className="flex items-center gap-5">
                                  <div className="relative">
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center text-white">
                                      {(player.photoUrl || player.photo) ? (
                                        <img src={player.photoUrl || player.photo} className="w-full h-full object-cover" alt="" />
                                      ) : (
                                        <div className={`w-full h-full flex items-center justify-center font-inter font-bold text-xs ${isSelectingPlayer.team === 'home' ? 'text-[#FF5C00]/40' : 'text-blue-400/40'}`}>
                                          GAF
                                        </div>
                                      )}
                                    </div>
                                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-[#1C1F2D] flex items-center justify-center font-inter font-bold text-[10px] ${isSelectingPlayer.team === 'home' ? 'bg-[#FF5C00] text-white' : 'bg-blue-500 text-white'}`}>
                                      {player.jerseyNumber || '?'}
                                    </div>
                                  </div>
                                  <div className="flex-1 text-left">
                                    <h4 className="font-inter font-bold text-white text-base uppercase leading-tight">{player.firstName} {player.lastName}</h4>
                                    <p className="text-[10px] text-white/30 uppercase font-inter font-bold tracking-widest mt-0.5">{player.position || player.role || 'PLAYER'}</p>
                                  </div>
                                </div>
                                {!isAssigned && <Plus size={20} className="text-white/40 group-hover:text-white transition-colors" />}
                              </button>
                            )
                          })}
                          </>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Formation Selector Modal */}
              <AnimatePresence>
                {isSelectingFormation && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] flex items-center justify-center px-6">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsSelectingFormation(null)} />
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#1C1F2D] w-full max-w-[280px] rounded-[32px] border border-white/10 z-10 overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/5 text-center bg-white/5">
                          <h3 className="font-inter font-bold text-xs uppercase tracking-widest text-white/40">Select Formation</h3>
                       </div>
                       <div className="p-3">
                          {Object.keys(formations).map((form) => (
                            <button
                              key={form}
                              onClick={() => {
                                if (isSelectingFormation === 'home') setHomeFormation(form as any)
                                else setAwayFormation(form as any)
                                setIsSelectingFormation(null)
                              }}
                              className={`w-full py-4 rounded-2xl font-inter font-bold text-sm uppercase transition-all mb-1 last:mb-0 ${
                                (isSelectingFormation === 'home' ? homeFormation : awayFormation) === form
                                  ? 'bg-gradient-to-r from-[#FF5C00] to-[#FF2D20] text-white shadow-lg'
                                  : 'text-white/40 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              {form}
                            </button>
                          ))}
                       </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="commentary"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex flex-col"
            >
              {/* Commentary Feed */}
              <div className={`space-y-4 pt-4 pb-32 no-scrollbar transition-all duration-300 ${commentaryStep !== 'idle' ? 'opacity-10 blur-md pointer-events-none' : ''}`}>
                {isEventsLoading && (
                  <div className="flex items-center justify-center py-16 text-white/30">
                    <p className="font-inter font-bold text-xs uppercase animate-pulse">Loading events...</p>
                  </div>
                )}
                {!isEventsLoading && events.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-white/20">
                    <MessageSquare size={40} className="mb-4" />
                    <p className="font-inter font-bold text-sm uppercase">No events yet</p>
                    <p className="text-[11px] font-inter font-bold uppercase tracking-widest mt-1">Tap + to log the first event</p>
                  </div>
                )}
                {[...events].reverse().map((event: FixtureEvent) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>

               {/* Step Overlay */}
               <AnimatePresence>
                {commentaryStep !== 'idle' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[110] flex flex-col items-end justify-end p-6 pt-[10px] pb-28 transition-all duration-500"
                  >
                    <div
                      className="absolute inset-0 bg-black/90 backdrop-blur-[6px] -z-10"
                      onClick={resetCommentary}
                    />

                    {commentaryStep === 'team' && selectedAction && ['GOAL', 'RED CARD', 'YELLOW CARD', 'SUBSTITUTION', 'ATTEMPT MISSED'].includes(selectedAction) && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center -mt-56 pointer-events-none">
                         <motion.div
                           initial={{ scale: 0.6, opacity: 0 }}
                           animate={{ scale: 0.8, opacity: 1 }}
                           className="flex flex-col items-center"
                         >
                            {selectedAction === 'GOAL' ? (
                               <div className="flex flex-col items-center">
                                  <img src="/images/commentary/goal.png" className="w-[280px] h-[280px] object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]" alt="Goal" />
                                  <h2 className="text-4xl font-inter font-bold uppercase italic mt-4" style={{ color: '#FFF', textShadow: '0 4px 0 #EA580C, 0 8px 30px rgba(0,0,0,0.5)' }}>GOAL</h2>
                               </div>
                            ) : selectedAction === 'SUBSTITUTION' ? (
                               <div className="flex flex-col items-center">
                                  <div className="relative w-[300px] h-[360px]">
                                     <img src="/images/commentary/substitution.png" className="w-full h-full object-contain" alt="Sub" />
                                  </div>
                                  <h2 className="text-4xl font-inter font-bold uppercase italic mt-4" style={{ color: '#FFF', textShadow: '0 4px 0 #EA580C, 0 8px 30px rgba(0,0,0,0.5)' }}>SUBSTITUTION</h2>
                               </div>
                            ) : null}
                         </motion.div>
                      </div>
                    )}

                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="w-full flex flex-col items-end gap-3"
                    >
                        {commentaryStep === 'menu' && (
                        <div className="flex flex-col items-end gap-3 w-full max-h-[80vh] overflow-y-auto no-scrollbar pb-10 pr-1">
                          {actionTypes.slice().reverse().map((action, idx) => (
                            <motion.button
                              key={action.label}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              onClick={() => {
                                setSelectedAction(action.label)
                                if (NEEDS_TEAM_PLAYER.includes(action.label || '') || NEEDS_TEXT.includes(action.label || '')) {
                                  setCommentaryStep('minute')
                                } else {
                                  recordEventMutation.mutate({
                                    type: ACTION_TYPE_MAP[action.label] || 'custom',
                                    minute: 0,
                                    teamId: homeId || '',
                                  })
                                }
                              }}
                              className="flex items-center gap-3 px-4 py-2.5 bg-[#4A4646] rounded-[14px] border border-white/5 text-white shadow-xl active:scale-95 transition-all text-left"
                            >
                              <div className="w-[18px] h-[18px] flex items-center justify-center">
                                {action.icon ? (
                                  <img src={action.icon} alt="" className="w-full h-full object-contain" />
                                ) : (
                                  <div className="w-[14px] h-[18px] rounded-[2px]" style={{ backgroundColor: action.color }} />
                                )}
                              </div>
                              <span className="font-inter font-bold text-[12px] uppercase tracking-wider">{action.label}</span>
                            </motion.button>
                          ))}
                        </div>
                      )}

                      {commentaryStep === 'minute' && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-col items-end gap-4 w-full max-w-[200px]"
                        >
                          <span className="font-inter font-bold text-xs uppercase text-white/40 pr-1">MATCH MINUTE</span>
                          <input
                            type="number"
                            min="0"
                            max="200"
                            placeholder="e.g. 34"
                            value={matchMinute}
                            onChange={e => setMatchMinute(e.target.value)}
                            className="w-full bg-[#1C1F2D] border border-white/10 rounded-2xl px-5 py-4 font-inter font-bold text-2xl text-white text-right outline-none focus:border-orange-500 transition-colors"
                            autoFocus
                          />
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              if (!matchMinute) return
                              if (selectedAction === 'CUSTOM') setCommentaryStep('custom')
                              else setCommentaryStep('team')
                            }}
                            className="w-full px-4 py-3 bg-gradient-to-r from-[#FF8A00] to-[#FF0000] rounded-2xl font-inter font-bold text-sm uppercase tracking-wider text-white"
                          >
                            Next →
                          </motion.button>
                        </motion.div>
                      )}

                      {commentaryStep === 'custom' && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-col items-end gap-4 w-full"
                        >
                          <span className="font-inter font-bold text-xs uppercase text-white/40 pr-1">CUSTOM COMMENTARY</span>
                          <textarea
                            placeholder="Type here..."
                            rows={4}
                            value={commentaryText}
                            onChange={e => setCommentaryText(e.target.value)}
                            className="w-full bg-[#1C1F2D] border border-white/10 rounded-2xl px-5 py-4 font-inter font-bold text-sm text-white outline-none focus:border-orange-500 transition-colors resize-none"
                            autoFocus
                          />
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            disabled={!commentaryText || recordEventMutation.isPending}
                            onClick={() => {
                              recordEventMutation.mutate({
                                type: 'custom',
                                minute: parseInt(matchMinute) || 0,
                                teamId: homeId || '',
                                notes: commentaryText,
                                commentaryText: commentaryText,
                              })
                            }}
                            className="w-full px-4 py-3 bg-gradient-to-r from-[#00A1D1] to-[#00A1D1]/60 rounded-2xl font-inter font-bold text-sm uppercase tracking-wider text-white disabled:opacity-30"
                          >
                            {recordEventMutation.isPending ? 'Publishing...' : 'Publish to Feed'}
                          </motion.button>
                        </motion.div>
                      )}

                      {commentaryStep === 'team' && (
                        <div className="flex flex-col items-end gap-3 w-full">
                           <span className="font-inter font-bold text-xs uppercase text-white/40 mb-1 pr-1">PICK TEAM</span>
                          {[
                            { key: 'home' as const, team: teamA, tid: homeId },
                            { key: 'away' as const, team: teamB, tid: awayId },
                          ].map(({ key, team, tid }) => (
                            <motion.button
                              key={key}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              onClick={() => {
                                setSelectedTeam(key)
                                setSelectedTeamId(tid || null)
                                if (NEEDS_TEAM_PLAYER.includes(selectedAction || '')) {
                                  setCommentaryStep('scorer')
                                } else {
                                  resetCommentary()
                                }
                              }}
                              className="flex items-center gap-3 w-full max-w-[180px] px-4 py-3 bg-[#1C1F2D] border border-white/10 rounded-2xl group active:scale-95 transition-all text-left shadow-xl"
                            >
                              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                                {team?.logoUrl
                                  ? <img src={team.logoUrl} className="w-full h-full object-contain p-1.5" alt="" />
                                  : <Trophy size={14} className="text-white/40" />
                                }
                              </div>
                              <span className="text-white font-inter font-bold text-xs uppercase tracking-widest group-hover:text-orange-500 transition-colors">{team?.name || (key === 'home' ? 'Home' : 'Away')}</span>
                            </motion.button>
                          ))}
                        </div>
                      )}

                      {(commentaryStep === 'scorer' || commentaryStep === 'assist') && (
                        <div className="flex flex-col items-end gap-3 w-full max-h-[80vh] overflow-y-auto no-scrollbar pb-10 pr-1">
                          <span className="font-inter font-bold text-xs uppercase text-white/40 mb-1 pr-1 text-right">
                            {selectedAction === 'SUBSTITUTION'
                              ? (commentaryStep === 'scorer' ? 'PLAYER OUT' : 'PLAYER IN')
                              : selectedAction?.includes('CARD')
                                ? 'SELECT PLAYER'
                                : (commentaryStep === 'scorer' ? 'GOAL SCORER' : 'ASSIST (optional)')
                            }
                          </span>
                          {commentaryStep === 'assist' && (
                            <motion.button
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              onClick={() => {
                                recordEventMutation.mutate({
                                  type: ACTION_TYPE_MAP[selectedAction!] || 'custom',
                                  minute: parseInt(matchMinute) || 0,
                                  teamId: selectedTeamId || homeId || '',
                                  playerId: selectedScorer?._id,
                                })
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-white/40 text-xs font-inter font-bold uppercase"
                            >
                              Skip assist
                            </motion.button>
                          )}
                          {(commentarySquad || [])
                            .filter((p: any) => !p.role || p.role === 'player')
                            .map((player: any, idx: number) => (
                            <motion.button
                              key={`${player._id}-${idx}`}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.03 }}
                              onClick={() => {
                                if (commentaryStep === 'scorer' && NEEDS_SECOND_PLAYER.includes(selectedAction || '')) {
                                  setSelectedScorer(player)
                                  setCommentaryStep('assist')
                                } else if (commentaryStep === 'scorer') {
                                  recordEventMutation.mutate({
                                    type: ACTION_TYPE_MAP[selectedAction!] || 'custom',
                                    minute: parseInt(matchMinute) || 0,
                                    teamId: selectedTeamId || homeId || '',
                                    playerId: player._id,
                                  })
                                } else {
                                  const isSub = selectedAction === 'SUBSTITUTION'
                                  recordEventMutation.mutate({
                                    type: ACTION_TYPE_MAP[selectedAction!] || 'custom',
                                    minute: parseInt(matchMinute) || 0,
                                    teamId: selectedTeamId || homeId || '',
                                    playerId: isSub ? undefined : selectedScorer?._id,
                                    playerOutId: isSub ? selectedScorer?._id : undefined,
                                    playerInId: isSub ? player._id : undefined,
                                    assistPlayerId: !isSub ? player._id : undefined,
                                  })
                                }
                              }}
                              className="flex items-center justify-between w-full max-w-[240px] px-4 py-2.5 bg-[#4A4646] rounded-[14px] border border-white/5 text-white active:scale-95 transition-all text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
                                  {(selectedTeam === 'home' ? teamA : teamB)?.logoUrl
                                    ? <img src={(selectedTeam === 'home' ? teamA : teamB)?.logoUrl} className="w-full h-full object-contain" alt="" />
                                    : <Trophy size={10} className="text-white/40" />
                                  }
                                </div>
                                <span className="font-inter font-bold text-[13px] uppercase tracking-wide">{player.firstName} {player.lastName}</span>
                              </div>
                              <span className="text-[10px] font-bold text-white/40 uppercase pl-3 shrink-0">{player.position || 'PLR'}</span>
                            </motion.button>
                          ))}
                          {selectedAction === 'GOAL' && commentaryStep === 'scorer' && (
                            <motion.button
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              onClick={() => {
                                recordEventMutation.mutate({
                                  type: 'own_goal',
                                  minute: parseInt(matchMinute) || 0,
                                  teamId: selectedTeamId || homeId || '',
                                })
                              }}
                              className="flex items-center justify-center w-full max-w-[240px] px-4 py-3 bg-[#4A4646] rounded-[14px] border border-white/5 text-white/60 font-inter font-bold text-[13px] uppercase tracking-wider active:scale-95 transition-all mt-2"
                            >
                              OWN GOAL
                            </motion.button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Floating Action Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (commentaryStep === 'idle') setCommentaryStep('menu')
                  else resetCommentary()
                }}
                className={`fixed ${commentaryStep !== 'idle' ? 'bottom-8' : 'bottom-32'} right-6 w-14 h-14 rounded-full bg-gradient-to-br from-[#FF8A00] to-[#FF0000] flex items-center justify-center text-white z-[120] shadow-2xl active:scale-95 transition-all duration-500 ${commentaryStep !== 'idle' ? 'rotate-45' : ''}`}
              >
                <Plus size={28} strokeWidth={3} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

function EventCard({ event }: { event: FixtureEvent }) {
  const type = event.type
  const teamName = typeof event.teamId === 'object' ? (event.teamId as any).name : 'Team'
  const playerName = (event.playerId && typeof event.playerId === 'object') ? `${(event.playerId as any).firstName}` : 'Player'
  const assistPlayerName = (event.assistPlayerId && typeof event.assistPlayerId === 'object') ? `${(event.assistPlayerId as any).firstName}` : null
  const playerInName = (event.playerInId && typeof event.playerInId === 'object') ? `${(event.playerInId as any).firstName}` : null
  const playerOutName = (event.playerOutId && typeof event.playerOutId === 'object') ? `${(event.playerOutId as any).firstName}` : null

  if (type === 'goal' || type === 'own_goal') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 py-4 bg-[#8E103E] rounded-[20px] border border-white/5 flex flex-col gap-2 relative overflow-hidden text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 shrink min-w-0">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 shrink-0">
              <img src="/icons/Live Game/Commentary/emojione-monotone_goal-net.svg" className="w-4 h-4" alt="" />
            </div>
            <p className="font-inter font-bold text-[13px] uppercase text-white tracking-tight">
              {type === 'own_goal' ? 'OWN GOAL' : 'GOAL'}. {playerName} ({teamName})
            </p>
          </div>
          <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest shrink-0 ml-3">{event.minute}&apos;</span>
        </div>
        {assistPlayerName && (
          <div className="flex items-center gap-3 ml-11">
             <div className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />
             <p className="font-inter font-bold text-[11px] uppercase text-white/50 tracking-widest leading-none">ASSIST. {assistPlayerName}</p>
          </div>
        )}
      </motion.div>
    )
  }

  if (type === 'substitution') {
    return (
      <div className="bg-[#1C1F2D] rounded-[20px] px-5 py-3.5 flex flex-col gap-2 border border-white/5 relative group">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3 shrink min-w-0">
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 shrink-0">
                <img src="/icons/Live Game/Commentary/Vector.svg" className="w-3.5 h-2.5" alt="" />
              </div>
              <p className="font-inter font-bold text-[13px] uppercase text-white/90 tracking-tight">Substitution. {teamName}</p>
           </div>
           <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest shrink-0 ml-3">{event.minute}&apos;</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 ml-11">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider whitespace-nowrap">Out. {playerOutName || playerName}</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider whitespace-nowrap">In. {playerInName || 'Player'}</span>
           </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#1C1F2D] rounded-[20px] px-5 py-3.5 flex items-center justify-between border border-white/5 relative">
       <div className="flex items-center gap-4 shrink min-w-0">
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 shrink-0">
            <MessageSquare size={14} className="text-white/20" />
          </div>
          <p className="font-inter font-bold text-[11px] leading-relaxed uppercase py-0.5 text-white/60 tracking-tight pr-10">
            {type === 'custom' ? '' : `${type.replace('_', ' ')}. `}
            {event.commentaryText || event.notes || teamName}
          </p>
       </div>
       <span className="absolute top-4 right-5 text-[10px] font-bold text-white/20 whitespace-nowrap">{event.minute}&apos;</span>
    </div>
  )
}
