'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy, User, Clock, ChevronDown, Check, Activity, Shield } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createMatchEvent, EVENT_TYPES, type EventType } from '@/lib/services/match.service'
import { listPlayers } from '@/lib/services/team.service'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'

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
  const [eventType, setEventType] = useState<EventType>('goal')
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('')
  const [minute, setMinute] = useState<number>(45)
  const [commentary, setCommentary] = useState('')

  // Fetch players for the selected team
  const { data: players, isLoading: isLoadingPlayers } = useQuery({
    queryKey: ['team-players', selectedTeamId],
    queryFn: () => listPlayers(selectedTeamId),
    enabled: !!selectedTeamId,
  })

  const eventMutation = useMutation({
    mutationFn: (payload: any) => createMatchEvent(fixtureId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fixtures'] })
      qc.invalidateQueries({ queryKey: ['competition'] })
      qc.invalidateQueries({ queryKey: ['standings'] })
      toast.addToast('Event recorded successfully', 'success')
      onClose()
    },
    onError: (err) => toast.addToast(getErrorMessage(err), 'error'),
  })

  const handleRecord = () => {
    const payload: any = {
      type: eventType,
      minute,
      teamId: selectedTeamId,
      commentaryText: commentary || undefined,
    }

    if (selectedPlayerId) {
      payload.playerId = selectedPlayerId
    }

    eventMutation.mutate(payload)
  }

  const isScoringEvent = ['goal', 'own_goal', 'penalty_scored'].includes(eventType)
  const isCardEvent = ['yellow_card', 'red_card'].includes(eventType)

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
                    setSelectedPlayerId('')
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

          {/* Event Type Grid */}
          <div className="space-y-3">
            <label className="text-[11px] font-chakra font-black text-white/40 uppercase tracking-widest ml-1">Event Type</label>
            <div className="grid grid-cols-3 gap-2">
              {['goal', 'yellow_card', 'red_card', 'substitution', 'penalty_scored', 'start', 'fulltime'].map((type) => (
                <button
                  key={type}
                  onClick={() => setEventType(type as EventType)}
                  className={`py-3 rounded-xl border text-[10px] font-chakra font-black uppercase tracking-tighter transition-all ${
                    eventType === type 
                      ? 'bg-white text-black border-white' 
                      : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                  }`}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Minute Input */}
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

            {/* Player Selector (if applicable) */}
            {!['start', 'halftime', 'fulltime'].includes(eventType) && (
              <div className="space-y-3">
                <label className="text-[11px] font-chakra font-black text-white/40 uppercase tracking-widest ml-1">Player</label>
                <div className="relative">
                  <select
                    value={selectedPlayerId}
                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                    className="w-full h-14 bg-[#1E2032] border border-white/5 rounded-2xl px-6 font-chakra font-black text-white text-[12px] uppercase outline-none appearance-none focus:border-gaffer-orange transition-all"
                  >
                    <option value="">Select Player</option>
                    {players?.map((p) => (
                      <option key={p._id} value={p._id}>#{p.jerseyNumber} {p.lastName}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                </div>
              </div>
            )}
          </div>

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

        {/* Footer */}
        <div className="p-8 border-t border-white/5 bg-[#1C1D2B] shrink-0">
          <button
            onClick={handleRecord}
            disabled={eventMutation.isPending || (!selectedPlayerId && !['start', 'fulltime'].includes(eventType))}
            className={`w-full h-16 rounded-[24px] font-chakra font-black text-lg uppercase tracking-widest shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 ${
                isScoringEvent ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' :
                isCardEvent ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black' :
                'bg-gradient-to-r from-[#FF7A00] to-[#FF0000] text-white'
            }`}
          >
            {eventMutation.isPending ? (
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Activity size={20} />
                Record Event
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
