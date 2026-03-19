'use client'

import React, { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ChevronLeft, DollarSign, CheckCircle2, AlertCircle, Edit2, 
  Save, X, MoreVertical, ShieldAlert
} from 'lucide-react'
import { 
  getPlayerPricing, 
  setPlayerPrice, 
  finalizeTeamPricing,
  validateTeamPricing,
  type FantasyPlayer
} from '@/lib/services/fantasy.service'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'

const TIERS = [
  { label: 'Marquee', value: 'marquee', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
  { label: 'Elite', value: 'elite', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
  { label: 'Standard', value: 'standard', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
  { label: 'Budget', value: 'budget', color: 'text-gaffer-muted', bg: 'bg-white/5', border: 'border-white/5' },
]

export default function TeamPricingPage() {
  const router = useRouter()
  const params = useParams()
  const competitionId = params.competitionId as string
  const teamId = params.teamId as string
  const qc = useQueryClient()
  const toast = useToastStore()
  
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null)
  const [form, setForm] = useState<{ price: string; tier: string }>({ price: '', tier: 'standard' })

  const { data: pricing, isLoading } = useQuery({
    queryKey: ['player-pricing', competitionId, teamId],
    queryFn: () => getPlayerPricing(competitionId, teamId) as Promise<{ team: any; players: FantasyPlayer[] }>,
  })

  const updatePriceMutation = useMutation({
    mutationFn: ({ playerId, tier, price }: { playerId: string; tier: any; price: number }) => 
      setPlayerPrice(competitionId, teamId, playerId, tier, price),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['player-pricing', competitionId, teamId] })
      toast.addToast('Price updated', 'success')
      setEditingPlayer(null)
    },
    onError: (err) => toast.addToast(getErrorMessage(err), 'error')
  })

  const finalizeMutation = useMutation({
    mutationFn: () => finalizeTeamPricing(competitionId, teamId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['player-pricing', competitionId, teamId] })
      qc.invalidateQueries({ queryKey: ['team-pricing', competitionId] })
      toast.addToast('Pricing finalized for team', 'success')
      router.back()
    },
    onError: (err) => toast.addToast(getErrorMessage(err), 'error')
  })

  const players = pricing?.players || []
  const team = pricing?.team || {}
  const allPriced = players.every(p => !!p.price)

  const handleEdit = (player: any) => {
    setEditingPlayer(player._id)
    setForm({ price: player.price?.toString() || '4.5', tier: player.tier || 'standard' })
  }

  const handleSave = (playerId: string) => {
    const priceNum = parseFloat(form.price)
    if (isNaN(priceNum)) return toast.addToast('Invalid price', 'error')
    updatePriceMutation.mutate({ playerId, tier: form.tier, price: priceNum })
  }

  if (isLoading) return <div className="h-screen bg-gaffer-bg flex items-center justify-center animate-pulse text-gaffer-orange">Loading Pricing...</div>

  return (
    <div className="min-h-screen bg-gaffer-bg flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gaffer-bg/95 backdrop-blur-md border-b border-gaffer-border/50">
        <div className="flex items-center gap-3 px-4 pt-12 pb-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gaffer-card border border-gaffer-border text-white shadow-lg active:scale-90 transition-transform">
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
             <h1 className="font-display font-black text-base text-white truncate uppercase tracking-tight">{team.name || 'Team Pricing'}</h1>
             <p className="text-[10px] font-body text-gaffer-muted uppercase tracking-widest leading-none">Management</p>
          </div>
          {allPriced && !team.pricingFinalized && (
            <button 
              onClick={() => finalizeMutation.mutate()}
              disabled={finalizeMutation.isPending}
              className="px-4 py-2 rounded-xl bg-orange-gradient-btn text-white font-display font-bold text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50"
            >
              Finalize
            </button>
          )}
          {team.pricingFinalized && (
            <div className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 font-display font-black text-[9px] uppercase italic tracking-tighter">FINALIZED</div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 pb-32 space-y-4">
        {players.map((p: any, i: number) => {
          const isEditing = editingPlayer === p._id
          const tier = TIERS.find(t => t.value === p.tier) || TIERS[2]

          return (
            <motion.div 
              key={p._id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`bg-gaffer-card border rounded-2xl p-4 transition-all ${
                isEditing ? 'border-gaffer-orange shadow-[0_0_15px_rgba(255,137,4,0.1)]' : 'border-gaffer-border'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gaffer-surface border border-gaffer-border flex flex-col items-center justify-center text-white/40 overflow-hidden relative group">
                   {p.playerId.avatarUrl ? <img src={p.playerId.avatarUrl} className="w-full h-full object-cover" /> : <MoreVertical size={16} />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-white text-sm truncate uppercase tracking-tight">
                    {p.playerId.firstName} {p.playerId.lastName}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-body font-bold text-gaffer-muted uppercase tracking-wider">{p.position}</span>
                    {p.price && !isEditing && (
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${tier.bg} ${tier.color} ${tier.border} border`}>
                        {tier.label}
                      </span>
                    )}
                  </div>
                </div>

                {!isEditing ? (
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                       <p className={`font-display font-black text-lg leading-none ${p.price ? 'text-white' : 'text-gaffer-muted animate-pulse'}`}>
                         {p.price ? `${p.price}M` : '0.0M'}
                       </p>
                       <button onClick={() => handleEdit(p)} className="p-2 text-gaffer-muted hover:text-gaffer-orange transition-colors">
                         <Edit2 size={13} />
                       </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleSave(p._id)} className="w-8 h-8 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center active:scale-90 transition-transform">
                      <Save size={14} />
                    </button>
                    <button onClick={() => setEditingPlayer(null)} className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center active:scale-90 transition-transform">
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              <AnimatePresence>
                {isEditing && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 mt-4 border-t border-gaffer-border/50 grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-body font-bold text-gaffer-subtle uppercase tracking-widest mb-1.5 block">Price (Million)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gaffer-subtle" size={14} />
                          <input 
                            type="number" 
                            step="0.1"
                            value={form.price}
                            onChange={(e) => setForm({ ...form, price: e.target.value })}
                            className="w-full bg-gaffer-surface border border-gaffer-border rounded-xl pl-8 pr-4 py-2 text-sm font-display font-black text-white focus:outline-none focus:border-gaffer-orange"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-body font-bold text-gaffer-subtle uppercase tracking-widest mb-1.5 block">Player Tier</label>
                        <select 
                          value={form.tier}
                          onChange={(e) => setForm({ ...form, tier: e.target.value })}
                          className="w-full bg-gaffer-surface border border-gaffer-border rounded-xl px-4 py-2 text-sm font-display font-bold text-white focus:outline-none focus:border-gaffer-orange appearance-none"
                        >
                          {TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Stats Summary */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-gaffer-bg/80 backdrop-blur-xl border-t border-gaffer-border/50 z-30">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-chakra font-black text-gaffer-muted uppercase tracking-widest">Pricing Progress</span>
            <div className="flex items-center gap-2 mt-1">
               <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                 <motion.div 
                   className="h-full bg-gradient-to-r from-gaffer-orange to-red-600"
                   initial={{ width: 0 }}
                   animate={{ width: `${(players.filter((p: any) => !!p.price).length / players.length) * 100}%` }}
                 />
               </div>
               <span className="text-xs font-display font-black text-white italic">
                 {players.filter((p: any) => !!p.price).length}/{players.length}
               </span>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
             <span className="text-[10px] font-chakra font-black text-gaffer-muted uppercase tracking-widest">Avg Price</span>
             <p className="text-lg font-display font-black text-white leading-none mt-1">
               £{(players.reduce((acc: number, p: any) => acc + (p.price || 0), 0) / (players.filter((p: any) => !!p.price).length || 1)).toFixed(1)}M
             </p>
          </div>
        </div>
      </div>
    </div>
  )
}
