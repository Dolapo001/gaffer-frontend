'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy, User, Clock, ChevronDown, Check, Activity, Shield } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createMatchEvent, getMatchEvents, EVENT_TYPES, type EventType } from '@/lib/services/match.service'
import { listPlayers } from '@/lib/services/team.service'
import { listLineups } from '@/lib/services/fixture.service'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'

type EventCategory = 'GOAL' | 'PENALTY' | 'CARD' | 'GK SAVE' | 'MAN OF THE MATCH' | 'SUBSTITUTION' | 'MATCH STATUS' | 'CUSTOM NOTE'

// Flattens whichever shape listPlayers/listLineups returns a player in —
// sometimes a full nested `playerId` document, sometimes already-flat —
// into a consistent { _id, firstName, lastName, jerseyNumber } shape.
function flattenPlayer(p: any) {
  const inner = p?.playerId && typeof p.playerId === 'object' ? p.playerId : {}
  return {
    _id: inner._id || p?._id || p?.playerId || '',
    firstName: inner.firstName || p?.firstName || 'Player',
    lastName: inner.lastName || p?.lastName || '',
    jerseyNumber: p?.jerseyNumber || inner.jerseyNumber || '?',
  }
}

interface Props {
  fixtureId: string
  homeTeam: { id: string; name: string; logoUrl?: string }
  awayTeam: { id: string; name: string; logoUrl?: string }
  onClose: () => void
}

export function RecordEventModal({ fixtureId, homeTeam, awayTeam, onClose }: Props) {
  const qc = useQueryClient()
  const toast = useToastStore()
  
  const [selectedTeamId, setSelectedTeamId] = useState<string>(homeTeam.id)
  const [minute, setMinute] = useState<number>(45)
  const [commentary, setCommentary] = useState('')

  // Step 1: Category Selection
  const [activeCategory, setActiveCategory] = useState<EventCategory | null>(null)

  // Step 2: Contextual Data State
  // GOAL
  const [goalType, setGoalType] = useState<'goal' | 'own_goal'>('goal')
  const [scorerId, setScorerId] = useState<string>('')
  const [assistId, setAssistId] = useState<string>('')

  // CARD
  const [cardType, setCardType] = useState<'yellow_card' | 'red_card'>('yellow_card')
  const [cardPlayerId, setCardPlayerId] = useState<string>('')

  // GK SAVE (+1 fantasy point per 3 saves) and MAN OF THE MATCH (+3 fantasy points)
  const [savePlayerId, setSavePlayerId] = useState<string>('')
  const [motmPlayerId, setMotmPlayerId] = useState<string>('')

  // SUBSTITUTION
  const [playerOutId, setPlayerOutId] = useState<string>('')
  const [playerInId, setPlayerInId] = useState<string>('')

  // PENALTY
  const [penaltyMode, setPenaltyMode] = useState<'result' | 'awarded'>('result')
  const [penaltyOutcome, setPenaltyOutcome] = useState<'scored' | 'missed' | 'saved'>('scored')
  const [penaltyTakerId, setPenaltyTakerId] = useState<string>('')
  const [penaltyGoalkeeperId, setPenaltyGoalkeeperId] = useState<string>('')

  // MATCH STATUS
  const [matchStatusType, setMatchStatusType] = useState<'start' | 'halftime' | 'fulltime'>('start')

  // Fetch the full roster (fallback only — see eligiblePlayers below) plus
  // the submitted lineup and events, so the picker can be filtered down to
  // players actually in the match instead of the whole ~25-player squad.
  const { data: players, isLoading: isLoadingPlayers } = useQuery({
    queryKey: ['team-players', selectedTeamId],
    queryFn: () => listPlayers(selectedTeamId),
    enabled: !!selectedTeamId,
  })

  const opposingTeamId = selectedTeamId === homeTeam.id ? awayTeam.id : homeTeam.id
  const { data: opposingPlayers } = useQuery({
    queryKey: ['team-players', opposingTeamId],
    queryFn: () => listPlayers(opposingTeamId),
    enabled: !!opposingTeamId,
  })

  const { data: lineups } = useQuery({
    queryKey: ['lineups', fixtureId],
    queryFn: () => listLineups(fixtureId),
    enabled: !!fixtureId,
  })

  // NOTE: deliberately a distinct key from ['events', fixtureId] — that key
  // is also used by AdminLiveMatchDetails.tsx for a different fetch function
  // (listEvents vs getMatchEvents here). Reusing the same key would make
  // React Query treat them as one shared cache slot, so whichever query last
  // populated it could clobber the other if both are ever active for the
  // same fixture.
  const { data: matchEvents = [] } = useQuery({
    queryKey: ['record-event-modal-events', fixtureId],
    queryFn: () => getMatchEvents(fixtureId),
    enabled: !!fixtureId,
  })

  // Starting XI (from the submitted lineup) plus anyone already subbed on,
  // minus anyone already subbed off — the actual match participants.
  const { onPitchPlayers, offPitchPlayers } = (() => {
    if (!players) return { onPitchPlayers: [], offPitchPlayers: [] }
    const isHome = selectedTeamId === homeTeam.id
    const sideKey = isHome ? 'homeTeam' : 'awayTeam'
    const lineupSide = (lineups as any)?.[sideKey]
    
    const starterIds: string[] = (lineupSide?.players || lineupSide?.slots || [])
      .map((s: any) => s?.playerId?._id || s?.playerId || s?._id)
      .filter(Boolean)
      .map(String)
      
    const benchIds: string[] = (lineupSide?.bench || [])
      .map((s: any) => s?._id || s)
      .filter(Boolean)
      .map(String)

    const onPitchIds = new Set(starterIds)
    const usedSubIds = new Set<string>() // players who have already come on or gone off

    ;(Array.isArray(matchEvents) ? matchEvents : [])
      .filter((e) => {
        const raw = (e as any).rawType || e.type
        const tid = typeof e.teamId === 'string' ? e.teamId : (e.teamId as any)?._id
        return raw === 'substitution' && tid === selectedTeamId
      })
      .sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))
      .forEach((e) => {
        if (e.playerOutId) {
          onPitchIds.delete(String(e.playerOutId))
          usedSubIds.add(String(e.playerOutId))
        }
        if (e.playerInId) {
          onPitchIds.add(String(e.playerInId))
          usedSubIds.add(String(e.playerInId))
        }
      })

    const flattenedPlayers = players.map(flattenPlayer)
    
    // Players on pitch
    const onPitch = flattenedPlayers.filter((p) => onPitchIds.has(String(p._id)))
    
    // Players off pitch (bench members who haven't been used yet)
    // To allow for general substitutions if lineup isn't fully robust, we can just say: anyone not on the pitch and not already used as a sub.
    const offPitch = flattenedPlayers.filter(
      (p) => !onPitchIds.has(String(p._id)) && !usedSubIds.has(String(p._id))
    )

    return { onPitchPlayers: onPitch, offPitchPlayers: offPitch }
  })()

  const eventMutation = useMutation({
    mutationFn: (payload: any) => createMatchEvent(fixtureId, payload),
    onSuccess: (_, variables: any) => {
      qc.invalidateQueries({ queryKey: ['fixtures'] })
      qc.invalidateQueries({ queryKey: ['competition'] })
      qc.invalidateQueries({ queryKey: ['standings'] })
      
      if (activeCategory === 'PENALTY' && penaltyMode === 'awarded' && variables.type === 'penalty_awarded') {
        toast.addToast('Penalty awarded announced', 'success')
        setPenaltyMode('result')
      } else {
        toast.addToast('Event recorded successfully', 'success')
        onClose()
      }
    },
    onError: (err) => toast.addToast(getErrorMessage(err), 'error'),
  })

  const handleRecord = () => {
    if (!activeCategory) return

    const payload: any = {
      minute,
      teamId: selectedTeamId,
      commentaryText: commentary || undefined,
    }

    if (activeCategory === 'GOAL') {
      payload.type = goalType
      if (scorerId) payload.playerId = scorerId
      if (assistId) payload.assistPlayerId = assistId
    } else if (activeCategory === 'SUBSTITUTION') {
      payload.type = 'substitution'
      if (playerOutId) payload.playerOutId = playerOutId
      if (playerInId) payload.playerInId = playerInId
    } else if (activeCategory === 'CARD') {
      payload.type = cardType
      if (cardPlayerId) payload.playerId = cardPlayerId
    } else if (activeCategory === 'MATCH STATUS') {
      payload.type = matchStatusType
    } else if (activeCategory === 'CUSTOM NOTE') {
      payload.type = 'custom'
    } else if (activeCategory === 'GK SAVE') {
      payload.type = 'save'
      if (savePlayerId) payload.playerId = savePlayerId
    } else if (activeCategory === 'MAN OF THE MATCH') {
      payload.type = 'motm'
      if (motmPlayerId) payload.playerId = motmPlayerId
    } else if (activeCategory === 'PENALTY') {
      if (penaltyMode === 'awarded') {
        payload.type = 'penalty_awarded'
      } else {
        if (penaltyOutcome === 'scored') {
          payload.type = 'penalty_scored'
        } else if (penaltyOutcome === 'saved') {
          payload.type = 'penalty_saved'
        } else {
          payload.type = 'penalty_missed'
        }
        if (penaltyTakerId) payload.playerId = penaltyTakerId
        if (penaltyGoalkeeperId) {
          payload.goalkeeperId = penaltyGoalkeeperId
          payload.relatedPlayerId = penaltyGoalkeeperId
        }
      }
    }

    eventMutation.mutate(payload)
  }



  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="absolute inset-0 bg-black/80 backdrop-blur-xl" 
        onClick={onClose} 
      />
      
      <motion.div 
        initial={{ y: '100%', opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        exit={{ y: '100%', opacity: 0 }}
        className="relative w-full max-w-lg bg-[#181928] rounded-t-[40px] sm:rounded-[32px] border-t sm:border border-white/10 shadow-3xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-chakra font-black text-white uppercase tracking-tight">Record Event</h2>
            <p className="text-[10px] text-white/30 font-chakra font-bold uppercase tracking-[0.2em] mt-0.5">Live Match Controller</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          
          {/* Team Selector */}
          <div className="space-y-3">
            <label className="text-[11px] font-chakra font-black text-white/40 uppercase tracking-widest ml-1">Select Team</label>
            <div className="grid grid-cols-2 gap-3">
              {[homeTeam, awayTeam].map((team) => (
                <button
                  key={team.id}
                  onClick={() => {
                    setSelectedTeamId(team.id)
                    setScorerId('')
                    setAssistId('')
                    setPlayerOutId('')
                    setPlayerInId('')
                    setCardPlayerId('')
                    setPenaltyTakerId('')
                    setPenaltyGoalkeeperId('')
                  }}
                  className={`p-4 rounded-[24px] border-2 transition-all flex flex-col items-center gap-2 ${
                    selectedTeamId === team.id 
                      ? 'bg-gaffer-orange/10 border-gaffer-orange text-white' 
                      : 'bg-[#1E2032] border-transparent text-white/30 opacity-60'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-white/5 p-2">
                    <img src={team.logoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${team.name}`} alt="" className="w-full h-full object-contain" />
                  </div>
                  <span className="font-chakra font-black text-[11px] uppercase tracking-tighter truncate w-full text-center">
                    {team.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {!activeCategory ? (
            /* Category Grid */
            <div className="space-y-3">
              <label className="text-[11px] font-chakra font-black text-white/40 uppercase tracking-widest ml-1">Event Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(['GOAL', 'PENALTY', 'CARD', 'GK SAVE', 'MAN OF THE MATCH', 'SUBSTITUTION', 'MATCH STATUS', 'CUSTOM NOTE'] as EventCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className="py-4 rounded-xl border border-white/5 bg-white/5 text-[11px] font-chakra font-black uppercase tracking-tighter text-white hover:bg-white/10 transition-all"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Contextual Form */
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex flex-row justify-between items-center pb-2 border-b border-white/10">
                 <h3 className="text-sm font-chakra font-bold text-gaffer-orange uppercase">{activeCategory}</h3>
                 <button onClick={() => { setActiveCategory(null); }} className="text-[10px] uppercase font-bold text-white/40 hover:text-white transition-colors">
                   Change Category
                 </button>
              </div>

              {/* Minute */}
              <div className="space-y-3">
                <label className="text-[11px] font-chakra font-black text-white/40 uppercase tracking-widest ml-1">Minute</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={minute}
                    onChange={(e) => setMinute(parseInt(e.target.value) || 0)}
                    className="w-full h-14 bg-[#1E2032] border border-white/5 rounded-2xl px-6 font-chakra font-black text-white text-lg focus:border-gaffer-orange outline-none transition-all"
                  />
                  <Clock size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20" />
                </div>
              </div>

              {activeCategory === 'GOAL' && (
                <div className="space-y-4">
                  {/* Goal Type */}
                  <div className="flex gap-2">
                    <button onClick={() => setGoalType('goal')} className={`flex-1 py-3 rounded-xl border text-[10px] font-chakra font-black uppercase tracking-tighter transition-all ${goalType === 'goal' ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 text-white/40'}`}>Goal</button>
                    <button onClick={() => setGoalType('own_goal')} className={`flex-1 py-3 rounded-xl border text-[10px] font-chakra font-black uppercase tracking-tighter transition-all ${goalType === 'own_goal' ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 text-white/40'}`}>Own Goal</button>
                  </div>
                  {/* Scorer */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-chakra font-black text-white/40 uppercase tracking-widest ml-1">{goalType === 'goal' ? 'Goal Scorer' : 'Own Goal Scorer'}</label>
                    <div className="relative">
                      <select value={scorerId} onChange={(e) => setScorerId(e.target.value)} className="w-full h-14 bg-[#1E2032] border border-white/5 rounded-2xl px-6 font-chakra font-black text-white text-[12px] uppercase outline-none appearance-none focus:border-gaffer-orange transition-all">
                        <option value="">Select Scorer</option>
                        {onPitchPlayers.map((p) => <option key={p._id} value={p._id}>#{p.jerseyNumber} {p.lastName}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                    </div>
                  </div>
                  {/* Assist */}
                  {goalType === 'goal' && (
                    <div className="space-y-3">
                      <label className="text-[11px] font-chakra font-black text-white/40 uppercase tracking-widest ml-1">Assist (Optional)</label>
                      <div className="relative">
                        <select value={assistId} onChange={(e) => setAssistId(e.target.value)} className="w-full h-14 bg-[#1E2032] border border-white/5 rounded-2xl px-6 font-chakra font-black text-white text-[12px] uppercase outline-none appearance-none focus:border-gaffer-orange transition-all">
                          <option value="">None</option>
                          {onPitchPlayers.filter(p => p._id !== scorerId).map((p) => <option key={p._id} value={p._id}>#{p.jerseyNumber} {p.lastName}</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeCategory === 'CARD' && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <button onClick={() => setCardType('yellow_card')} className={`flex-1 py-3 rounded-xl border text-[10px] font-chakra font-black uppercase tracking-tighter transition-all ${cardType === 'yellow_card' ? 'bg-[#FBBF24] text-black border-[#FBBF24]' : 'bg-white/5 border-white/5 text-white/40'}`}>Yellow Card</button>
                    <button onClick={() => setCardType('red_card')} className={`flex-1 py-3 rounded-xl border text-[10px] font-chakra font-black uppercase tracking-tighter transition-all ${cardType === 'red_card' ? 'bg-[#EF4444] text-white border-[#EF4444]' : 'bg-white/5 border-white/5 text-white/40'}`}>Red Card</button>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-chakra font-black text-white/40 uppercase tracking-widest ml-1">Player</label>
                    <div className="relative">
                      <select value={cardPlayerId} onChange={(e) => setCardPlayerId(e.target.value)} className="w-full h-14 bg-[#1E2032] border border-white/5 rounded-2xl px-6 font-chakra font-black text-white text-[12px] uppercase outline-none appearance-none focus:border-gaffer-orange transition-all">
                        <option value="">Select Player</option>
                        {onPitchPlayers.map((p) => <option key={p._id} value={p._id}>#{p.jerseyNumber} {p.lastName}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                    </div>
                  </div>
                  {cardType === 'yellow_card' && cardPlayerId && (matchEvents as any[])?.some(e => (e.rawType || e.type) === 'yellow_card' && String(e.playerId?._id || e.playerId) === String(cardPlayerId)) && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2 text-amber-300 text-[11px] font-chakra font-bold">
                      <span>🟨🟥</span>
                      <span>Second Yellow Card! Player will receive a RED CARD send-off in commentary and stats.</span>
                    </div>
                  )}
                </div>
              )}

              {(activeCategory === 'GK SAVE' || activeCategory === 'MAN OF THE MATCH') && (
                <div className="space-y-3">
                  <p className="text-[11px] font-chakra font-bold text-white/50 leading-snug ml-1">
                    {activeCategory === 'GK SAVE'
                      ? 'Goalkeeper makes a save. Fantasy: +1 point for every 3 saves in the match.'
                      : 'Pick the Man of the Match once, at the end. Fantasy: +3 bonus points. Only one per match counts (the latest).'}
                  </p>
                  <label className="text-[11px] font-chakra font-black text-white/40 uppercase tracking-widest ml-1">
                    {activeCategory === 'GK SAVE' ? 'Goalkeeper' : 'Player'}
                  </label>
                  <div className="relative">
                    <select
                      value={activeCategory === 'GK SAVE' ? savePlayerId : motmPlayerId}
                      onChange={(e) => (activeCategory === 'GK SAVE' ? setSavePlayerId(e.target.value) : setMotmPlayerId(e.target.value))}
                      className="w-full h-14 bg-[#1E2032] border border-white/5 rounded-2xl px-6 font-chakra font-black text-white text-[12px] uppercase outline-none appearance-none focus:border-gaffer-orange transition-all"
                    >
                      <option value="">{activeCategory === 'GK SAVE' ? 'Select Goalkeeper' : 'Select Player'}</option>
                      {onPitchPlayers.map((p) => <option key={p._id} value={p._id}>#{p.jerseyNumber} {p.lastName}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                  </div>
                </div>
              )}

              {activeCategory === 'SUBSTITUTION' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="text-[11px] font-chakra font-black text-red-400 uppercase tracking-widest ml-1">Player Out (From Pitch)</label>
                    <div className="relative">
                      <select value={playerOutId} onChange={(e) => setPlayerOutId(e.target.value)} className="w-full h-14 bg-[#1E2032] border border-red-500/20 text-red-100 rounded-2xl px-6 font-chakra font-black text-[12px] uppercase outline-none appearance-none focus:border-red-500 transition-all">
                        <option value="">Select Player Out</option>
                        {onPitchPlayers.map((p) => <option key={p._id} value={p._id}>#{p.jerseyNumber} {p.lastName}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-chakra font-black text-green-400 uppercase tracking-widest ml-1">Player In (From Bench)</label>
                    <div className="relative">
                      <select value={playerInId} onChange={(e) => setPlayerInId(e.target.value)} className="w-full h-14 bg-[#1E2032] border border-green-500/20 text-green-100 rounded-2xl px-6 font-chakra font-black text-[12px] uppercase outline-none appearance-none focus:border-green-500 transition-all">
                        <option value="">Select Player In</option>
                        {offPitchPlayers.map((p) => <option key={p._id} value={p._id}>#{p.jerseyNumber} {p.lastName}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}

              {activeCategory === 'MATCH STATUS' && (
                <div className="space-y-3">
                  <label className="text-[11px] font-chakra font-black text-white/40 uppercase tracking-widest ml-1">Status Event</label>
                  <div className="relative">
                    <select value={matchStatusType} onChange={(e) => setMatchStatusType(e.target.value as any)} className="w-full h-14 bg-[#1E2032] border border-white/5 rounded-2xl px-6 font-chakra font-black text-white text-[12px] uppercase outline-none appearance-none focus:border-gaffer-orange transition-all">
                      <option value="start">Kick Off</option>
                      <option value="halftime">Half Time</option>
                      <option value="fulltime">Full Time</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                  </div>
                </div>
              )}

              {activeCategory === 'PENALTY' && (
                <div className="space-y-4">
                  {/* Mode Selector */}
                  <div className="flex bg-[#1E2032] p-1 rounded-2xl border border-white/5 gap-1">
                    <button
                      type="button"
                      onClick={() => setPenaltyMode('result')}
                      className={`flex-1 py-2.5 rounded-xl font-chakra font-black text-[11px] uppercase tracking-wider transition-all ${
                        penaltyMode === 'result'
                          ? 'bg-gaffer-orange text-white shadow-lg'
                          : 'text-white/40 hover:text-white'
                      }`}
                    >
                      Penalty Outcome
                    </button>
                    <button
                      type="button"
                      onClick={() => setPenaltyMode('awarded')}
                      className={`flex-1 py-2.5 rounded-xl font-chakra font-black text-[11px] uppercase tracking-wider transition-all ${
                        penaltyMode === 'awarded'
                          ? 'bg-red-500 text-white shadow-lg'
                          : 'text-white/40 hover:text-white'
                      }`}
                    >
                      Announce Awarded
                    </button>
                  </div>

                  {penaltyMode === 'awarded' ? (
                    <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-200 text-xs font-chakra font-bold leading-relaxed">
                      🚨 Broadcasts a &quot;PENALTY AWARDED&quot; match event live to fans.
                    </div>
                  ) : (
                    <>
                      {/* Outcome Buttons */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPenaltyOutcome('scored')}
                          className={`flex-1 py-3.5 rounded-xl border text-[11px] font-chakra font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                            penaltyOutcome === 'scored'
                              ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                              : 'bg-white/5 border-white/5 text-white/40 hover:text-white'
                          }`}
                        >
                          ⚽ Scored
                        </button>
                        <button
                          type="button"
                          onClick={() => setPenaltyOutcome('saved')}
                          className={`flex-1 py-3.5 rounded-xl border text-[11px] font-chakra font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                            penaltyOutcome === 'saved'
                              ? 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                              : 'bg-white/5 border-white/5 text-white/40 hover:text-white'
                          }`}
                        >
                          🧤 Saved
                        </button>
                        <button
                          type="button"
                          onClick={() => setPenaltyOutcome('missed')}
                          className={`flex-1 py-3.5 rounded-xl border text-[11px] font-chakra font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                            penaltyOutcome === 'missed'
                              ? 'bg-rose-600 text-white border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                              : 'bg-white/5 border-white/5 text-white/40 hover:text-white'
                          }`}
                        >
                          ❌ Missed
                        </button>
                      </div>

                      {/* Taker Selector */}
                      <div className="space-y-3">
                        <label className="text-[11px] font-chakra font-black text-white/40 uppercase tracking-widest ml-1">Penalty Taker</label>
                        <div className="relative">
                          <select value={penaltyTakerId} onChange={(e) => setPenaltyTakerId(e.target.value)} className="w-full h-14 bg-[#1E2032] border border-white/5 rounded-2xl px-6 font-chakra font-black text-white text-[12px] uppercase outline-none appearance-none focus:border-gaffer-orange transition-all">
                            <option value="">Select Taker</option>
                            {onPitchPlayers.map((p) => <option key={p._id} value={p._id}>#{p.jerseyNumber} {p.lastName}</option>)}
                          </select>
                          <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                        </div>
                      </div>

                      {/* Goalkeeper Selector for Saved/Missed */}
                      {(penaltyOutcome === 'saved' || penaltyOutcome === 'missed') && (
                        <div className="space-y-3">
                          <label className="text-[11px] font-chakra font-black text-white/40 uppercase tracking-widest ml-1">Goalkeeper (Opposing Team)</label>
                          <div className="relative">
                            <select value={penaltyGoalkeeperId} onChange={(e) => setPenaltyGoalkeeperId(e.target.value)} className="w-full h-14 bg-[#1E2032] border border-white/5 rounded-2xl px-6 font-chakra font-black text-white text-[12px] uppercase outline-none appearance-none focus:border-gaffer-orange transition-all">
                              <option value="">None / Unspecified</option>
                              {(opposingPlayers || []).map(flattenPlayer).map((p) => (
                                <option key={p._id} value={p._id}>#{p.jerseyNumber} {p.lastName} ({p.firstName})</option>
                              ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Commentary */}
              <div className="space-y-3">
                <label className="text-[11px] font-chakra font-black text-white/40 uppercase tracking-widest ml-1">Commentary (Optional)</label>
                <textarea 
                  value={commentary}
                  onChange={(e) => setCommentary(e.target.value)}
                  placeholder="Describe the action..."
                  className="w-full bg-[#1E2032] border border-white/5 rounded-2xl p-4 text-sm text-white focus:border-gaffer-orange outline-none transition-all resize-none h-24"
                />
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        {activeCategory && (
          <div className="p-8 border-t border-white/5 bg-[#1C1D2B] shrink-0">
            <button
              onClick={handleRecord}
              disabled={eventMutation.isPending || (activeCategory === 'GOAL' && !scorerId) || (activeCategory === 'SUBSTITUTION' && (!playerInId || !playerOutId)) || (activeCategory === 'CARD' && !cardPlayerId) || (activeCategory === 'GK SAVE' && !savePlayerId) || (activeCategory === 'MAN OF THE MATCH' && !motmPlayerId) || (activeCategory === 'PENALTY' && penaltyMode === 'result' && !penaltyTakerId)}
              className={`w-full h-16 rounded-[24px] font-chakra font-black text-sm uppercase tracking-widest shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 bg-gradient-to-r from-gaffer-orange to-red-500 text-white`}
            >
              {eventMutation.isPending ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Activity size={20} />
                  {activeCategory === 'PENALTY'
                    ? (penaltyMode === 'awarded'
                        ? 'Announce Penalty Awarded 🚨'
                        : penaltyOutcome === 'scored'
                        ? 'Record Penalty Goal ⚽'
                        : penaltyOutcome === 'saved'
                        ? 'Record Penalty Save 🧤'
                        : 'Record Penalty Miss ❌')
                    : activeCategory === 'GK SAVE'
                    ? 'Record Goalkeeper Save 🧤'
                    : activeCategory === 'MAN OF THE MATCH'
                    ? 'Award Man of the Match 🏆'
                    : 'Record Event'}
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
