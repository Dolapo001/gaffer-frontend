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
import { getFixture, startMatch, updateFixture, listEvents, recordEvent, type FixtureEvent } from '@/lib/services/fixture.service'
import { listPlayers, getTeam } from '@/lib/services/team.service'
import { useToast } from '@/store/toastStore'

export function AdminLiveMatchDetails({ id }: { id: string }) {
  const router = useRouter()
  const { addToast } = useToast()
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

  // 2.1 Save Lineup & Match State
  const saveLineupMutation = useMutation({
    mutationFn: async () => {
      const prepareLineup = (lineup: any) => {
        return Object.fromEntries(
          Object.entries(lineup || {}).map(([k, v]: any) => {
            const pid = v?._id || v?.id || (typeof v === 'string' ? v : undefined)
            return [k, pid]
          }).filter(([_, pid]) => pid !== undefined)
        )
      }

      return updateFixture(id, {
        homeLineup: prepareLineup(homeLineup),
        awayLineup: prepareLineup(awayLineup),
        homeFormation,
        awayFormation,
        status: fixture?.status || 'scheduled'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixture', id] })
      addToast("Changes saved successfully", "success")
    },
    onError: (err: any) => addToast(err?.message || "Failed to save changes", "error")
  })

  // Sync state with server fixture data
  useEffect(() => {
    if (fixture) {
      if (fixture.homeLineup) setHomeLineup(fixture.homeLineup)
      if (fixture.awayLineup) setAwayLineup(fixture.awayLineup)
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

  // 1.3 Fetch Events (poll every 10s when live)
  const { data: events = [], isLoading: isEventsLoading } = useQuery({
    queryKey: ['events', id],
    queryFn: () => listEvents(id),
    enabled: !!id,
    refetchInterval: isLive ? 10_000 : false,
  })

  const flattenSquad = (squad: any) => {
    // Backend may return the array directly or wrapped in an object { players: [] }
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
    mutationFn: (payload: Parameters<typeof recordEvent>[1]) => recordEvent(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', id] })
      queryClient.invalidateQueries({ queryKey: ['fixture', id] })
      addToast('Event recorded', 'success')
      resetCommentary()
    },
    onError: (err: any) => addToast(err?.message || 'Failed to record event', 'error')
  })

  // Map UI label → backend event type
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

  // Actions that need team + player selection
  const NEEDS_TEAM_PLAYER = ['GOAL', 'RED CARD', 'YELLOW CARD', 'SUBSTITUTION', 'ATTEMPT MISSED', 'PENALTY']
  // Actions that need a second player (assist / player-in)
  const NEEDS_SECOND_PLAYER = ['GOAL', 'SUBSTITUTION']
  // Actions that need custom text
  const NEEDS_TEXT = ['CUSTOM']

  const formations = {
    '4-4-2': [
      { t: 88, l: 50 }, // GK
      { t: 72, l: 15 }, { t: 72, l: 38 }, { t: 72, l: 62 }, { t: 72, l: 85 }, // DEF
      { t: 45, l: 15 }, { t: 45, l: 38 }, { t: 45, l: 62 }, { t: 45, l: 85 }, // MID
      { t: 18, l: 35 }, { t: 18, l: 65 } // FWD
    ],
    '4-3-3': [
      { t: 88, l: 50 }, // GK
      { t: 72, l: 15 }, { t: 72, l: 38 }, { t: 72, l: 62 }, { t: 72, l: 85 }, // DEF
      { t: 45, l: 25 }, { t: 45, l: 50 }, { t: 45, l: 75 }, // MID
      { t: 18, l: 15 }, { t: 18, l: 50 }, { t: 18, l: 85 } // FWD
    ],
    '3-5-2': [
      { t: 88, l: 50 }, // GK
      { t: 72, l: 25 }, { t: 72, l: 50 }, { t: 72, l: 75 }, // DEF
      { t: 45, l: 10 }, { t: 45, l: 30 }, { t: 45, l: 50 }, { t: 45, l: 70 }, { t: 45, l: 90 }, // MID
      { t: 18, l: 35 }, { t: 18, l: 65 } // FWD
    ]
  }

  const assignPlayer = (team: 'home' | 'away', idx: number, player: any) => {
    if (team === 'home') setHomeLineup({ ...homeLineup, [idx]: player })
    else setAwayLineup({ ...awayLineup, [idx]: player })
    setIsSelectingPlayer(null)
  }

  useEffect(() => {
    const navBar = document.getElementById('admin-nav-bar')
    const shouldHide = commentaryStep !== 'idle' || !!isSelectingPlayer || !!isSelectingFormation
    
    if (shouldHide) {
      document.body.style.overflow = 'hidden'
      if (navBar) { navBar.style.opacity = '0'; navBar.style.pointerEvents = 'none'; }
    } else {
      document.body.style.overflow = ''
      if (navBar) { navBar.style.opacity = ''; navBar.style.pointerEvents = ''; }
    }
    return () => {
      document.body.style.overflow = ''
      if (navBar) { navBar.style.opacity = ''; navBar.style.pointerEvents = ''; }
    }
  }, [commentaryStep, isSelectingPlayer, isSelectingFormation])

  const actionTypes = [
    { label: 'FULLTIME', icon: MessageSquare },
    { label: 'HALFTIME', icon: Clock },
    { label: 'PENALTY', icon: BarChart2 },
    { label: 'ATTEMPT MISSED', icon: AlertTriangle },
    { label: 'SUBSTITUTION', icon: Repeat },
    { label: 'RED CARD', icon: Square, color: 'text-red-500' },
    { label: 'YELLOW CARD', icon: Square, color: 'text-yellow-500' },
    { label: 'GOAL', icon: Trophy },
    { label: 'START', icon: Play },
    { label: 'CUSTOM', icon: Edit2 },
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
    <div className={`bg-[#0F111A] text-white relative flex flex-col ${activeTab === 'commentary' ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-[#0F111A]/80 backdrop-blur-md z-40 shrink-0">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full border border-white/10 text-white/60 hover:text-white transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-chakra font-black text-xl uppercase tracking-tight">{isLive ? 'Live Game' : 'Match Details'}</h1>
        <button className="w-10 h-10 flex items-center justify-center rounded-full border border-white/10 text-white/60 hover:text-white transition-colors">
          <Info size={20} />
        </button>
      </header>

      <main className={`px-6 flex flex-col flex-1 overflow-hidden ${activeTab === 'lineup' ? 'space-y-8 overflow-y-auto pb-20' : ''}`}>
        <section className="flex flex-col items-center space-y-6 pt-4 shrink-0">
          <div className="text-center">
            <span className={`font-chakra font-black text-[12px] uppercase tracking-widest ${isLive ? 'text-[#00FF85] animate-pulse' : 'text-white/40'}`}>
              {fixture.status === 'live' ? 'Live' : fixture.status === 'completed' ? 'Full Time' : 'Scheduled'}
            </span>
          </div>

          <div className="flex items-center justify-around w-full max-w-md px-4 gap-x-2">
             <div className="flex flex-col items-center gap-1 flex-1">
                <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 shadow-2xl backdrop-blur-sm overflow-hidden flex items-center justify-center">
                   {teamA?.logoUrl ? (
                      <img src={teamA.logoUrl} className="w-full h-full object-cover" alt="" />
                   ) : (
                      <Trophy size={28} className="text-white/10" />
                   )}
                </div>
                <span className="text-[11px] font-chakra font-black text-gaffer-orange uppercase text-center mt-2">{teamA?.name || 'TBC'}</span>
             </div>
             <div className="flex flex-col items-center justify-center min-w-[80px]">
                <div className="flex items-center gap-4">
                   <span className="font-chakra font-black text-5xl text-white tracking-tighter">{fixture.score?.home ?? 0}</span>
                   <span className="text-white/20 font-chakra font-black text-3xl">-</span>
                   <span className="font-chakra font-black text-5xl text-white tracking-tighter">{fixture.score?.away ?? 0}</span>
                </div>
             </div>
             <div className="flex flex-col items-center gap-1 flex-1">
                <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 shadow-2xl backdrop-blur-sm overflow-hidden flex items-center justify-center">
                   {teamB?.logoUrl ? (
                      <img src={teamB.logoUrl} className="w-full h-full object-cover" alt="" />
                   ) : (
                      <Trophy size={28} className="text-white/10" />
                   )}
                </div>
                <span className="text-[11px] font-chakra font-black text-blue-400 uppercase text-center mt-2">{teamB?.name || 'TBC'}</span>
             </div>
          </div>

          <div className="flex flex-col items-center gap-2 pt-4">
            <label className="relative inline-flex items-center cursor-pointer scale-110">
              <input type="checkbox" className="sr-only peer" checked={isLive} onChange={(e) => toggleMutation.mutate(e.target.checked)} disabled={toggleMutation.isPending} />
              <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">
               {toggleMutation.isPending ? 'Updating...' : 'Go Live'}
            </span>
          </div>
        </section>

        <div className="flex border-b border-white/5 shrink-0">
          <button onClick={() => setActiveTab('lineup')} className={`flex-1 py-4 font-chakra font-black text-sm uppercase tracking-wider transition-colors ${activeTab === 'lineup' ? 'text-white' : 'text-white/40'}`}>Line-up</button>
          <button onClick={() => setActiveTab('commentary')} className={`flex-1 py-4 font-chakra font-black text-sm uppercase tracking-wider transition-colors ${activeTab === 'commentary' ? 'text-white' : 'text-white/40'}`}>Commentary</button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'lineup' ? (
            <motion.div key="lineup" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              {/* Away Team Header */}
              <div className="flex items-center justify-between px-1">
                 <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-white/5 overflow-hidden border border-white/10">
                       <img src={teamB?.logoUrl || "/images/mc_logo.png"} className="w-full h-full object-cover" alt="" />
                    </div>
                    <span className="font-chakra font-black text-[11px] uppercase text-white/80">{teamB?.name || 'AWAY TEAM'}</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <button onClick={() => setIsSelectingFormation('away')} className="flex items-center gap-2 group">
                      <span className="text-[10px] font-chakra font-black text-white/30 uppercase group-hover:text-white transition-colors">{awayFormation}</span>
                      <ChevronDown size={12} className="text-white/20 group-hover:text-white transition-colors" />
                    </button>
                 </div>
              </div>

              {/* Pitch Rendering */}
              <div className="w-full relative shadow-2xl rounded-[16px] overflow-hidden bg-[#1E212D] border-[1.5px] border-white/20" style={{ height: '760px' }}>
                <div className="absolute inset-x-3 inset-y-4 pointer-events-none">
                   <div className="w-full h-full border-[1.5px] border-white/40 rounded-sm relative">
                      <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-white/40 -translate-y-1/2" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-[1.5px] border-white/40 rounded-full" />
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 border-[1.5px] border-t-0 border-white/40" />
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-8 border-[1.5px] border-t-0 border-white/40" />
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-20 border-[1.5px] border-b-0 border-white/40" />
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-8 border-[1.5px] border-b-0 border-white/40" />
                   </div>
                </div>

                <div className="absolute inset-0">
                  {formations[homeFormation].map((pos, idx) => {
                    const scaledTop = 52 + (pos.t / 2.2)
                    return (
                      <div key={`h-${idx}`} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ top: `${scaledTop}%`, left: `${pos.l}%` }}>
                        <PitchSlot 
                          player={homeLineup[idx]}
                          color="rgba(255, 77, 0, 0.15)" 
                          border="#FF4D00"
                          iconColor="text-gaffer-orange"
                          onClick={() => setIsSelectingPlayer({ team: 'home', idx })}
                        />
                      </div>
                    )
                  })}
                  {formations[awayFormation].map((pos, idx) => {
                    const scaledTop = (100 - pos.t) / 2.2 + 2
                    return (
                      <div key={`a-${idx}`} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ top: `${scaledTop}%`, left: `${pos.l}%` }}>
                        <PitchSlot 
                          player={awayLineup[idx]}
                          color="rgba(96, 165, 250, 0.15)" 
                          border="#60A5FA"
                          iconColor="text-blue-400"
                          onClick={() => setIsSelectingPlayer({ team: 'away', idx })}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Home Team Footer */}
              <div className="flex items-center justify-between px-1">
                 <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-white/5 overflow-hidden border border-white/10">
                       <img src={teamA?.logoUrl || "/images/barca_logo.png"} className="w-full h-full object-cover" alt="" />
                    </div>
                    <span className="font-chakra font-black text-[11px] uppercase text-white/80">{teamA?.name || 'HOME TEAM'}</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <button onClick={() => setIsSelectingFormation('home')} className="flex items-center gap-2 group">
                      <span className="text-[10px] font-chakra font-black text-white/30 uppercase group-hover:text-white transition-colors">{homeFormation}</span>
                      <ChevronDown size={12} className="text-white/20 group-hover:text-white transition-colors" />
                    </button>
                 </div>
              </div>

              <div className="pb-10 pt-4">
                 <GradientButton 
                   onClick={() => saveLineupMutation.mutate()}
                   loading={saveLineupMutation.isPending}
                   className="h-14 w-full rounded-xl font-chakra font-black text-lg uppercase tracking-wider bg-gradient-to-r from-[#FF0000] to-[#FF8A00]"
                 >
                   Save
                 </GradientButton>
              </div>

              <AnimatePresence>
                {isSelectingPlayer && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[999] flex items-end justify-center px-4 pb-10">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsSelectingPlayer(null)} />
                    <motion.div initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }} className="bg-[#1C1F2D] w-full max-w-md rounded-[32px] border border-white/10 z-10 max-h-[70vh] flex flex-col shadow-2xl relative">
                      <div className="p-8 border-b border-white/5 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full border border-white/10 bg-[#0F111A] overflow-hidden flex items-center justify-center">
                               <img src={(isSelectingPlayer.team === 'home' ? teamA : teamB)?.logoUrl || "/images/mc_logo.png"} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="space-y-1">
                               <h3 className="font-chakra font-black text-lg uppercase tracking-tight">Assign Player</h3>
                               <p className="text-[11px] text-white/30 font-bold uppercase tracking-widest">
                                 {(isSelectingPlayer.team === 'home' ? teamA : teamB)?.name || 'TBC'} Squad
                               </p>
                            </div>
                         </div>
                         <button onClick={() => setIsSelectingPlayer(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/40"><X size={20} /></button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar min-h-[400px]">
                        {isSquadLoading ? (
                          <div className="flex flex-col items-center justify-center py-20 text-white/20">
                            <div className="w-8 h-8 border-2 border-gaffer-orange/30 border-t-gaffer-orange rounded-full animate-spin mb-4" />
                            <p className="font-chakra font-black text-sm uppercase">Loading Squad Roster...</p>
                          </div>
                        ) : (
                          <>
                            {(isSelectingPlayer.team === 'home' ? flattenedHomeSquad : flattenedAwaySquad)
                              ?.map((player) => {
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
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
                                      {(player.photoUrl || player.photo) ? (
                                        <img src={player.photoUrl || player.photo} className="w-full h-full object-cover" alt="" />
                                      ) : (
                                        <div className={`w-full h-full flex items-center justify-center font-chakra font-black text-xs ${isSelectingPlayer.team === 'home' ? 'text-gaffer-orange/40' : 'text-blue-400/40'}`}>
                                          GAF
                                        </div>
                                      )}
                                    </div>
                                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-[#1C1F2D] flex items-center justify-center font-chakra font-black text-[10px] ${isSelectingPlayer.team === 'home' ? 'bg-gaffer-orange text-white' : 'bg-blue-500 text-white'}`}>
                                      {player.jerseyNumber || '?'}
                                    </div>
                                  </div>
                                  <div className="flex-1 text-left">
                                    <h4 className="font-chakra font-black text-white text-base uppercase leading-tight">{player.firstName} {player.lastName}</h4>
                                    <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mt-0.5">{player.position || player.role || 'PLAYER'}</p>
                                  </div>
                                </div>
                                {!isAssigned && <Plus size={20} className="text-white/40 group-hover:text-white transition-colors" />}
                              </button>
                            )
                          })}
                            {(isSelectingPlayer.team === 'home' ? flattenedHomeSquad : flattenedAwaySquad)?.length === 0 && (
                              <div className="flex flex-col items-center justify-center py-20 text-white/20">
                                <Info size={40} className="mb-4" />
                                <p className="font-chakra font-black text-sm uppercase text-center">No players found in {isSelectingPlayer.team === 'home' ? 'home' : 'away'} squad</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest mt-2 px-10 text-center text-white/10">HomeID: {homeId}</p>
                              </div>
                            )}
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
                          <h3 className="font-chakra font-black text-xs uppercase tracking-widest text-white/40">Select Formation</h3>
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
                              className={`w-full py-4 rounded-2xl font-chakra font-black text-lg uppercase transition-all mb-1 last:mb-0 ${
                                (isSelectingFormation === 'home' ? homeFormation : awayFormation) === form 
                                  ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-950/20' 
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
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Commentary Feed - Real Events */}
              <div className={`flex-1 overflow-y-auto space-y-4 pt-4 pb-32 no-scrollbar transition-all duration-300 ${commentaryStep !== 'idle' ? 'opacity-10 blur-md pointer-events-none' : ''}`}>
                {isEventsLoading && (
                  <div className="flex items-center justify-center py-16 text-white/30">
                    <p className="font-chakra font-black text-xs uppercase animate-pulse">Loading events...</p>
                  </div>
                )}
                {!isEventsLoading && events.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-white/20">
                    <MessageSquare size={40} className="mb-4" />
                    <p className="font-chakra font-black text-sm uppercase">No events yet</p>
                    <p className="text-[11px] font-bold uppercase tracking-widest mt-1">Tap + to log the first event</p>
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
                    className="fixed inset-0 z-50 flex flex-col items-end justify-end p-6 pb-[220px]"
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
                                 <h2 className="text-4xl font-chakra font-black uppercase italic mt-4" style={{ color: '#FFF', textShadow: '0 4px 0 #EA580C, 0 8px 30px rgba(0,0,0,0.5)' }}>GOAL</h2>
                              </div>
                            ) : selectedAction === 'SUBSTITUTION' ? (
                              <div className="flex flex-col items-center">
                                 <div className="relative w-[300px] h-[360px]">
                                    <img src="/images/commentary/substitution.png" className="w-full h-full object-contain" alt="Sub" />
                                    <div className="absolute top-[34%] left-1/2 -translate-x-1/2 flex gap-10">
                                       <div className="w-16 h-20 bg-black/40 rounded flex items-center justify-center border border-white/5"><span className="text-yellow-400 font-chakra font-black text-4xl">12</span></div>
                                       <div className="w-16 h-20 bg-black/40 rounded flex items-center justify-center border border-white/5"><span className="text-yellow-400 font-chakra font-black text-4xl">9</span></div>
                                    </div>
                                 </div>
                                 <h2 className="text-4xl font-chakra font-black uppercase italic mt-4" style={{ color: '#FFF', textShadow: '0 4px 0 #EA580C, 0 8px 30px rgba(0,0,0,0.5)' }}>SUBSTITUTION</h2>
                              </div>
                            ) : selectedAction === 'ATTEMPT MISSED' ? (
                              <div className="flex flex-col items-center">
                                 <div className="relative w-80 h-56 mb-8">
                                    <img src="/images/commentary/goalpost.png" className="w-full h-full object-contain opacity-60" alt="" />
                                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-red-600 font-chakra font-black text-5xl italic drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]">X</span>
                                 </div>
                                 <h2 className="text-2xl font-chakra font-black uppercase italic" style={{ color: '#FFF', textShadow: '0 4px 0 #EA580C, 0 8px 30px rgba(0,0,0,0.5)' }}>ATTEMPT MISSED</h2>
                              </div>
                            ) : (selectedAction === 'YELLOW CARD' || selectedAction === 'RED CARD') ? (
                              <div className="flex flex-col items-center">
                                 <img 
                                   src={selectedAction === 'RED CARD' ? "/images/commentary/card.png" : "/images/commentary/yellow_card.png"} 
                                   className="w-48 h-60 object-contain" 
                                   alt="Card" 
                                 />
                                 <h2 className="text-4xl font-chakra font-black uppercase italic mt-8" style={{ color: '#FFF', textShadow: `0 4px 0 ${selectedAction === 'RED CARD' ? '#DC2626' : '#EAB308'}, 0 8px 30px rgba(0,0,0,0.5)` }}>{selectedAction}</h2>
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
                        <div className="flex flex-col items-end gap-3 w-full max-h-[60vh] overflow-y-auto no-scrollbar pb-10 pr-1">
                          {actionTypes.slice().reverse().map((action, idx) => (
                            <motion.button
                              key={action.label}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              onClick={() => {
                                setSelectedAction(action.label)
                                if (NEEDS_TEAM_PLAYER.includes(action.label) || NEEDS_TEXT.includes(action.label)) {
                                  setCommentaryStep('minute')
                                } else {
                                  // Simple match markers (halftime, fulltime, start)
                                  recordEventMutation.mutate({
                                    type: ACTION_TYPE_MAP[action.label] || 'custom',
                                    minute: 0,
                                    teamId: homeId || '',
                                  })
                                }
                              }}
                              className="flex items-center gap-3 px-4 py-2.5 bg-[#4A4646] rounded-[14px] border border-white/5 text-white shadow-xl active:scale-95 transition-all"
                            >
                              <action.icon size={18} className={action.color} />
                              <span className="font-chakra font-black text-[12px] uppercase tracking-wider">{action.label}</span>
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
                          <span className="font-chakra font-black text-xs uppercase text-white/40 pr-1">MATCH MINUTE</span>
                          <input
                            type="number"
                            min="0"
                            max="200"
                            placeholder="e.g. 34"
                            value={matchMinute}
                            onChange={e => setMatchMinute(e.target.value)}
                            className="w-full bg-[#1C1F2D] border border-white/10 rounded-2xl px-5 py-4 font-chakra font-black text-2xl text-white text-right outline-none focus:border-orange-500 transition-colors"
                            autoFocus
                          />
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              if (!matchMinute) return
                              if (selectedAction === 'CUSTOM') {
                                setCommentaryStep('custom')
                              } else {
                                setCommentaryStep('team')
                              }
                            }}
                            className="w-full px-4 py-3 bg-gradient-to-r from-[#FF8A00] to-[#FF0000] rounded-2xl font-chakra font-black text-sm uppercase tracking-wider text-white"
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
                          <span className="font-chakra font-black text-xs uppercase text-white/40 pr-1">CUSTOM COMMENTARY</span>
                          <textarea
                            placeholder="Type here..."
                            rows={4}
                            value={commentaryText}
                            onChange={e => setCommentaryText(e.target.value)}
                            className="w-full bg-[#1C1F2D] border border-white/10 rounded-2xl px-5 py-4 font-chakra font-bold text-sm text-white outline-none focus:border-orange-500 transition-colors resize-none"
                            autoFocus
                          />
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            disabled={!commentaryText || recordEventMutation.isPending}
                            onClick={() => {
                              recordEventMutation.mutate({
                                type: 'custom',
                                minute: parseInt(matchMinute) || 0,
                                teamId: homeId || '', // use home as default
                                notes: commentaryText,
                                commentaryText: commentaryText,
                              })
                            }}
                            className="w-full px-4 py-3 bg-gradient-to-r from-[#00A1D1] to-[#00A1D1]/60 rounded-2xl font-chakra font-black text-sm uppercase tracking-wider text-white disabled:opacity-30"
                          >
                            {recordEventMutation.isPending ? 'Publishing...' : 'Publish to Feed'}
                          </motion.button>
                        </motion.div>
                      )}

                      {commentaryStep === 'team' && (
                        <div className="flex flex-col items-end gap-3 w-full">
                          <span className="font-chakra font-black text-xs uppercase text-white/40 mb-1 pr-1">PICK TEAM</span>
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
                              className="flex items-center gap-3 w-full max-w-[150px] px-4 py-3 bg-[#FFFFFF1A] backdrop-blur-md rounded-2xl border border-white/10 group active:scale-95 transition-all text-left"
                            >
                              <div className="w-6 h-6 rounded-full bg-white/10 overflow-hidden">
                                {team?.logoUrl 
                                  ? <img src={team.logoUrl} className="w-full h-full object-contain" alt="" />
                                  : <Trophy size={14} className="text-white/40 m-auto mt-1" />
                                }
                              </div>
                              <span className="text-white font-chakra font-bold text-xs uppercase tracking-widest group-hover:text-orange-500 transition-colors">{team?.name || (key === 'home' ? 'Home' : 'Away')}</span>
                            </motion.button>
                          ))}
                        </div>
                      )}

                      {(commentaryStep === 'scorer' || commentaryStep === 'assist') && (
                        <div className="flex flex-col items-end gap-3 w-full max-h-[60vh] overflow-y-auto no-scrollbar pb-10 pr-1">
                          <span className="font-chakra font-black text-xs uppercase text-white/40 mb-1 pr-1">
                            {selectedAction === 'SUBSTITUTION' 
                              ? (commentaryStep === 'scorer' ? 'PLAYER OUT' : 'PLAYER IN')
                              : selectedAction?.includes('CARD') 
                                ? 'SELECT PLAYER' 
                                : (commentaryStep === 'scorer' ? 'GOAL SCORER' : 'ASSIST (optional)')
                            }
                          </span>
                          {/* Optional skip for assist */}
                          {commentaryStep === 'assist' && (
                            <motion.button
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              onClick={() => {
                                // Submit without assist
                                recordEventMutation.mutate({
                                  type: ACTION_TYPE_MAP[selectedAction!] || 'custom',
                                  minute: parseInt(matchMinute) || 0,
                                  teamId: selectedTeamId || homeId || '',
                                  playerId: selectedScorer?._id,
                                })
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-white/40 text-xs font-chakra font-black uppercase"
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
                                  // Single player event (card, attempt)
                                  recordEventMutation.mutate({
                                    type: ACTION_TYPE_MAP[selectedAction!] || 'custom',
                                    minute: parseInt(matchMinute) || 0,
                                    teamId: selectedTeamId || homeId || '',
                                    playerId: player._id,
                                  })
                                } else {
                                  // assist / player-in step
                                  const isSub = selectedAction === 'SUBSTITUTION'
                                  recordEventMutation.mutate({
                                    type: ACTION_TYPE_MAP[selectedAction!] || 'custom',
                                    minute: parseInt(matchMinute) || 0,
                                    teamId: selectedTeamId || homeId || '',
                                    playerId: isSub ? undefined : selectedScorer?._id,
                                    // For substitutions: scorer = out, current_selection = in
                                    playerOutId: isSub ? selectedScorer?._id : undefined,
                                    playerInId: isSub ? player._id : undefined,
                                    // For goals: scorer = scorer, current_selection = assist
                                    assistPlayerId: !isSub ? player._id : undefined,
                                  })
                                }
                              }}
                              className="flex items-center justify-between w-full max-w-[210px] px-4 py-2 bg-[#4A4646]/90 backdrop-blur-md rounded-[12px] border border-white/5 text-white shadow-xl active:scale-95 transition-all text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
                                  {(selectedTeam === 'home' ? teamA : teamB)?.logoUrl
                                    ? <img src={(selectedTeam === 'home' ? teamA : teamB)?.logoUrl} className="w-full h-full object-contain" alt="" />
                                    : <Trophy size={10} className="text-white/40" />
                                  }
                                </div>
                                <span className="font-chakra font-black text-[13px] uppercase tracking-wide">{player.firstName}</span>
                              </div>
                              <span className="text-[10px] font-bold text-white/40 uppercase pl-3">{player.position || 'PLR'}</span>
                            </motion.button>
                          ))}
                          {(!commentarySquad || commentarySquad.length === 0) && (
                            <div className="flex items-center justify-center w-full py-8 text-white/30">
                              <p className="font-chakra font-black text-xs uppercase">No players available</p>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                onClick={() => {
                  if (commentaryStep === 'idle') setCommentaryStep('menu')
                  else resetCommentary()
                }}
                className={`fixed bottom-32 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-[#FF8A00] to-[#FF0000] flex items-center justify-center text-white shadow-[0_10px_30px_rgba(255,138,0,0.4)] z-[60] active:scale-95 transition-all duration-500 ${commentaryStep !== 'idle' ? 'rotate-45' : ''}`}
              >
                <Plus size={32} strokeWidth={3} />
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
  const teamName = typeof event.teamId === 'object' ? event.teamId.name : 'Team'
  const playerName = (event.playerId && typeof event.playerId === 'object') ? `${event.playerId.firstName}` : 'Player'
  const assistPlayerName = (event.assistPlayerId && typeof event.assistPlayerId === 'object') ? `${event.assistPlayerId.firstName}` : null
  const playerInName = (event.playerInId && typeof event.playerInId === 'object') ? `${event.playerInId.firstName}` : null
  const playerOutName = (event.playerOutId && typeof event.playerOutId === 'object') ? `${event.playerOutId.firstName}` : null
  
  if (type === 'substitution') {
    return (
      <div className="bg-[#1C1F2D] rounded-[22px] px-6 py-5 flex flex-col gap-3 border border-white/5 relative group">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                <Repeat size={16} className="text-white/40" />
              </div>
              <p className="font-chakra font-black text-[12px] uppercase text-white/90">Substitution. {teamName}</p>
           </div>
           <Edit2 size={14} className="text-white/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
        </div>
        <div className="flex items-center gap-6 pl-11">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-[11px] font-bold text-white/40 uppercase">Out. {playerOutName || playerName}</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[11px] font-bold text-white/40 uppercase">In. {playerInName || 'Player'}</span>
           </div>
        </div>
        <span className="absolute top-5 right-6 text-[10px] font-bold text-white/20">{event.minute}&apos;</span>
      </div>
    )
  }

  if (type === 'goal') {
    return (
      <div className="bg-[#8E103E] rounded-[24px] px-6 py-5 flex flex-col gap-3 border border-white/5 shadow-xl relative group">
         <div className="flex items-center gap-4">
           <div className="w-8 h-8 flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full relative shadow-lg" />
           </div>
           <p className="font-chakra font-black text-[12px] uppercase tracking-wide text-white">GOAL. {playerName} ({teamName})</p>
         </div>
         {assistPlayerName && (
           <div className="flex items-center gap-4">
             <div className="w-8 h-8 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/40">
                   <path d="M4 16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v4z" />
                </svg>
             </div>
             <p className="font-chakra font-black text-[11px] uppercase tracking-widest text-white/50">ASSIST. {assistPlayerName}</p>
           </div>
         )}
         <span className="absolute top-5 right-6 text-[10px] font-bold text-white/30">{event.minute}&apos;</span>
      </div>
    )
  }

  if (type === 'attempt_missed') {
    return (
      <div className="bg-[#5AA1D1] rounded-[18px] px-6 py-4 flex items-center justify-between border border-white/5 shadow-lg relative">
         <p className="text-[#0A1D2D] font-chakra font-bold text-[11px] leading-relaxed uppercase pr-10">
           Attempt missed. {playerName} ({teamName}) header from the center of the box is close, but misses.
         </p>
         <span className="absolute top-4 right-6 text-[10px] font-bold text-[#0A1D2D]/60 whitespace-nowrap">{event.minute}&apos;</span>
      </div>
    )
  }
  
  if (type === 'yellow_card' || type === 'red_card') {
    const isRed = type === 'red_card'
    return (
      <div className={`rounded-[22px] px-6 py-5 flex flex-col gap-3 border border-white/5 relative group ${isRed ? 'bg-red-900/40' : 'bg-[#1C1F2D]'}`}>
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded flex items-center justify-center ${isRed ? 'bg-red-500' : 'bg-yellow-500'}`}>
                <Square size={14} fill="currentColor" stroke="none" />
              </div>
              <p className="font-chakra font-black text-[12px] uppercase text-white/90">{type.replace('_', ' ')}. {playerName}</p>
           </div>
        </div>
        <p className="text-[11px] font-bold text-white/40 uppercase pl-11">({teamName})</p>
        <span className="absolute top-5 right-6 text-[10px] font-bold text-white/20">{event.minute}&apos;</span>
      </div>
    )
  }

  // Fallback for other event types
  return (
    <div className="bg-[#1C1F2D] rounded-[18px] px-6 py-4 flex items-center justify-between border border-white/5 relative">
       <div className="flex items-center gap-3">
          <MessageSquare size={14} className="text-white/20" />
          <p className="font-chakra font-black text-[11px] leading-relaxed uppercase pr-10 text-white/60">
            {type === 'custom' ? '' : `${type.replace('_', ' ')}. `}
            {event.commentaryText || event.notes || teamName}
          </p>
       </div>
       <span className="absolute top-4 right-6 text-[10px] font-bold text-white/20 whitespace-nowrap">{event.minute}&apos;</span>
    </div>
  )
}

function PitchSlot({ color, border, iconColor, player, onClick }: { 
  color: string, 
  border: string, 
  iconColor: string, 
  player?: any,
  onClick: () => void 
}) {
  return (
    <div onClick={onClick} className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform cursor-pointer">
      <div className="w-11 h-11 rounded-full border-[1.5px] flex items-center justify-center text-white shadow-xl backdrop-blur-sm relative group overflow-hidden" style={{ backgroundColor: color, borderColor: `${border}99` }}>
        {player ? (
           <div className="w-full h-full flex items-center justify-center bg-black/20">
              <span className="font-chakra font-black text-sm">{player.jerseyNumber || player.firstName?.[0] || '?'}</span>
           </div>
        ) : (
          <Plus size={14} className={`${iconColor} group-hover:scale-125 transition-transform`} />
        )}
      </div>
      <div className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/5 min-w-[44px] text-center mt-0.5">
        <span className="text-[8px] font-chakra font-black text-white/50 uppercase tracking-tighter truncate block w-full whitespace-nowrap">
           {player ? player.firstName : '-'}
        </span>
      </div>
    </div>
  )
}
