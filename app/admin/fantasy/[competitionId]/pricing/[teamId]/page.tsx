'use client'

import React, { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronUp, ChevronDown, User, Check } from 'lucide-react'
import {
  getPlayerPricing,
  setPlayerPrice,
  finalizeTeamPricing,
  type FantasyPlayer
} from '@/lib/services/fantasy.service'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'

const POSITION_COLORS: Record<string, string> = {
  GK: '#9CA3AF',
  DEF: '#22C55E',
  MID: '#22C55E',
  FWD: '#22C55E',
}

const TIER_COLORS: Record<string, { bg: string, text: string, border: string }> = {
  marquee:  { bg: 'bg-orange-500/10', text: 'text-orange-500',  border: 'border-orange-500/20' },
  elite:    { bg: 'bg-purple-500/10', text: 'text-purple-500',  border: 'border-purple-500/20' },
  standard: { bg: 'bg-blue-400/10',   text: 'text-blue-400',    border: 'border-blue-400/20' },
  budget:   { bg: 'bg-green-500/10',   text: 'text-green-500',   border: 'border-green-500/20' },
}

const PRICE_STEP = 0.5
const PRICE_MIN = 4.0
const PRICE_MAX = 12.5

function tierFromPrice(price: number): 'marquee' | 'elite' | 'standard' | 'budget' {
  if (price >= 10.5) return 'marquee'
  if (price >= 8.0)  return 'elite'
  if (price >= 6.0)  return 'standard'
  return 'budget'
}

export default function TeamPricingPage() {
  const router = useRouter()
  const params = useParams()
  const competitionId = params.competitionId as string
  const teamId = params.teamId as string
  const qc = useQueryClient()
  const toast = useToastStore()

  const [pendingPrices, setPendingPrices] = useState<Record<string, number>>({})
  const [checkedPlayers, setCheckedPlayers] = useState<Set<string>>(new Set())

  const { data: pricing, isLoading } = useQuery({
    queryKey: ['player-pricing', competitionId, teamId],
    queryFn: () => getPlayerPricing(competitionId, teamId) as Promise<{ team: any; players: (FantasyPlayer & { squadStatus?: string })[] }>,
  })

  const updatePriceMutation = useMutation({
    mutationFn: ({ playerId, price }: { playerId: string; price: number }) =>
      setPlayerPrice(competitionId, teamId, playerId, tierFromPrice(price), price),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['player-pricing', competitionId, teamId] })
      // auto-check after saving
      setCheckedPlayers(prev => new Set(Array.from(prev).concat(variables.playerId)))
    },
    onError: (err) => toast.addToast(getErrorMessage(err), 'error'),
  })

  const finalizeMutation = useMutation({
    mutationFn: () => finalizeTeamPricing(competitionId, teamId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['player-pricing', competitionId, teamId] })
      qc.invalidateQueries({ queryKey: ['team-pricing', competitionId] })
      toast.addToast('Pricing saved!', 'success')
      router.back()
    },
    onError: (err) => toast.addToast(getErrorMessage(err), 'error'),
  })

  const players: any[] = (pricing as any)?.data?.players || (pricing as any)?.players || []
  const team: any = (pricing as any)?.data?.team || (pricing as any)?.team || {}

  const getPrice = (p: any) => {
    if (pendingPrices[p._id] !== undefined) return pendingPrices[p._id]
    return p.price ?? 7.5
  }

  const adjustPrice = (playerId: string, currentPrice: number, delta: number) => {
    const newPrice = Math.min(PRICE_MAX, Math.max(PRICE_MIN, Math.round((currentPrice + delta) * 10) / 10))
    setPendingPrices(prev => ({ ...prev, [playerId]: newPrice }))
  }

  const toggleCheck = (p: any) => {
    const price = getPrice(p)
    if (checkedPlayers.has(p._id)) {
      // uncheck — just remove from set
      setCheckedPlayers(prev => {
        const next = new Set(prev)
        next.delete(p._id)
        return next
      })
    } else {
      // check = save price
      updatePriceMutation.mutate({ playerId: p._id, price })
      setCheckedPlayers(prev => new Set(Array.from(prev).concat(p._id)))
    }
  }

  const handleSave = () => {
    finalizeMutation.mutate()
  }

  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null)
  const [priceInputValue, setPriceInputValue] = useState('')

  const openPriceModal = (p: any) => {
    setEditingPlayerId(p._id)
    setPriceInputValue(getPrice(p).toString())
  }

  const saveModalPrice = () => {
    if (!editingPlayerId) return
    const numeric = parseFloat(priceInputValue)
    if (!isNaN(numeric)) {
      const clamped = Math.min(PRICE_MAX, Math.max(PRICE_MIN, Math.round(numeric * 10) / 10))
      setPendingPrices(prev => ({ ...prev, [editingPlayerId]: clamped }))
    }
    setEditingPlayerId(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#181928] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF7A00] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#181928] flex flex-col" style={{ maxWidth: 430, margin: '0 auto' }}>
      {/* ── Header ── */}
      <div className="relative flex flex-col items-center pt-12 pb-4 px-6 shrink-0">
        <button
          onClick={() => router.back()}
          className="absolute left-6 top-[52px] w-7 h-7 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ChevronLeft size={16} strokeWidth={2.5} className="text-white" />
        </button>

        <h1 className="text-[17px] font-bold tracking-[0.08em] text-white uppercase">
          {team.name || 'Team'}
        </h1>

        {/* Team logo / badge */}
        <div className="mt-3 w-12 h-12 rounded-full overflow-hidden bg-white/10 border border-white/10 flex items-center justify-center">
          {team.logoUrl ? (
            <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl">⚽</span>
          )}
        </div>
      </div>

      {/* ── Player List ── */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-44 no-scrollbar">
        {/* Owner / Gaffer row */}

        {/* Player rows */}
        {players.map((p: any, i: number) => {
          const price = getPrice(p)
          const isChecked = checkedPlayers.has(p._id) || !!p.price
          const positionColor = POSITION_COLORS[p.position] || '#9CA3AF'
          const tier = tierFromPrice(price)
          const tierStyle = TIER_COLORS[tier]

          return (
            <motion.div
              key={p._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-[#1E2235] border border-white/5 rounded-[24px] p-4 flex items-center gap-3 active:bg-white/5 transition-colors"
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-[#2A2D45] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden relative">
                {p.playerId?.photoUrl ? (
                  <img src={p.playerId.photoUrl} className="w-full h-full object-cover" alt="" />
                ) : (
                  <User size={20} className="text-white/30" />
                )}
                {/* Position Badge overlay */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border border-[#181928] flex items-center justify-center shadow-lg" style={{ backgroundColor: positionColor }}>
                   <span className="text-[8px] font-black text-white">{p.position}</span>
                </div>
              </div>

              {/* Name + Position */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                   <p className="text-white font-bold text-[14px] truncate leading-tight">
                     {p.playerId?.lastName} {p.playerId?.firstName}
                   </p>
                   {p.playerId?.jerseyNumber && (
                      <span className="text-gaffer-orange text-[10px] font-black italic">#{p.playerId.jerseyNumber}</span>
                   )}
                </div>
                 <div className="flex items-center gap-2 mt-1">
                    <div className={`px-2 py-0.5 rounded border ${
                      p.squadStatus === 'active' 
                        ? 'bg-green-500/10 border-green-400/20 text-green-400' 
                        : p.squadStatus === 'injured' 
                          ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' 
                          : 'bg-red-500/10 border-red-500/20 text-red-500'
                    }`}>
                       <span className="text-[9px] font-black uppercase tracking-widest">{p.squadStatus || 'Active'}</span>
                    </div>

                    <div className={`px-2 py-0.5 rounded border ${tierStyle?.bg} ${tierStyle?.border} ${tierStyle?.text}`}>
                      <span className="text-[9px] font-black uppercase tracking-widest italic">{tier}</span>
                    </div>
                 </div>
              </div>

              {/* Price Display / Stepper */}
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-center justify-center">
                  <button
                    onClick={() => adjustPrice(p._id, price, PRICE_STEP)}
                    className="text-white/20 hover:text-gaffer-orange transition-colors p-1"
                  >
                    <ChevronUp size={14} strokeWidth={3} />
                  </button>
                  <button 
                    onClick={() => openPriceModal(p)}
                    className="flex flex-col items-center px-1"
                  >
                    <span className="text-white font-black text-[15px] tabular-nums leading-none">
                      {price.toFixed(1)}
                    </span>
                    <span className="text-gaffer-orange text-[8px] font-black uppercase mt-0.5">Coins</span>
                  </button>
                  <button
                    onClick={() => adjustPrice(p._id, price, -PRICE_STEP)}
                    className="text-white/20 hover:text-gaffer-orange transition-colors p-1"
                  >
                    <ChevronDown size={14} strokeWidth={3} />
                  </button>
                </div>

                {/* Checkbox */}
                <button
                  onClick={() => toggleCheck(p)}
                  className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
                    isChecked
                      ? 'bg-gaffer-orange border-gaffer-orange shadow-orange-glow'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  {isChecked && <Check size={14} strokeWidth={4} className="text-white" />}
                </button>
              </div>
            </motion.div>
          )
        })}

        {players.length === 0 && (
          <div className="py-16 text-center">
            <User size={40} className="mx-auto text-white/20 mb-3" />
            <p className="text-white/40 text-sm">No players found for this team</p>
          </div>
        )}
      </div>

      {/* ── Save Button ── */}
      <div className="fixed px-6 z-40 w-full" style={{ bottom: 120, maxWidth: 430, left: '50%', transform: 'translateX(-50%)' }}>
        <button
          onClick={handleSave}
          disabled={finalizeMutation.isPending}
          className="w-full h-16 rounded-[24px] font-chakra font-black text-white text-[17px] uppercase tracking-widest shadow-[0_8px_32px_rgba(255,122,0,0.3)] active:scale-[0.98] transition-all disabled:opacity-50"
          style={{
            background: 'linear-gradient(90deg, #FF7A00 0%, #E7000B 100%)',
          }}
        >
          {finalizeMutation.isPending ? 'Propagating...' : 'Set Prices'}
        </button>
      </div>

      {/* ── Numeric Price Modal ── */}
      <AnimatePresence>
        {editingPlayerId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/60 backdrop-blur-md"
               onClick={() => setEditingPlayerId(null)}
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               className="relative w-full max-w-[320px] bg-[#1C1D2B] border border-white/10 rounded-[32px] p-8 space-y-6"
             >
                <div className="text-center space-y-1">
                   <h3 className="font-chakra font-black text-white text-lg uppercase">Set Player Price</h3>
                   <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Budget £4–5.5 · Standard £6–7.5 · Elite £8–10 · Marquee £10.5–12.5</p>
                </div>

                <div className="flex items-center gap-3 bg-black/20 p-4 rounded-2xl border border-white/5">
                   <input 
                     type="number" 
                     step="0.1"
                     autoFocus
                     className="bg-transparent border-none focus:ring-0 text-white font-chakra font-black text-3xl w-full text-center"
                     value={priceInputValue}
                     onChange={(e) => setPriceInputValue(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && saveModalPrice()}
                   />
                   <span className="text-gaffer-orange font-black uppercase text-lg">Ǥ</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <button 
                     onClick={() => setEditingPlayerId(null)}
                     className="py-4 rounded-2xl bg-white/5 text-white/40 font-black uppercase text-[11px] hover:bg-white/10 transition-colors"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={saveModalPrice}
                     className="py-4 rounded-2xl bg-gaffer-orange text-white font-black uppercase text-[11px] shadow-orange-glow"
                   >
                     Apply
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
