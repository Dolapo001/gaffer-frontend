'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, Info, Plus, MessageSquare, Clock, BarChart2,
  AlertTriangle, Repeat, Square, Play, Edit2, Trophy, X, ChevronDown
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { GradientButton } from '@/components/GradientButton'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getFixture, startMatch, cancelLive, updateFixture, listEvents, listLineups, saveLineup, recordEvent, teamsWithoutApprovedLineup, type FixtureEvent } from '@/lib/services/fixture.service'
import { deleteMatchEvent } from '@/lib/services/match.service'
import { listPlayers, getTeam } from '@/lib/services/team.service'
import { useToast } from '@/store/toastStore'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { PositionFilterBar, type PositionFilterValue } from '@/components/PositionFilterBar'
import { CommentaryIcon } from '@/components/CommentaryIcon'
import { calculatePlayerRating, eventsForPlayer } from '@/lib/ratingsEngine'

const POSITION_NORMALIZE: Record<string, PositionFilterValue> = {
  goalkeeper: 'GK', gk: 'GK',
  defender: 'DEF', def: 'DEF', 'center-back': 'DEF', 'centre-back': 'DEF', 'full-back': 'DEF', cb: 'DEF', rb: 'DEF', lb: 'DEF',
  midfielder: 'MID', mid: 'MID', mf: 'MID', cm: 'MID', dm: 'MID', am: 'MID',
  forward: 'FWD', fwd: 'FWD', fw: 'FWD', st: 'FWD', cf: 'FWD', lw: 'FWD', rw: 'FWD',
}
function normalizeAdminPosition(pos?: string): PositionFilterValue | '' {
  if (!pos) return ''
  return POSITION_NORMALIZE[pos.trim().toLowerCase()] || ''
}

export function AdminLiveMatchDetails({ id }: { id: string }) {
  const router = useRouter()
  const { addToast } = useToast()
  const { hideNavbar, showNavbar } = useUIStore()
  const queryClient = useQueryClient()
  const hasHydrated = useRef(false)

  const [activeTab, setActiveTab] = useState<'lineup' | 'commentary'>('lineup')
  const [showFulltimeConfirm, setShowFulltimeConfirm] = useState(false)

  // Progressive Flow State
  type FlowStep = 'idle' | 'category' | 'team' | 'scorer' | 'assistYesNo' | 'assist' | 'penaltyPending' | 'penaltyOutcome' | 'penaltyTaker' | 'penaltyGK' | 'cardPlayer' | 'cardType' | 'subOut' | 'subIn' | 'matchStatus' | 'custom' | 'minute'
  const [flowStep, setFlowStep] = useState<FlowStep>('idle')
  const [selectedCategory, setSelectedCategory] = useState<'GOAL' | 'PENALTY' | 'CARD' | 'SUBSTITUTION' | 'MATCH_STATUS' | 'CUSTOM' | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away' | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null)
  const [selectedPlayerOut, setSelectedPlayerOut] = useState<any | null>(null)
  const [penaltyOutcome, setPenaltyOutcome] = useState<'scored' | 'missed' | 'saved' | null>(null)
  const [matchMinute, setMatchMinute] = useState<string>('')
  const [customText, setCustomText] = useState('')

  const resetFlow = () => {
    setFlowStep('idle')
    setSelectedCategory(null)
    setSelectedTeam(null)
    setSelectedPlayer(null)
    setSelectedPlayerOut(null)
    setPenaltyOutcome(null)
    setMatchMinute('')
    setCustomText('')
  }

  const [homeFormation, setHomeFormation] = useState<'4-4-2' | '4-3-3' | '3-5-2'>('4-3-3')
  const [awayFormation, setAwayFormation] = useState<'4-4-2' | '4-3-3' | '3-5-2'>('4-3-3')
  const [isSelectingFormation, setIsSelectingFormation] = useState<'home' | 'away' | null>(null)
  const [homeLineup, setHomeLineup] = useState<Record<number, any>>({})
  const [awayLineup, setAwayLineup] = useState<Record<number, any>>({})
  const [isSelectingPlayer, setIsSelectingPlayer] = useState<{ team: 'home' | 'away', idx: number } | null>(null)
  const [assignPositionFilter, setAssignPositionFilter] = useState<PositionFilterValue>('ALL')
  const [slotContextMenu, setSlotContextMenu] = useState<{ team: 'home' | 'away', idx: number, player: any } | null>(null)
  const [isLineupDirty, setIsLineupDirty] = useState(false)
  const [ratingInput, setRatingInput] = useState<string>('')

  const updateSlotRating = (team: 'home' | 'away', idx: number, newRating: number) => {
    const clamped = Math.min(10.0, Math.max(1.0, Number(newRating.toFixed(1))))
    if (team === 'home') {
      setHomeLineup((prev) => ({
        ...prev,
        [idx]: { ...prev[idx], rating: clamped },
      }))
    } else {
      setAwayLineup((prev) => ({
        ...prev,
        [idx]: { ...prev[idx], rating: clamped },
      }))
    }
    setIsLineupDirty(true)
    addToast(`Rating set to ${clamped}`, 'success')
    // Automatically persist rating change to database immediately
    setTimeout(() => {
      saveLineupMutation.mutate()
    }, 150)
  }

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

  // Teams without an approved lineup when the admin tries to go live. It's a
  // warning, not a block: grassroots admins must still be able to start.
  const [missingLineups, setMissingLineups] = useState<string[] | null>(null)
  const [checkingLineups, setCheckingLineups] = useState(false)

  const toggleMutation = useMutation({
    mutationFn: async (live: boolean) => {
      if (live) {
        return startMatch(id)
      }
      return cancelLive(id)
    },
    onSuccess: (_, live) => {
      queryClient.invalidateQueries({ queryKey: ['fixture', id] })
      addToast(live ? "Match is now LIVE!" : "Match scheduled.", "success")
    },
    onError: (err: any) => addToast(err?.message || "Failed to update status", "error")
  })

  const handleGoLiveToggle = async (next: boolean) => {
    if (!next) {
      // Once anything has been recorded the match can only be ended with Full time
      if (matchHasEvents) {
        addToast('This match has events recorded. End it with Full time instead of switching it off.', 'error')
        return
      }
      return toggleMutation.mutate(false)
    }
    setCheckingLineups(true)
    const names = {
      home: typeof fixture?.homeTeamId === 'object' ? (fixture.homeTeamId as any).name : 'Home',
      away: typeof fixture?.awayTeamId === 'object' ? (fixture.awayTeamId as any).name : 'Away',
    }
    const missing = await teamsWithoutApprovedLineup(id, names)
    setCheckingLineups(false)
    if (missing.length) setMissingLineups(missing)
    else toggleMutation.mutate(true)
  }

  // 2.1 Save Lineup — POST /fixtures/:id/lineups (once per team)
  const saveLineupMutation = useMutation({
    mutationFn: async () => {
      // Extract unique, valid player IDs from the lineup slots
      const getLineupArray = (lineup: Record<number, any>, formation: string): string[] => {
        const slotCount = formations[formation as keyof typeof formations]?.length || 11
        const seen = new Set<string>()
        const arr: string[] = []
        for (let i = 0; i < slotCount; i++) {
          const p = lineup[i]
          const id = p?._id || p?.id || (typeof p === 'string' ? p : null)
          if (id && id.trim() !== '' && !seen.has(id)) {
            seen.add(id)
            arr.push(id)
          }
        }
        return arr
      }

      const saves: Promise<any>[] = []
      
      // 1. Save Formations to Fixture object (safely handled if live)
      saves.push(updateFixture(id, { 
        homeFormation, 
        awayFormation 
      }).catch((err) => {
        console.warn("Formation update non-critical warning:", err?.message)
        return null
      }))

      const getLineupSlots = (lineup: Record<number, any>) => {
        return Object.entries(lineup)
          .filter(([_, p]) => p?._id || p?.id)
          .map(([idx, p]) => {
            const jNum = parseInt(String(p.jerseyNumber))
            return {
              playerId: p._id || p.id,
              positionIndex: Number(idx),
              playerName: `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.name,
              position: p.position || 'PLAYER',
              jerseyNumber: isNaN(jNum) ? 0 : jNum,
              rating: p.rating != null ? p.rating : null,
            }
          })
      }

      const homeStarters = homeId ? getLineupArray(homeLineup, homeFormation) : []
      const awayStarters = awayId ? getLineupArray(awayLineup, awayFormation) : []
      const homeSlots = homeId ? getLineupSlots(homeLineup) : []
      const awaySlots = awayId ? getLineupSlots(awayLineup) : []

      if (homeId) {
        saves.push(saveLineup(id, { 
          teamId: homeId, 
          starters: homeStarters,
          slots: homeSlots
        }))
      }
      if (awayId) {
        saves.push(saveLineup(id, { 
          teamId: awayId, 
          starters: awayStarters,
          slots: awaySlots
        }))
      }
      return Promise.all(saves)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lineups', id] })
      queryClient.invalidateQueries({ queryKey: ['fixture', id] })
      setIsLineupDirty(false)
      addToast('Squad saved', 'success')
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


  // 1.3 Fetch Events (poll every 10s when live)
  const { data: rawEvents, isLoading: isEventsLoading } = useQuery({
    queryKey: ['events', id],
    queryFn: () => listEvents(id),
    enabled: !!id,
    refetchInterval: isLive ? 10_000 : false,
  })
  // Defensive: guarantees an array regardless of transient query state (e.g.
  // a cache slot briefly populated by something else) — this data drives
  // several `.filter()`/`.length` reads below and must never be non-array.
  const events = Array.isArray(rawEvents) ? rawEvents : []
  // Anything beyond the kick-off itself means the match is under way and can only end with Full time
  const matchHasEvents = events.some((e: any) => !['start', 'match_started'].includes(String(e.rawType || e.type || '').toLowerCase()))

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

  // Event/commentary pickers must only offer players actually in the match —
  // the assigned starting lineup plus anyone already subbed on — not the
  // full ~25-player roster. "On pitch" is derived by applying every
  // substitution recorded so far (in minute order) to the assigned lineup.
  const getOnPitch = (team: 'home' | 'away'): any[] => {
    const lineup = team === 'home' ? homeLineup : awayLineup
    const squad = team === 'home' ? flattenedHomeSquad : flattenedAwaySquad
    const teamId = team === 'home' ? homeId : awayId

    const onPitchIds = new Set<string>(
      Object.values(lineup).filter(Boolean).map((p: any) => String(p._id || p.id))
    )

    const subs = events
      .filter((e: any) => {
        const raw = e.rawType || e.type
        const tid = typeof e.teamId === 'string' ? e.teamId : e.teamId?._id
        return raw === 'substitution' && tid === teamId
      })
      .sort((a: any, b: any) => (a.minute ?? 0) - (b.minute ?? 0))

    subs.forEach((e: any) => {
      const outId = typeof e.playerOutId === 'string' ? e.playerOutId : e.playerOutId?._id
      const inId = typeof e.playerInId === 'string' ? e.playerInId : e.playerInId?._id
      if (outId) onPitchIds.delete(String(outId))
      if (inId) onPitchIds.add(String(inId))
    })

    return squad.filter((p: any) => onPitchIds.has(String(p._id)))
  }

  // For a substitution's "player in" step: the roster minus whoever is
  // currently on the pitch. This app doesn't have a separate "named bench"
  // concept beyond the starting XI + full roster, so this is the closest
  // faithful equivalent — it still guarantees a currently-playing player
  // can't be picked to come on for themselves.
  const getBench = (team: 'home' | 'away'): any[] => {
    const onPitch = getOnPitch(team)
    const onPitchIds = new Set(onPitch.map((p: any) => String(p._id)))
    const squad = team === 'home' ? flattenedHomeSquad : flattenedAwaySquad
    return squad.filter((p: any) => !onPitchIds.has(String(p._id)))
  }



  // Populate slot state from server lineup when the page first loads
  useEffect(() => {
    if (!existingLineups || !homeId || !awayId || isSquadLoading || hasHydrated.current) return

    const hydrateLineup = (serverData: any, squad: any[]) => {
      const mapped: Record<number, any> = {}
      if (!serverData) return mapped
      
      const slots = serverData.slots || []
      const players = serverData.players || (Array.isArray(serverData) ? serverData : [])

      // Prioritize SLOTS for exact positioning
      if (slots.length > 0) {
        slots.forEach((slot: any) => {
          if (!slot) return
          const pid = slot.playerId?._id || slot.playerId
          const found = squad.find(s => String(s._id) === String(pid))
          if (found) {
            mapped[slot.positionIndex] = {
              ...found,
              rating: slot.rating != null ? slot.rating : (found.rating ?? undefined)
            }
          }
        })
        return mapped
      }

      // Fallback to sequential players if slots aren't available
      if (players.length > 0) {
        players.forEach((p: any, i: number) => {
          if (!p) return
          const pid = typeof p === 'string' ? p : (p?._id || p?.id)
          const found = squad.find(s => String(s._id) === String(pid))
          if (found) {
            mapped[i] = {
              ...found,
              rating: p?.rating != null ? p.rating : (found.rating ?? undefined)
            }
          }
        })
      }
      return mapped
    }

    // Handle structured response: { homeTeam: { players: [...], slots: [...] }, awayTeam: { ... } }
    if (existingLineups?.homeTeam || existingLineups?.awayTeam) {
      if (Object.keys(homeLineup).length === 0) {
        const mapped = hydrateLineup(existingLineups.homeTeam || {}, flattenedHomeSquad)
        if (Object.keys(mapped).length) setHomeLineup(mapped)
      }
      if (Object.keys(awayLineup).length === 0) {
        const mapped = hydrateLineup(existingLineups.awayTeam || {}, flattenedAwaySquad)
        if (Object.keys(mapped).length) setAwayLineup(mapped)
      }

      // A lineup saved earlier but never confirmed is invisible to fans: offer Save again so it gets confirmed
      const pendingSide = (side: any) => side?.status === 'pending' && (side?.players?.length ?? 0) > 0
      if (pendingSide(existingLineups.homeTeam) || pendingSide(existingLineups.awayTeam)) setIsLineupDirty(true)

      // Also restore formations from the response if available
      if (existingLineups.homeTeam?.formation) setHomeFormation(existingLineups.homeTeam.formation as any)
      if (existingLineups.awayTeam?.formation) setAwayFormation(existingLineups.awayTeam.formation as any)
      
      hasHydrated.current = true
      return
    }

    // Legacy fallback: array of lineup objects
    if (Array.isArray(existingLineups)) {
      const homeServerLineup = existingLineups.find((l: any) => {
        const tid = (typeof l.teamId === 'object' && l.teamId !== null) ? (l.teamId as any)._id : l.teamId
        return tid === homeId
      })
      const awayServerLineup = existingLineups.find((l: any) => {
        const tid = (typeof l.teamId === 'object' && l.teamId !== null) ? (l.teamId as any)._id : l.teamId
        return tid === awayId
      })

      if (homeServerLineup?.starters?.length && Object.keys(homeLineup).length === 0) {
        const mapped = hydrateLineup(homeServerLineup.starters, flattenedHomeSquad)
        if (Object.keys(mapped).length) setHomeLineup(mapped)
      }
      if (awayServerLineup?.starters?.length && Object.keys(awayLineup).length === 0) {
        const mapped = hydrateLineup(awayServerLineup.starters, flattenedAwaySquad)
        if (Object.keys(mapped).length) setAwayLineup(mapped)
      }
      hasHydrated.current = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingLineups, homeId, awayId, isSquadLoading])
  const recordEventMutation = useMutation({
    mutationFn: (payload: any) => recordEvent(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events', id] })
      queryClient.invalidateQueries({ queryKey: ['fixture', id] })
      queryClient.invalidateQueries({ queryKey: ['fixtures'] })
      addToast('Event recorded', 'success')
      if (variables.type === 'penalty_awarded') {
        setFlowStep('penaltyOutcome')
      } else {
        resetFlow()
      }
    },
    onError: (err: any) => addToast(err?.message || 'Failed to record event', 'error')
  })



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

  // Slot assignment is local-state-only — no per-tap network request. The
  // whole lineup (both teams + formations) is persisted in one shot by
  // saveLineupMutation, triggered from the "Squad Saved" / "Save Squad"
  // button. This avoids firing a full lineup resubmission on every single
  // tap when building an XI, which was stalling into a request-timeout toast
  // even though the individual save had actually succeeded.
  const assignPlayer = (team: 'home' | 'away', idx: number, player: any) => {
    const lineup = team === 'home' ? { ...homeLineup } : { ...awayLineup }
    // If this player is already assigned to another slot, remove them from the old slot
    for (const key in lineup) {
      if (lineup[key]?._id && lineup[key]._id === player._id) {
        delete lineup[key]
      }
    }
    lineup[idx] = player
    if (team === 'home') setHomeLineup(lineup)
    else setAwayLineup(lineup)
    setIsSelectingPlayer(null)
    setSlotContextMenu(null)
    setIsLineupDirty(true)
  }

  const unassignPlayer = (team: 'home' | 'away', idx: number) => {
    const updated = team === 'home' ? { ...homeLineup } : { ...awayLineup }
    delete updated[idx]
    if (team === 'home') setHomeLineup(updated)
    else setAwayLineup(updated)
    setSlotContextMenu(null)
    setIsLineupDirty(true)
  }

  const handleSlotClick = (team: 'home' | 'away', idx: number) => {
    const lineup = team === 'home' ? homeLineup : awayLineup
    const player = lineup[idx]
    if (player) {
      // Slot is occupied — show context menu
      setSlotContextMenu({ team, idx, player })
    } else {
      // Slot is empty — open player picker directly
      setAssignPositionFilter('ALL')
      setIsSelectingPlayer({ team, idx })
    }
  }

  useEffect(() => {
    const shouldHide = flowStep !== 'idle' || !!isSelectingPlayer || !!isSelectingFormation || !!slotContextMenu

    if (!shouldHide) return
    document.body.style.overflow = 'hidden'
    hideNavbar()
    return () => {
      document.body.style.overflow = ''
      showNavbar()
    }
  }, [flowStep, isSelectingPlayer, isSelectingFormation, slotContextMenu, hideNavbar, showNavbar])

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
            {/* Home goals + red cards */}
            <div className="flex flex-col gap-0.5 items-start">
              {events
                .filter(e => {
                  const raw = (e as any).rawType || e.type
                  const tid = typeof e.teamId === 'string' ? e.teamId : (e.teamId as any)?._id
                  return (raw === 'goal' || raw === 'own_goal' || raw === 'penalty_scored') && tid === homeId
                })
                .map(s => (
                  <span key={(s as any)._id} className="text-[11px] font-inter font-bold text-white whitespace-nowrap">
                    {(s.playerId && typeof s.playerId === 'object') ? ((s.playerId as any).lastName || (s.playerId as any).firstName) : (s as any).playerName || 'Player'}{(s as any).rawType === 'penalty_scored' ? ' (P)' : (s as any).rawType === 'own_goal' ? ' (OG)' : ''} {s.minute}&apos;
                  </span>
                ))}
              {events
                .filter(e => {
                  const raw = (e as any).rawType || e.type
                  const tid = typeof e.teamId === 'string' ? e.teamId : (e.teamId as any)?._id
                  return raw === 'red_card' && tid === homeId
                })
                .map(s => (
                  <span key={`rc-${(s as any)._id}`} className="text-[11px] font-inter font-bold text-red-400 whitespace-nowrap flex items-center gap-1">
                    <span className="inline-block w-2 h-3 bg-red-500 rounded-[1px]" />
                    {(s.playerId && typeof s.playerId === 'object') ? ((s.playerId as any).lastName || (s.playerId as any).firstName) : (s as any).playerName || ''} {s.minute}&apos;
                  </span>
                ))}
            </div>
            {/* Away goals + red cards */}
            <div className="flex flex-col gap-0.5 items-end text-right">
              {events
                .filter(e => {
                  const raw = (e as any).rawType || e.type
                  const tid = typeof e.teamId === 'string' ? e.teamId : (e.teamId as any)?._id
                  return (raw === 'goal' || raw === 'own_goal' || raw === 'penalty_scored') && tid === awayId
                })
                .map(s => (
                  <span key={(s as any)._id} className="text-[11px] font-inter font-bold text-white whitespace-nowrap">
                    {(s.playerId && typeof s.playerId === 'object') ? ((s.playerId as any).lastName || (s.playerId as any).firstName) : (s as any).playerName || 'Player'}{(s as any).rawType === 'penalty_scored' ? ' (P)' : (s as any).rawType === 'own_goal' ? ' (OG)' : ''} {s.minute}&apos;
                  </span>
                ))}
              {events
                .filter(e => {
                  const raw = (e as any).rawType || e.type
                  const tid = typeof e.teamId === 'string' ? e.teamId : (e.teamId as any)?._id
                  return raw === 'red_card' && tid === awayId
                })
                .map(s => (
                  <span key={`rc-${(s as any)._id}`} className="text-[11px] font-inter font-bold text-red-400 whitespace-nowrap flex items-center justify-end gap-1">
                    {(s.playerId && typeof s.playerId === 'object') ? ((s.playerId as any).lastName || (s.playerId as any).firstName) : (s as any).playerName || ''} {s.minute}&apos;
                    <span className="inline-block w-2 h-3 bg-red-500 rounded-[1px]" />
                  </span>
                ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 pt-2">
            {fixture?.status === 'completed' ? (
              <span className="text-[10px] font-inter font-bold uppercase tracking-widest text-white/30">Match Ended</span>
            ) : (
              <>
                <label className={`relative inline-flex items-center scale-100 ${toggleMutation.isPending ? 'opacity-50' : 'cursor-pointer'}`}>
                  <input type="checkbox" className="sr-only peer" checked={isLive} onChange={(e) => handleGoLiveToggle(e.target.checked)} disabled={toggleMutation.isPending || checkingLineups || (isLive && matchHasEvents)} />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#22C55E]"></div>
                </label>
                <span className={`text-[10px] font-inter font-bold uppercase tracking-widest mt-1 ${isLive ? 'text-[#22C55E]' : 'text-[#FF5C00]'}`}>
                  {toggleMutation.isPending ? 'Updating...' : isLive ? 'Live' : 'Go Live'}
                </span>
                {isLive && matchHasEvents && (
                  <span className="text-[9px] font-inter font-semibold uppercase tracking-widest text-white/35 mt-0.5">End it with Full Time</span>
                )}
              </>
            )}
          </div>
        </section>

        <div className="flex border-b border-white/5 shrink-0">
          <button onClick={() => setActiveTab('lineup')} className={`flex-1 py-2.5 font-inter font-bold text-xs uppercase tracking-wider transition-colors ${activeTab === 'lineup' ? 'text-white border-b-2 border-[#FF5C00]' : 'text-white/40'}`}>Line-up</button>
          <button onClick={() => setActiveTab('commentary')} className={`flex-1 py-2.5 font-inter font-bold text-xs uppercase tracking-wider transition-colors ${activeTab === 'commentary' ? 'text-white border-b-2 border-[#FF5C00]' : 'text-white/40'}`}>Commentary</button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'lineup' ? (
            <motion.div key="lineup" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              {/* Pitch Visual */}
              <div className="space-y-2">
                {/* Away formation selector */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-inter font-bold uppercase tracking-widest text-blue-400/70">
                    {typeof fixture?.awayTeamId === 'object' ? ((fixture.awayTeamId as any).shortName || (fixture.awayTeamId as any).name) : 'Away'}
                  </span>
                  <button onClick={() => setIsSelectingFormation('away')} className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10 group">
                    <span className="text-[10px] font-inter font-bold text-white/60 uppercase tracking-widest">{awayFormation}</span>
                    <ChevronDown size={10} className="text-white/40 group-hover:text-white transition-colors" />
                  </button>
                </div>

                {/* Pitch */}
                <div
                  className="relative w-full rounded-2xl overflow-hidden border border-white/10"
                  style={{ backgroundColor: '#1e6b2e', aspectRatio: '0.65' }}
                >
                  {/* Pitch boundary */}
                  <div className="absolute inset-[3%] border border-white/20 pointer-events-none" />
                  {/* Center line */}
                  <div className="absolute left-[3%] right-[3%] bg-white/20 pointer-events-none" style={{ top: '50%', height: '1px' }} />
                  {/* Center circle */}
                  <div className="absolute border border-white/20 rounded-full pointer-events-none" style={{ width: '22%', aspectRatio: '1', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                  <div className="absolute w-1.5 h-1.5 bg-white/30 rounded-full pointer-events-none" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                  {/* Away penalty area (top) */}
                  <div className="absolute left-[28%] right-[28%] border border-white/20 pointer-events-none" style={{ top: '3%', height: '13%' }} />
                  {/* Away goal */}
                  <div className="absolute left-[40%] right-[40%] border-x border-b border-white/30 pointer-events-none" style={{ top: '3%', height: '4%' }} />
                  {/* Home penalty area (bottom) */}
                  <div className="absolute left-[28%] right-[28%] border border-white/20 pointer-events-none" style={{ bottom: '3%', height: '13%' }} />
                  {/* Home goal */}
                  <div className="absolute left-[40%] right-[40%] border-x border-t border-white/30 pointer-events-none" style={{ bottom: '3%', height: '4%' }} />

                  {/* Away players — t=88 (GK) maps near top, t=18 (FWD) maps near center */}
                  {(formations[awayFormation] || formations['4-3-3']).map(({ t, l }, idx) => {
                    const player = awayLineup[idx]
                    const pitchT = ((100 - t) / 100) * 47 + 2
                    const pId = player?._id || player?.id
                    const pEvts = eventsForPlayer(pId, events)
                    const r = calculatePlayerRating(player?.position || 'MID', pEvts, player?.rating)
                    const goalsCount = pEvts.filter((e) => {
                      const type = (e.type || e.rawType || '').toLowerCase()
                      return type === 'goal' || type === 'penalty_scored'
                    }).length
                    const assistsCount = pEvts.filter((e) => {
                      const type = (e.type || e.rawType || '').toLowerCase()
                      return type === 'assist'
                    }).length

                    return (
                      <button
                        key={`ap-${idx}`}
                        onClick={() => handleSlotClick('away', idx)}
                        style={{ position: 'absolute', top: `${pitchT}%`, left: `${l}%`, transform: 'translate(-50%, -50%)', zIndex: 10 }}
                        className="flex flex-col items-center gap-0.5 active:scale-95 transition-transform"
                      >
                        <div className={`relative w-7 h-7 rounded-full border-2 flex items-center justify-center font-inter font-bold text-[9px] shadow-lg ${player ? 'bg-blue-500 border-blue-300 text-white' : 'bg-black/50 border-white/30 text-white/40'}`}>
                          {player ? (player.jerseyNumber || '?') : <Plus size={10} />}
                          {player && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-white rounded-full border border-blue-400 flex items-center justify-center"><Edit2 size={5} className="text-blue-500" /></span>}
                          {goalsCount > 0 && (
                            <span className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-white rounded-full border border-black/40 flex items-center justify-center text-[8px] shadow-md">
                              ⚽
                            </span>
                          )}
                          {assistsCount > 0 && (
                            <span className="absolute -bottom-1 -left-1 px-1 bg-blue-600 rounded text-white font-extrabold text-[7px] leading-none shadow border border-white">
                              A
                            </span>
                          )}
                        </div>
                        {player && (
                          <div className="flex flex-col items-center gap-[1px]">
                            <span
                              className={`px-1 py-[0.5px] rounded font-extrabold text-[7.5px] leading-none shadow border border-black/30 ${
                                r >= 7.0
                                  ? 'bg-[#22c55e] text-white'
                                  : r >= 6.0
                                  ? 'bg-[#eab308] text-black'
                                  : 'bg-[#ef4444] text-white'
                              }`}
                            >
                              {r.toFixed(1)}
                            </span>
                            <span className="text-[7px] font-bold text-white/80 uppercase text-center leading-none max-w-[36px] truncate drop-shadow-sm">
                              {player.lastName || player.firstName}
                            </span>
                          </div>
                        )}
                      </button>
                    )
                  })}

                  {/* Home players — t=88 (GK) maps near bottom, t=18 (FWD) maps near center */}
                  {(formations[homeFormation] || formations['4-3-3']).map(({ t, l }, idx) => {
                    const player = homeLineup[idx]
                    const pitchT = 51 + (t / 100) * 47
                    const pId = player?._id || player?.id
                    const pEvts = eventsForPlayer(pId, events)
                    const r = calculatePlayerRating(player?.position || 'MID', pEvts, player?.rating)
                    const goalsCount = pEvts.filter((e) => {
                      const type = (e.type || e.rawType || '').toLowerCase()
                      return type === 'goal' || type === 'penalty_scored'
                    }).length
                    const assistsCount = pEvts.filter((e) => {
                      const type = (e.type || e.rawType || '').toLowerCase()
                      return type === 'assist'
                    }).length

                    return (
                      <button
                        key={`hp-${idx}`}
                        onClick={() => handleSlotClick('home', idx)}
                        style={{ position: 'absolute', top: `${pitchT}%`, left: `${l}%`, transform: 'translate(-50%, -50%)', zIndex: 10 }}
                        className="flex flex-col items-center gap-0.5 active:scale-95 transition-transform"
                      >
                        <div className={`relative w-7 h-7 rounded-full border-2 flex items-center justify-center font-inter font-bold text-[9px] shadow-lg ${player ? 'bg-[#FF5C00] border-orange-300 text-white' : 'bg-black/50 border-white/30 text-white/40'}`}>
                          {player ? (player.jerseyNumber || '?') : <Plus size={10} />}
                          {player && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-white rounded-full border border-orange-400 flex items-center justify-center"><Edit2 size={5} className="text-orange-500" /></span>}
                          {goalsCount > 0 && (
                            <span className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-white rounded-full border border-black/40 flex items-center justify-center text-[8px] shadow-md">
                              ⚽
                            </span>
                          )}
                          {assistsCount > 0 && (
                            <span className="absolute -bottom-1 -left-1 px-1 bg-blue-600 rounded text-white font-extrabold text-[7px] leading-none shadow border border-white">
                              A
                            </span>
                          )}
                        </div>
                        {player && (
                          <div className="flex flex-col items-center gap-[1px]">
                            <span
                              className={`px-1 py-[0.5px] rounded font-extrabold text-[7.5px] leading-none shadow border border-black/30 ${
                                r >= 7.0
                                  ? 'bg-[#22c55e] text-white'
                                  : r >= 6.0
                                  ? 'bg-[#eab308] text-black'
                                  : 'bg-[#ef4444] text-white'
                              }`}
                            >
                              {r.toFixed(1)}
                            </span>
                            <span className="text-[7px] font-bold text-white/80 uppercase text-center leading-none max-w-[36px] truncate drop-shadow-sm">
                              {player.lastName || player.firstName}
                            </span>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Home formation selector */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-inter font-bold uppercase tracking-widest text-[#FF5C00]/70">
                    {typeof fixture?.homeTeamId === 'object' ? ((fixture.homeTeamId as any).shortName || (fixture.homeTeamId as any).name) : 'Home'}
                  </span>
                  <button onClick={() => setIsSelectingFormation('home')} className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10 group">
                    <span className="text-[10px] font-inter font-bold text-white/60 uppercase tracking-widest">{homeFormation}</span>
                    <ChevronDown size={10} className="text-white/40 group-hover:text-white transition-colors" />
                  </button>
                </div>
              </div>

              <div className="pb-10 pt-4 px-2">
                 <GradientButton
                   onClick={() => saveLineupMutation.mutate()}
                   loading={saveLineupMutation.isPending}
                   disabled={saveLineupMutation.isPending || !isLineupDirty}
                   className="h-14 w-full rounded-xl font-inter font-bold text-lg uppercase tracking-wider"
                 >
                   {saveLineupMutation.isPending ? 'Saving...' : isLineupDirty ? 'Save Squad' : 'Squad Saved'}
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
                      <div className="px-6 pt-4">
                        <PositionFilterBar value={assignPositionFilter} onChange={setAssignPositionFilter} />
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
                              ?.filter((player: any) => assignPositionFilter === 'ALL' || normalizeAdminPosition(player.position) === assignPositionFilter)
                              .map((player: any) => {
                              const lineup = isSelectingPlayer.team === 'home' ? homeLineup : awayLineup
                              const assignedSlot = Object.entries(lineup).find(([, p]: [string, any]) => p?._id && p?._id === player?._id)
                              const isInCurrentSlot = assignedSlot && Number(assignedSlot[0]) === isSelectingPlayer.idx
                              return (
                                <button
                                  key={player._id || player.membershipId}
                                  disabled={isInCurrentSlot}
                                  onClick={() => assignPlayer(isSelectingPlayer.team, isSelectingPlayer.idx, player)}
                                  className={`w-full flex items-center justify-between gap-5 p-5 rounded-2xl border border-white/5 transition-all ${isInCurrentSlot ? 'opacity-20 cursor-not-allowed bg-black/20' : assignedSlot ? 'bg-yellow-500/5 border-yellow-500/20 hover:bg-yellow-500/10 active:scale-x-[0.98]' : 'bg-white/10 hover:bg-white/20 active:scale-x-[0.98]'}`}
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
                                    <p className="text-[10px] text-white/30 uppercase font-inter font-bold tracking-widest mt-0.5">
                                      {player.position || player.role || 'PLAYER'}
                                      {assignedSlot && !isInCurrentSlot && <span className="text-yellow-400 ml-2">• Will move from slot {Number(assignedSlot[0]) + 1}</span>}
                                    </p>
                                  </div>
                                </div>
                                {!isInCurrentSlot && <>{assignedSlot ? <Repeat size={18} className="text-yellow-400/60" /> : <Plus size={20} className="text-white/40" />}</>}
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

              {/* Slot Context Menu (Unassign / Replace) */}
              <AnimatePresence>
                {slotContextMenu && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[999] flex items-center justify-center px-6">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSlotContextMenu(null)} />
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#1C1F2D] w-full max-w-[320px] rounded-[32px] border border-white/10 z-10 overflow-hidden shadow-2xl">
                      {/* Player info */}
                      <div className="p-6 border-b border-white/5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
                          {(slotContextMenu.player.photoUrl || slotContextMenu.player.photo) ? (
                            <img src={slotContextMenu.player.photoUrl || slotContextMenu.player.photo} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-inter font-bold text-xs text-white/30">GAF</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-inter font-bold text-white text-base uppercase leading-tight truncate">
                            {slotContextMenu.player.firstName} {slotContextMenu.player.lastName}
                          </h4>
                          <p className="text-[10px] text-white/30 uppercase font-inter font-bold tracking-widest mt-0.5">
                            #{slotContextMenu.player.jerseyNumber || '?'} · Slot {slotContextMenu.idx + 1}
                          </p>
                        </div>
                        <button onClick={() => setSlotContextMenu(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/40">
                          <X size={16} />
                        </button>
                      </div>
                      {/* Actions */}
                      <div className="p-4 space-y-3">
                        {/* Player Rating Adjuster */}
                        {(() => {
                          const pId = slotContextMenu.player?._id || slotContextMenu.player?.id
                          const pEvts = eventsForPlayer(pId, events)
                          const curRating = calculatePlayerRating(slotContextMenu.player.position || 'MID', pEvts, slotContextMenu.player.rating)

                          return (
                            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 space-y-2">
                              <div className="flex items-center justify-between text-xs font-inter font-bold">
                                <span className="text-white/60 uppercase tracking-wider">Player Rating</span>
                                <span className="text-emerald-400 font-extrabold text-sm">
                                  {curRating.toFixed(1)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    const next = Math.max(1.0, Number((curRating - 0.5).toFixed(1)))
                                    updateSlotRating(slotContextMenu.team, slotContextMenu.idx, next)
                                    setSlotContextMenu((prev) => prev ? { ...prev, player: { ...prev.player, rating: next } } : null)
                                  }}
                                  className="flex-1 py-2 bg-red-500/20 border border-red-500/30 text-red-400 font-inter font-bold text-xs rounded-xl hover:bg-red-500/30 transition-colors"
                                >
                                  - 0.5
                                </button>
                                <button
                                  onClick={() => {
                                    const next = Math.min(10.0, Number((curRating + 0.5).toFixed(1)))
                                    updateSlotRating(slotContextMenu.team, slotContextMenu.idx, next)
                                    setSlotContextMenu((prev) => prev ? { ...prev, player: { ...prev.player, rating: next } } : null)
                                  }}
                                  className="flex-1 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-inter font-bold text-xs rounded-xl hover:bg-emerald-500/30 transition-colors"
                                >
                                  + 0.5
                                </button>
                              </div>
                              <div className="flex items-center gap-2 pt-1">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="1.0"
                                  max="10.0"
                                  placeholder="e.g. 7.8"
                                  value={ratingInput}
                                  onChange={(e) => setRatingInput(e.target.value)}
                                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-white font-inter font-bold text-xs text-center outline-none focus:border-[#FF5C00]"
                                />
                                <button
                                  onClick={() => {
                                    const val = parseFloat(ratingInput)
                                    if (!isNaN(val)) {
                                      updateSlotRating(slotContextMenu.team, slotContextMenu.idx, val)
                                      setSlotContextMenu((prev) => prev ? { ...prev, player: { ...prev.player, rating: val } } : null)
                                      setRatingInput('')
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-gradient-to-r from-[#FF5C00] to-[#FF2D20] text-white font-inter font-bold text-xs rounded-xl hover:opacity-90 transition-opacity"
                                >
                                  Set
                                </button>
                              </div>
                            </div>
                          )
                        })()}

                        <button
                          onClick={() => {
                            setAssignPositionFilter('ALL')
                            setIsSelectingPlayer({ team: slotContextMenu.team, idx: slotContextMenu.idx })
                            setSlotContextMenu(null)
                          }}
                          className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Repeat size={18} className="text-blue-400" />
                          </div>
                          <div className="text-left">
                            <span className="font-inter font-bold text-white text-sm uppercase tracking-wide">Replace</span>
                            <p className="text-[10px] text-white/30 font-inter font-bold uppercase tracking-widest">Pick a different player</p>
                          </div>
                        </button>
                        <button
                          onClick={() => unassignPlayer(slotContextMenu.team, slotContextMenu.idx)}
                          className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                            <X size={18} className="text-red-400" />
                          </div>
                          <div className="text-left">
                            <span className="font-inter font-bold text-white text-sm uppercase tracking-wide">Unassign</span>
                            <p className="text-[10px] text-white/30 font-inter font-bold uppercase tracking-widest">Remove from lineup</p>
                          </div>
                        </button>
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
                                setIsLineupDirty(true)
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
              <div className={`space-y-4 pt-4 pb-32 no-scrollbar transition-all duration-300 ${flowStep !== 'idle' ? 'opacity-10 blur-md pointer-events-none' : ''}`}>
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
                {/* Sort by minute ascending; filter events with no displayable content */}
                {[...events]
                  .sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0) || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                  .filter(e => e.description || e.commentaryText || e.notes || e.playerName)
                  .map((event: FixtureEvent) => (
                    <EventCard key={event._id} event={event} matchId={id} />
                  ))}
              </div>
              {/* Step Overlay */}
              <AnimatePresence>
                {flowStep !== 'idle' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[110] flex flex-col items-end justify-end p-6 pt-[10px] pb-28 transition-all duration-500"
                  >
                    <div
                      className="absolute inset-0 bg-black/90 backdrop-blur-[6px] -z-10"
                      onClick={resetFlow}
                    />

                    {/* Step Visualizer */}
                    {(selectedCategory === 'GOAL' || selectedCategory === 'SUBSTITUTION' || selectedCategory === 'PENALTY') && flowStep !== 'category' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center -mt-56 pointer-events-none">
                         <motion.div
                           initial={{ scale: 0.6, opacity: 0 }}
                           animate={{ scale: 0.8, opacity: 1 }}
                           className="flex flex-col items-center"
                         >
                            {selectedCategory === 'GOAL' ? (
                               <div className="flex flex-col items-center">
                                  <img src="/images/commentary/goal.png" className="w-[280px] h-[280px] object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]" alt="Goal" />
                                  <h2 className="text-4xl font-inter font-bold uppercase italic mt-4" style={{ color: '#FFF', textShadow: '0 4px 0 #EA580C, 0 8px 30px rgba(0,0,0,0.5)' }}>GOAL</h2>
                               </div>
                            ) : selectedCategory === 'SUBSTITUTION' ? (
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
                      {/* Step: CATEGORY */}
                      {flowStep === 'category' && (
                        <div className="flex flex-col items-end gap-3 w-full max-h-[80vh] overflow-y-auto no-scrollbar pb-10 pr-1">
                          {[
                            { label: 'MATCH STATUS', icon: "/icons/Live Game/Commentary/mdi_whistle-outline.svg", category: 'MATCH_STATUS' },
                            { label: 'CUSTOM NOTE', icon: "/icons/Live Game/Commentary/ri_edit-line.svg", category: 'CUSTOM' },
                            { label: 'SUBSTITUTION', icon: "/icons/Live Game/Commentary/Vector.svg", category: 'SUBSTITUTION' },
                            { label: 'CARD', color: '#FACC15', category: 'CARD' },
                            { label: 'PENALTY', icon: "/icons/Live Game/Commentary/emojione-monotone_goal-net.svg", category: 'PENALTY' },
                            { label: 'GOAL', icon: "/icons/Live Game/Commentary/emojione-monotone_goal-net.svg", category: 'GOAL' },
                          ].map((action, idx) => {
                            return (
                              <motion.button
                                key={action.category}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => {
                                  setSelectedCategory(action.category as any)
                                  if (action.category === 'MATCH_STATUS') setFlowStep('matchStatus')
                                  else setFlowStep('minute')
                                }}
                                className="flex items-center gap-3 px-4 py-3 bg-[#4A4646] rounded-[14px] border border-white/5 text-white shadow-xl transition-all text-left active:scale-95"
                              >
                                <div className="w-[18px] h-[18px] flex items-center justify-center">
                                  {action.icon ? (
                                    <img src={action.icon} alt="" className="w-full h-full object-contain" />
                                  ) : (
                                    <div className="w-[14px] h-[18px] rounded-[2px]" style={{ backgroundColor: action.color }} />
                                  )}
                                </div>
                                <span className="font-inter font-bold text-sm uppercase tracking-wider">
                                  {action.label}
                                </span>
                              </motion.button>
                            )
                          })}
                        </div>
                      )}

                      {/* Step: MATCH STATUS */}
                      {flowStep === 'matchStatus' && (
                         <div className="flex flex-col items-end gap-3 w-full">
                           <span className="font-inter font-bold text-xs uppercase text-white/40 mb-1 pr-1">MATCH STATUS</span>
                           <motion.button
                             onClick={() => {
                               recordEventMutation.mutate({ type: 'start', minute: 0, teamId: homeId || '' })
                             }}
                             className="w-full max-w-[200px] px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl font-inter font-bold text-sm uppercase text-white"
                           >
                             Kickoff
                           </motion.button>
                           <motion.button
                             onClick={() => {
                               recordEventMutation.mutate({ type: 'halftime', minute: 45, teamId: homeId || '' })
                             }}
                             className="w-full max-w-[200px] px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl font-inter font-bold text-sm uppercase text-white"
                           >
                             Half Time
                           </motion.button>
                           <motion.button
                             onClick={() => setShowFulltimeConfirm(true)}
                             className="w-full max-w-[200px] px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl font-inter font-bold text-sm uppercase text-white"
                           >
                             Full Time
                           </motion.button>
                        </div>
                      )}

                      {/* Step: MINUTE (For custom note or general minute input if needed) */}
                      {flowStep === 'minute' && (
                        <motion.div className="flex flex-col items-end gap-4 w-full max-w-[200px]">
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
                            onClick={() => {
                              if (!matchMinute) return
                              if (selectedCategory === 'CUSTOM') setFlowStep('custom')
                              else setFlowStep('team')
                            }}
                            className="w-full px-4 py-3 bg-gradient-to-r from-[#FF8A00] to-[#FF0000] rounded-2xl font-inter font-bold text-sm uppercase tracking-wider text-white"
                          >
                            Next →
                          </motion.button>
                        </motion.div>
                      )}

                      {/* Step: CUSTOM NOTE */}
                      {flowStep === 'custom' && (
                        <motion.div className="flex flex-col items-end gap-4 w-full">
                          <span className="font-inter font-bold text-xs uppercase text-white/40 pr-1">CUSTOM COMMENTARY</span>
                          <textarea
                            rows={4}
                            value={customText}
                            onChange={e => setCustomText(e.target.value)}
                            className="w-full bg-[#1C1F2D] border border-white/10 rounded-2xl px-5 py-4 font-inter font-bold text-sm text-white outline-none focus:border-orange-500 transition-colors resize-none"
                            autoFocus
                          />
                          <motion.button
                            disabled={!customText || recordEventMutation.isPending}
                            onClick={() => {
                              recordEventMutation.mutate({
                                type: 'custom',
                                minute: parseInt(matchMinute) || 0,
                                teamId: homeId || '',
                                notes: customText,
                                commentaryText: customText,
                              })
                            }}
                            className="w-full px-4 py-3 bg-gradient-to-r from-[#00A1D1] to-[#00A1D1]/60 rounded-2xl font-inter font-bold text-sm uppercase text-white"
                          >
                            Publish
                          </motion.button>
                        </motion.div>
                      )}

                      {/* Step: TEAM */}
                      {flowStep === 'team' && (
                        <div className="flex flex-col items-end gap-3 w-full">
                           <span className="font-inter font-bold text-xs uppercase text-white/40 mb-1 pr-1">PICK TEAM</span>
                          {[
                            { key: 'home' as const, team: teamA, tid: homeId },
                            { key: 'away' as const, team: teamB, tid: awayId },
                          ].map(({ key, team, tid }) => (
                            <motion.button
                              key={key}
                              onClick={() => {
                                setSelectedTeam(key)
                                if (selectedCategory === 'PENALTY') setFlowStep('penaltyPending')
                                else if (selectedCategory === 'CARD') setFlowStep('cardPlayer')
                                else if (selectedCategory === 'SUBSTITUTION') setFlowStep('subOut')
                                else setFlowStep('scorer') // GOAL
                              }}
                              className="flex items-center gap-3 w-full max-w-[180px] px-4 py-3 bg-[#1C1F2D] border border-white/10 rounded-2xl active:scale-95 text-left shadow-xl"
                            >
                              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                                {team?.logoUrl
                                  ? <img src={team.logoUrl} className="w-full h-full object-contain p-1.5" alt="" />
                                  : <Trophy size={14} className="text-white/40" />
                                }
                              </div>
                              <span className="text-white font-inter font-bold text-xs uppercase tracking-widest">{team?.name || 'Team'}</span>
                            </motion.button>
                          ))}
                        </div>
                      )}

                      {/* Generic Player Picker helper */}
                      {(() => {
                        const showPicker = ['scorer', 'assist', 'cardPlayer', 'subOut', 'subIn', 'penaltyTaker', 'penaltyGK'].includes(flowStep)
                        if (!showPicker) return null
                        
                        let pickerLabel = 'SELECT PLAYER'
                        if (flowStep === 'scorer') pickerLabel = 'GOAL SCORER'
                        if (flowStep === 'assist') pickerLabel = 'WHO ASSISTED?'
                        if (flowStep === 'subOut') pickerLabel = 'PLAYER OUT'
                        if (flowStep === 'subIn') pickerLabel = 'PLAYER IN'
                        if (flowStep === 'penaltyTaker') pickerLabel = 'PENALTY TAKER'
                        if (flowStep === 'penaltyGK') pickerLabel = 'GOALKEEPER'

                        // Figure out which team roster to show
                        let targetTeam = selectedTeam
                        if (flowStep === 'penaltyGK') targetTeam = selectedTeam === 'home' ? 'away' : 'home'
                        if (!targetTeam) return null

                        const isSubIn = flowStep === 'subIn'
                        const roster = isSubIn ? getBench(targetTeam) : getOnPitch(targetTeam)

                        return (
                          <div className="flex flex-col items-end gap-3 w-full max-h-[80vh] overflow-y-auto no-scrollbar pb-10 pr-1">
                            <span className="font-inter font-bold text-xs uppercase text-white/40 mb-1 pr-1 text-right">{pickerLabel}</span>
                            
                            {/* Own Goal option for Goal Scorer */}
                            {flowStep === 'scorer' && (
                              <motion.button
                                onClick={() => {
                                  recordEventMutation.mutate({
                                    type: 'own_goal',
                                    minute: parseInt(matchMinute) || 0,
                                    teamId: selectedTeam === 'home' ? (homeId || '') : (awayId || '')
                                  })
                                }}
                                className="flex items-center justify-center w-full max-w-[240px] px-4 py-3 bg-[#4A4646] rounded-[14px] border border-white/5 text-white/60 font-inter font-bold text-[13px] uppercase tracking-wider mb-2"
                              >
                                OWN GOAL
                              </motion.button>
                            )}

                            {roster.map((player: any, idx: number) => (
                              <motion.button
                                key={`\${player._id}-\${idx}`}
                                onClick={() => {
                                  if (flowStep === 'scorer') {
                                    setSelectedPlayer(player)
                                    setFlowStep('assistYesNo')
                                  } else if (flowStep === 'assist') {
                                    recordEventMutation.mutate({
                                      type: 'goal',
                                      minute: parseInt(matchMinute) || 0,
                                      teamId: selectedTeam === 'home' ? (homeId || '') : (awayId || ''),
                                      playerId: selectedPlayer?._id,
                                      assistPlayerId: player._id
                                    })
                                  } else if (flowStep === 'cardPlayer') {
                                    setSelectedPlayer(player)
                                    setFlowStep('cardType')
                                  } else if (flowStep === 'subOut') {
                                    setSelectedPlayerOut(player)
                                    setFlowStep('subIn')
                                  } else if (flowStep === 'subIn') {
                                    recordEventMutation.mutate({
                                      type: 'substitution',
                                      minute: parseInt(matchMinute) || 0,
                                      teamId: selectedTeam === 'home' ? (homeId || '') : (awayId || ''),
                                      playerOutId: selectedPlayerOut?._id,
                                      playerInId: player._id
                                    })
                                  } else if (flowStep === 'penaltyTaker') {
                                    setSelectedPlayer(player)
                                    setFlowStep('penaltyGK')
                                  } else if (flowStep === 'penaltyGK') {
                                    const tid = selectedTeam === 'home' ? homeId : awayId
                                    let type = 'penalty_scored'
                                    if (penaltyOutcome === 'missed') type = 'penalty_missed'
                                    if (penaltyOutcome === 'saved') type = 'penalty_saved'
                                    
                                    recordEventMutation.mutate({
                                      type,
                                      minute: parseInt(matchMinute) || 0,
                                      teamId: tid || '',
                                      playerId: selectedPlayer?._id,
                                      goalkeeperId: player._id
                                    })
                                  }
                                }}
                                className="flex items-center justify-between w-full max-w-[240px] px-4 py-2.5 bg-[#4A4646] rounded-[14px] border border-white/5 text-white"
                              >
                                <span className="font-inter font-bold text-[13px] uppercase">{player.firstName} {player.lastName}</span>
                                <span className="text-[10px] font-bold text-white/40 uppercase pl-3">{player.position || 'PLR'}</span>
                              </motion.button>
                            ))}
                          </div>
                        )
                      })()}

                      {/* Step: GOAL Assist Yes/No */}
                      {flowStep === 'assistYesNo' && (
                        <div className="flex flex-col items-end gap-4 w-full max-w-[260px]">
                          <span className="font-inter font-bold text-xs uppercase text-white/40 pr-1 text-right">WAS THERE AN ASSIST?</span>
                          <div className="flex gap-3 w-full">
                            <motion.button
                              onClick={() => {
                                recordEventMutation.mutate({
                                  type: 'goal',
                                  minute: parseInt(matchMinute) || 0,
                                  teamId: selectedTeam === 'home' ? (homeId || '') : (awayId || ''),
                                  playerId: selectedPlayer?._id
                                })
                              }}
                              className="flex-1 px-4 py-3 bg-white/5 rounded-xl border border-white/10 text-white/70 font-inter font-bold text-sm uppercase"
                            >
                              No
                            </motion.button>
                            <motion.button
                              onClick={() => setFlowStep('assist')}
                              className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white font-inter font-bold text-sm uppercase"
                            >
                              Yes
                            </motion.button>
                          </div>
                        </div>
                      )}

                      {/* Step: CARD Type */}
                      {flowStep === 'cardType' && (
                        <div className="flex flex-col items-end gap-4 w-full max-w-[260px]">
                          <span className="font-inter font-bold text-xs uppercase text-white/40 pr-1 text-right">WHICH CARD?</span>
                          <div className="flex gap-3 w-full">
                            <motion.button
                              onClick={() => {
                                recordEventMutation.mutate({
                                  type: 'yellow_card',
                                  minute: parseInt(matchMinute) || 0,
                                  teamId: selectedTeam === 'home' ? (homeId || '') : (awayId || ''),
                                  playerId: selectedPlayer?._id
                                })
                              }}
                              className="flex-1 px-4 py-4 bg-yellow-400 rounded-xl text-black font-inter font-bold text-sm uppercase"
                            >
                              Yellow
                            </motion.button>
                            <motion.button
                              onClick={() => {
                                recordEventMutation.mutate({
                                  type: 'red_card',
                                  minute: parseInt(matchMinute) || 0,
                                  teamId: selectedTeam === 'home' ? (homeId || '') : (awayId || ''),
                                  playerId: selectedPlayer?._id
                                })
                              }}
                              className="flex-1 px-4 py-4 bg-red-500 rounded-xl text-white font-inter font-bold text-sm uppercase"
                            >
                              Red
                            </motion.button>
                          </div>
                        </div>
                      )}

                      {/* Step: PENALTY Phase 1 */}
                      {flowStep === 'penaltyPending' && (
                        <div className="flex flex-col items-end gap-4 w-full">
                           <span className="font-inter font-bold text-xs uppercase text-white/40 mb-1 pr-1">PENALTY AWARDED</span>
                           <motion.button
                             onClick={() => {
                               // Phase 1: Award penalty
                               recordEventMutation.mutate({
                                 type: 'penalty_awarded',
                                 minute: parseInt(matchMinute) || 0,
                                 teamId: selectedTeam === 'home' ? (homeId || '') : (awayId || '')
                               })
                               setFlowStep('penaltyOutcome')
                             }}
                             className="w-full max-w-[240px] px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl font-inter font-bold text-sm uppercase text-white"
                           >
                             Announce Penalty
                           </motion.button>
                        </div>
                      )}

                      {/* Step: PENALTY Phase 2 (Outcome) */}
                      {flowStep === 'penaltyOutcome' && (
                        <div className="flex flex-col items-end gap-3 w-full max-w-[240px]">
                          <span className="font-inter font-bold text-xs uppercase text-white/40 mb-1 pr-1">PENALTY RESULT</span>
                          {[
                            { label: 'SCORED', val: 'scored', color: 'bg-green-500' },
                            { label: 'SAVED', val: 'saved', color: 'bg-orange-500' },
                            { label: 'MISSED', val: 'missed', color: 'bg-red-500' },
                          ].map(opt => (
                            <motion.button
                              key={opt.val}
                              onClick={() => {
                                setPenaltyOutcome(opt.val as any)
                                setFlowStep('penaltyTaker')
                              }}
                              className={`w-full px-4 py-3 rounded-xl text-white font-inter font-bold text-sm uppercase ${opt.color}`}
                            >
                              {opt.label}
                            </motion.button>
                          ))}
                        </div>
                      )}

                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

               {/* Floating Action Button */}
              <button
                disabled={recordEventMutation.isPending}
                onClick={(e) => {
                  e.stopPropagation()
                  if (flowStep === 'idle') setFlowStep('category')
                  else resetFlow()
                }}
                className={`fixed ${flowStep !== 'idle' ? 'bottom-8' : 'bottom-32'} right-6 w-14 h-14 rounded-full bg-gradient-to-br from-[#FF8A00] to-[#FF0000] flex items-center justify-center text-white z-[120] shadow-2xl active:scale-95 transition-all duration-500 ${flowStep !== 'idle' ? 'rotate-45' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Plus size={28} strokeWidth={3} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Fulltime Confirmation Modal */}
      <AnimatePresence>
        {showFulltimeConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center px-6"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowFulltimeConfirm(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-[#1C1F2D] w-full max-w-[300px] rounded-[28px] border border-white/10 overflow-hidden shadow-2xl z-10"
            >
              <div className="p-6 flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <img src="/icons/Live Game/Commentary/mdi_whistle-outline.svg" className="w-7 h-7 opacity-70" alt="" />
                </div>
                <div className="text-center">
                  <h3 className="font-inter font-bold text-white text-base uppercase tracking-widest">End Match?</h3>
                  <p className="text-[11px] font-inter font-bold text-white/40 uppercase tracking-wider mt-1">This will finalize the score and turn off live. Cannot be undone.</p>
                </div>
                <div className="flex gap-3 w-full pt-2">
                  <button
                    onClick={() => setShowFulltimeConfirm(false)}
                    className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 font-inter font-bold text-xs uppercase text-white/60"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={recordEventMutation.isPending}
                    onClick={() => {
                      setShowFulltimeConfirm(false)
                      recordEventMutation.mutate({
                        type: 'fulltime',
                        minute: 90,
                        teamId: homeId || '',
                      })
                    }}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 font-inter font-bold text-xs uppercase text-white disabled:opacity-50"
                  >
                    {recordEventMutation.isPending ? 'Ending...' : 'End Match'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ConfirmDialog
        open={!!missingLineups}
        title="No confirmed lineup"
        message={`No confirmed lineup for ${(missingLineups ?? []).join(' and ')}. Fantasy appearance and clean-sheet points can't be calculated without one. Start anyway?`}
        cancelLabel="Add lineup"
        confirmLabel="Start anyway"
        onCancel={() => { setMissingLineups(null); setActiveTab('lineup') }}
        onDismiss={() => setMissingLineups(null)}
        onConfirm={() => { setMissingLineups(null); toggleMutation.mutate(true) }}
      />
    </div>
  )
}

function EventCard({ event, matchId }: { event: FixtureEvent; matchId: string }) {
  const { role } = useAuthStore()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => deleteMatchEvent(matchId, event._id),
    meta: { suppressGlobalError: true },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['match-events', matchId] })
      const prev = queryClient.getQueryData(['match-events', matchId])
      queryClient.setQueryData(['match-events', matchId], (old: any) => {
        if (Array.isArray(old)) return old.filter((e: any) => e._id !== event._id)
        return old
      })
      return { prev }
    },
    onError: (_err: unknown, _v: unknown, ctx: any) => {
      queryClient.setQueryData(['match-events', matchId], ctx?.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['match-events', matchId] })
    },
  })

  const [confirmOpen, setConfirmOpen] = useState(false)

  const rawType = event.rawType || event.type
  const text = event.description || event.commentaryText || event.notes || ''
  const isSecondYellow = (event as any).metadata?.isSecondYellow || text.includes('SECOND YELLOW')
  const displayType = isSecondYellow ? 'second_yellow' : rawType

  const isGoal = ['goal', 'own_goal', 'penalty_scored'].includes(rawType)
  const isPenaltyEvent = ['penalty_awarded', 'penalty', 'penalty_saved', 'penalty_missed'].includes(rawType)
  const isFulltime = rawType === 'fulltime'

  const cardStyle = isGoal
    ? 'bg-[#8E103E] border-emerald-500/20'
    : isSecondYellow
    ? 'bg-[#4C152B] border-amber-500/30'
    : isPenaltyEvent
    ? 'bg-[#4C152B] border-red-500/20'
    : isFulltime
    ? 'bg-[#2E1A47] border-purple-500/20'
    : 'bg-[#1C1F2D] border-white/5'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[20px] px-5 py-3.5 flex items-center justify-between border ${cardStyle} relative group shadow-lg`}
    >
      <div className="flex items-center gap-3.5 shrink min-w-0">
        <CommentaryIcon type={displayType} />
        <p className="font-inter font-bold text-[12px] leading-relaxed uppercase py-0.5 text-white/90 tracking-tight pr-4">
          {text}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {role === 'organization' && (
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={deleteMutation.isPending}
            aria-label="Undo commentary"
            className="shrink-0 text-[10px] font-bold text-white/40 hover:text-white/80 transition-colors uppercase tracking-wider"
          >
            {deleteMutation.isPending ? 'Undoing…' : 'Undo'}
          </button>
        )}
        {event.minute != null && (
          <span className="text-[10px] font-bold text-white/30 whitespace-nowrap uppercase tracking-widest">{event.minute}&apos;</span>
        )}
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="Undo Commentary"
        message="Are you sure you want to remove this commentary event? This cannot be undone."
        confirmLabel={deleteMutation.isPending ? 'Removing…' : 'Remove'}
        cancelLabel="Cancel"
        destructive
        onConfirm={() => { setConfirmOpen(false); deleteMutation.mutate(undefined) }}
        onCancel={() => setConfirmOpen(false)}
      />
    </motion.div>
  )
}
