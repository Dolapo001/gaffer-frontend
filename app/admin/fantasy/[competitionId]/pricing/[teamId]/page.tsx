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

const PRICE_STEP = 0.5

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
    queryFn: () => getPlayerPricing(competitionId, teamId) as Promise<{ team: any; players: FantasyPlayer[] }>,
  })

  const updatePriceMutation = useMutation({
    mutationFn: ({ playerId, price }: { playerId: string; price: number }) =>
      setPlayerPrice(competitionId, teamId, playerId, 'standard', price),
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

  const players: any[] = (pricing as any)?.players || []
  const team: any = (pricing as any)?.team || {}

  const getPrice = (p: any) => {
    if (pendingPrices[p._id] !== undefined) return pendingPrices[p._id]
    return p.price ?? 7.5
  }

  const adjustPrice = (playerId: string, currentPrice: number, delta: number) => {
    const newPrice = Math.max(0.5, Math.round((currentPrice + delta) * 10) / 10)
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
      <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-44">
        {/* Owner / Gaffer row */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1E2235] rounded-2xl p-4 flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-full bg-[#5BB5D5] flex items-center justify-center shrink-0 overflow-hidden">
            {team.ownerAvatarUrl ? (
              <img src={team.ownerAvatarUrl} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full bg-[#5BB5D5] rounded-full" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-[15px] truncate">
              {team.ownerName || team.name || 'Unknown'}
            </p>
            <p className="text-[11px] text-white/40 uppercase tracking-widest">THE GAFFER</p>
          </div>
          <span className="text-[#FF8904] text-[13px] font-bold">Add Price</span>
        </motion.div>

        {/* Player rows */}
        {players.map((p: any, i: number) => {
          const price = getPrice(p)
          const isChecked = checkedPlayers.has(p._id) || !!p.price
          const positionColor = POSITION_COLORS[p.position] || '#9CA3AF'

          return (
            <motion.div
              key={p._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-[#1E2235] rounded-2xl p-4 flex items-center gap-3"
            >
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full bg-[#2A2D45] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                {p.playerId?.avatarUrl ? (
                  <img src={p.playerId.avatarUrl} className="w-full h-full object-cover" alt="" />
                ) : (
                  <User size={20} className="text-white/30" />
                )}
              </div>

              {/* Name + Position */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-[14px] truncate leading-tight">
                  {p.playerId?.lastName} {p.playerId?.firstName}
                </p>
                <p className="text-[11px] font-medium truncate mt-0.5" style={{ color: positionColor }}>
                  {p.position === 'GK' ? 'Goalkeeper' :
                   p.position === 'DEF' ? 'Center Back' :
                   p.position === 'MID' ? 'Midfielder' :
                   p.position === 'FWD' ? 'Forward' : p.position}
                </p>
              </div>

              {/* Price stepper */}
              <div className="flex flex-col items-center justify-center mr-1">
                <button
                  onClick={() => adjustPrice(p._id, price, PRICE_STEP)}
                  className="text-white/40 hover:text-white/70 transition-colors p-0.5"
                >
                  <ChevronUp size={15} strokeWidth={2.5} />
                </button>
                <span className="text-white font-bold text-[14px] leading-4 my-0.5 tabular-nums">
                  {price.toFixed(1)}M
                </span>
                <button
                  onClick={() => adjustPrice(p._id, price, -PRICE_STEP)}
                  className="text-white/40 hover:text-white/70 transition-colors p-0.5"
                >
                  <ChevronDown size={15} strokeWidth={2.5} />
                </button>
              </div>

              {/* Checkbox */}
              <button
                onClick={() => toggleCheck(p)}
                className={`w-6 h-6 rounded-[5px] border-2 flex items-center justify-center transition-all shrink-0 ${
                  isChecked
                    ? 'bg-[#FF7A00] border-[#FF7A00]'
                    : 'border-white/20 bg-transparent'
                }`}
              >
                {isChecked && <Check size={13} strokeWidth={3} className="text-white" />}
              </button>
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
      {/* Nav bar: bottom-8 (32px) + 88px height = 120px. Add 12px gap = 132px */}
      <div className="fixed px-4 z-30 w-full" style={{ bottom: 132, maxWidth: 430, left: '50%', transform: 'translateX(-50%)' }}>
        <button
          onClick={handleSave}
          disabled={finalizeMutation.isPending}
          className="w-full py-[18px] rounded-[18px] font-bold text-white text-[17px] shadow-[0_4px_24px_rgba(255,60,0,0.35)] active:scale-[0.98] transition-all disabled:opacity-50"
          style={{
            background: 'linear-gradient(90deg, #FF7A00 0%, #E7000B 100%)',
          }}
        >
          {finalizeMutation.isPending ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}
