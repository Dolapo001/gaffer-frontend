'use client'

import React, { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, User, Check, Zap } from 'lucide-react'
import {
  getPlayerPricing,
  setPlayerPrice,
  finalizeTeamPricing,
  type FantasyPlayer
} from '@/lib/services/fantasy.service'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'

type Tier = 'budget' | 'standard' | 'elite' | 'marquee'

const POSITION_COLORS: Record<string, string> = {
  GK: '#9CA3AF',
  DEF: '#22C55E',
  MID: '#3B82F6',
  FWD: '#EF4444',
}

const TIER_CONFIG: Record<Tier, { label: string; bg: string; text: string; activeBg: string; activeBorder: string }> = {
  budget:   { label: 'Budget',   bg: 'bg-white/5',        text: 'text-white/30',   activeBg: 'bg-green-500/20',  activeBorder: 'border-green-400' },
  standard: { label: 'Standard', bg: 'bg-white/5',        text: 'text-white/30',   activeBg: 'bg-blue-400/20',   activeBorder: 'border-blue-400' },
  elite:    { label: 'Elite',    bg: 'bg-white/5',        text: 'text-white/30',   activeBg: 'bg-purple-500/20', activeBorder: 'border-purple-400' },
  marquee:  { label: 'Marquee',  bg: 'bg-white/5',        text: 'text-white/30',   activeBg: 'bg-orange-500/20', activeBorder: 'border-gaffer-orange' },
}

// Default price per tier per position — midpoint of tier range, position-adjusted
const TIER_PRICES: Record<string, Record<Tier, number>> = {
  GK:  { budget: 4.0, standard: 5.0, elite: 7.0, marquee: 10.5 },
  DEF: { budget: 4.0, standard: 5.0, elite: 7.5, marquee: 10.5 },
  MID: { budget: 4.0, standard: 5.0, elite: 7.5, marquee: 11.0 },
  FWD: { budget: 4.5, standard: 5.5, elite: 8.0, marquee: 11.5 },
}

function tierFromPrice(price: number): Tier {
  if (price >= 9.5) return 'marquee'
  if (price >= 6.5) return 'elite'
  if (price >= 4.5) return 'standard'
  return 'budget'
}

export default function TeamPricingPage() {
  const router = useRouter()
  const params = useParams()
  const competitionId = params.competitionId as string
  const teamId = params.teamId as string
  const qc = useQueryClient()
  const toast = useToastStore()

  const [pendingTiers, setPendingTiers] = useState<Record<string, Tier>>({})
  const [checkedPlayers, setCheckedPlayers] = useState<Set<string>>(new Set())
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null)
  const [priceInputValue, setPriceInputValue] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)

  const { data: pricing, isLoading } = useQuery({
    queryKey: ['player-pricing', competitionId, teamId],
    queryFn: () => getPlayerPricing(competitionId, teamId) as Promise<{ team: any; players: (FantasyPlayer & { squadStatus?: string })[] }>,
  })

  const updatePriceMutation = useMutation({
    mutationFn: ({ playerId, tier, price }: { playerId: string; tier: Tier; price: number }) =>
      setPlayerPrice(competitionId, teamId, playerId, tier, price),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['player-pricing', competitionId, teamId] })
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

  const getPlayerTier = (p: any): Tier => {
    if (pendingTiers[p._id]) return pendingTiers[p._id]
    if (p.tier) return p.tier as Tier
    return tierFromPrice(p.price ?? 4.5)
  }

  const getPrice = (p: any): number => {
    const tier = getPlayerTier(p)
    const pos = p.position || 'MID'
    return TIER_PRICES[pos]?.[tier] ?? TIER_PRICES['MID'][tier]
  }

  const applyTier = (p: any, tier: Tier) => {
    const pos = p.position || 'MID'
    const price = TIER_PRICES[pos]?.[tier] ?? TIER_PRICES['MID'][tier]
    setPendingTiers(prev => ({ ...prev, [p._id]: tier }))
    updatePriceMutation.mutate({ playerId: p._id, tier, price })
  }

  const handleBulkSet = async (tier: Tier) => {
    setBulkLoading(true)
    for (const p of players) {
      const pos = p.position || 'MID'
      const price = TIER_PRICES[pos]?.[tier] ?? TIER_PRICES['MID'][tier]
      setPendingTiers(prev => ({ ...prev, [p._id]: tier }))
      try {
        await setPlayerPrice(competitionId, teamId, p._id, tier, price)
      } catch (e) {
        toast.addToast(`Failed for ${p.playerId?.lastName}: ${getErrorMessage(e)}`, 'error')
      }
    }
    qc.invalidateQueries({ queryKey: ['player-pricing', competitionId, teamId] })
    setCheckedPlayers(new Set(players.map((p: any) => p._id)))
    setBulkLoading(false)
    toast.addToast(`All players set to ${tier}`, 'success')
  }

  const openPriceModal = (p: any) => {
    setEditingPlayerId(p._id)
    setPriceInputValue(getPrice(p).toString())
  }

  const saveModalPrice = () => {
    if (!editingPlayerId) return
    const numeric = parseFloat(priceInputValue)
    if (!isNaN(numeric)) {
      const clamped = Math.min(14.0, Math.max(3.5, Math.round(numeric * 10) / 10))
      const tier = tierFromPrice(clamped)
      const p = players.find((pl: any) => pl._id === editingPlayerId)
      if (p) {
        setPendingTiers(prev => ({ ...prev, [editingPlayerId]: tier }))
        updatePriceMutation.mutate({ playerId: editingPlayerId, tier, price: clamped })
      }
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

  const allChecked = players.length > 0 && players.every((p: any) => checkedPlayers.has(p._id) || !!p.price)

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

        <div className="mt-3 w-12 h-12 rounded-full overflow-hidden bg-white/10 border border-white/10 flex items-center justify-center">
          {team.logoUrl ? (
            <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl">⚽</span>
          )}
        </div>

        {/* Progress bar */}
        {players.length > 0 && (
          <div className="mt-4 w-full">
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Priced</span>
              <span className="text-[10px] text-white/50 font-bold">
                {players.filter((p: any) => checkedPlayers.has(p._id) || !!p.price).length}/{players.length}
              </span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gaffer-orange rounded-full transition-all"
                style={{ width: `${(players.filter((p: any) => checkedPlayers.has(p._id) || !!p.price).length / players.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Quick Set All ── */}
      <div className="px-4 mb-3 shrink-0">
        <div className="bg-[#1E2235] border border-white/5 rounded-[20px] p-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={12} className="text-gaffer-orange" />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Quick Set All Players</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {(['budget', 'standard', 'elite', 'marquee'] as Tier[]).map(tier => {
              const cfg = TIER_CONFIG[tier]
              return (
                <button
                  key={tier}
                  onClick={() => handleBulkSet(tier)}
                  disabled={bulkLoading}
                  className={`py-2 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-40 ${cfg.activeBg} ${cfg.activeBorder}`}
                  style={{ color: tier === 'marquee' ? '#FF7A00' : tier === 'elite' ? '#A855F7' : tier === 'standard' ? '#60A5FA' : '#4ADE80' }}
                >
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Player List ── */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2.5 pb-44 no-scrollbar">
        {players.map((p: any, i: number) => {
          const currentTier = getPlayerTier(p)
          const price = getPrice(p)
          const isChecked = checkedPlayers.has(p._id) || !!p.price
          const positionColor = POSITION_COLORS[p.position] || '#9CA3AF'
          const isSaving = updatePriceMutation.isPending && (updatePriceMutation.variables as any)?.playerId === p._id

          return (
            <motion.div
              key={p._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="bg-[#1E2235] border border-white/5 rounded-[20px] p-3"
            >
              {/* Top row: avatar + name + check */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#2A2D45] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden relative">
                  {p.playerId?.photoUrl ? (
                    <img src={p.playerId.photoUrl} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <User size={16} className="text-white/30" />
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border border-[#181928] flex items-center justify-center" style={{ backgroundColor: positionColor }}>
                    <span className="text-[6px] font-black text-white">{p.position}</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-[13px] truncate leading-tight">
                    {p.playerId?.lastName} {p.playerId?.firstName}
                    {p.playerId?.jerseyNumber && (
                      <span className="text-gaffer-orange text-[9px] font-black italic ml-1">#{p.playerId.jerseyNumber}</span>
                    )}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                      p.squadStatus === 'active' ? 'bg-green-500/10 text-green-400'
                      : p.squadStatus === 'injured' ? 'bg-yellow-500/10 text-yellow-500'
                      : 'bg-red-500/10 text-red-500'
                    }`}>{p.squadStatus || 'Active'}</span>
                  </div>
                </div>

                {/* Price + check */}
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => openPriceModal(p)} className="text-right">
                    <span className="text-white font-black text-[15px] tabular-nums leading-none block">{price.toFixed(1)}</span>
                    <span className="text-gaffer-orange text-[7px] font-black uppercase">Coins</span>
                  </button>
                  <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                    isChecked ? 'bg-gaffer-orange border-gaffer-orange' : 'border-white/10 bg-white/5'
                  }`}>
                    {isSaving ? (
                      <div className="w-3 h-3 rounded-full border border-white border-t-transparent animate-spin" />
                    ) : isChecked ? (
                      <Check size={11} strokeWidth={4} className="text-white" />
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Tier buttons */}
              <div className="grid grid-cols-4 gap-1">
                {(['budget', 'standard', 'elite', 'marquee'] as Tier[]).map(tier => {
                  const cfg = TIER_CONFIG[tier]
                  const isActive = currentTier === tier
                  const tierPrice = TIER_PRICES[p.position || 'MID']?.[tier]

                  return (
                    <button
                      key={tier}
                      onClick={() => applyTier(p, tier)}
                      disabled={isSaving}
                      className={`py-2 rounded-xl border transition-all disabled:opacity-40 ${
                        isActive ? `${cfg.activeBg} ${cfg.activeBorder}` : 'bg-white/5 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className={`text-[8px] font-black uppercase tracking-wider ${
                        isActive
                          ? tier === 'marquee' ? 'text-gaffer-orange' : tier === 'elite' ? 'text-purple-400' : tier === 'standard' ? 'text-blue-400' : 'text-green-400'
                          : 'text-white/25'
                      }`}>{cfg.label}</div>
                      <div className={`text-[9px] font-black tabular-nums mt-0.5 ${isActive ? 'text-white' : 'text-white/20'}`}>
                        £{tierPrice?.toFixed(1)}
                      </div>
                    </button>
                  )
                })}
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
          onClick={() => finalizeMutation.mutate()}
          disabled={finalizeMutation.isPending}
          className="w-full h-16 rounded-[24px] font-chakra font-black text-white text-[17px] uppercase tracking-widest shadow-[0_8px_32px_rgba(255,122,0,0.3)] active:scale-[0.98] transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(90deg, #FF7A00 0%, #E7000B 100%)' }}
        >
          {finalizeMutation.isPending ? 'Saving...' : allChecked ? 'Confirm Pricing' : 'Set Prices'}
        </button>
      </div>

      {/* ── Fine-tune Price Modal ── */}
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
                <h3 className="font-chakra font-black text-white text-lg uppercase">Fine-tune Price</h3>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Budget £3.5–4.5 · Standard £4.5–6 · Elite £6.5–9 · Marquee £9.5–14</p>
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
