'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Share2 } from 'lucide-react'
import { getFantasyRecap, getPendingRecaps, markRecapSeen, type FantasyRecap } from '@/lib/services/recap.service'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/store/toastStore'
import { chipsLine, ordinal, standingLine } from '@/lib/recapFormat'
import { shareRecapImage } from '@/lib/recapShareImage'

function Card({ children, glow = false }: { children: React.ReactNode; glow?: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-center px-8 text-left">
      {glow && <div className="pointer-events-none absolute -right-24 top-1/4 w-80 h-80 rounded-full bg-orange-500/25 blur-3xl" aria-hidden="true" />}
      <div className="relative">{children}</div>
    </div>
  )
}

const small = 'text-sm font-bold uppercase tracking-[0.2em] text-white/55'
const big = 'font-black leading-none text-white'

function buildCards(r: FantasyRecap): React.ReactNode[] {
  const cards: React.ReactNode[] = []
  cards.push(
    <Card key="intro" glow>
      <p className={small}>{r.tournament}</p>
      <h2 className="mt-4 text-4xl font-black leading-tight text-white">Your Fantasy recap</h2>
      <p className="mt-6 text-xl font-semibold text-white/80">{r.managerName}</p>
      <p className="text-white/45">{r.teamName}</p>
      <p className="mt-10 text-sm text-white/45">Tap to see how it went</p>
    </Card>,
  )
  cards.push(
    <Card key="rank" glow>
      <p className={small}>You finished</p>
      <p className={`${big} mt-4 text-[110px]`}>{ordinal(r.rank)}</p>
      <p className="mt-2 text-2xl font-bold text-white/70">of {r.managers} managers</p>
      <p className="mt-8 text-5xl font-black text-orange-400">{r.totalPoints} pts</p>
      <p className="mt-4 text-lg text-white/70">{standingLine(r.rank, r.managers, r.beatPercent)}</p>
    </Card>,
  )
  if (r.bestRound) {
    const diff = Math.round(r.bestRound.points - r.bestRound.average)
    cards.push(
      <Card key="round">
        <p className={small}>Your best round</p>
        <p className="mt-4 text-3xl font-black text-white">{r.bestRound.name}</p>
        <p className={`${big} mt-6 text-[96px] text-orange-400`}>{r.bestRound.points}</p>
        <p className="mt-2 text-xl font-bold text-white/70">points</p>
        {diff > 0 && <p className="mt-6 text-lg text-white/70">That was {diff} more than the average manager scored ({r.bestRound.average}).</p>}
      </Card>,
    )
  }
  if (r.bestCaptain || r.starPlayer) {
    cards.push(
      <Card key="players">
        {r.bestCaptain && (
          <div className="mb-10">
            <p className={small}>Your best captain pick</p>
            <p className="mt-3 text-4xl font-black text-white">{r.bestCaptain.name}</p>
            <p className="mt-2 text-lg text-white/70">{r.bestCaptain.points} points in {r.bestCaptain.round}</p>
          </div>
        )}
        {r.starPlayer && (
          <div>
            <p className={small}>Your star player</p>
            <p className="mt-3 text-4xl font-black text-orange-400">{r.starPlayer.name}</p>
            <p className="mt-2 text-lg text-white/70">{r.starPlayer.points} points for your team</p>
          </div>
        )}
      </Card>,
    )
  }
  cards.push(
    <Card key="moves">
      <p className={small}>Your moves</p>
      <p className={`${big} mt-4 text-[96px]`}>{r.transfers}</p>
      <p className="mt-2 text-xl font-bold text-white/70">{r.transfers === 1 ? 'transfer' : 'transfers'}</p>
      <p className="mt-8 text-lg text-white/80">{chipsLine(r.chips)}</p>
      {r.captainExtra > 0 && <p className="mt-3 text-lg text-white/70">Your captain earned you {r.captainExtra} extra points.</p>}
    </Card>,
  )
  return cards
}

/**
 * Pops up once after sign-in when a tournament the person played Fantasy in has a recap switched on.
 * Tap or swipe through the cards; the last one has their title and a button to share it.
 */
export function FantasyRecapPopup() {
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const { addToast } = useToast()
  const [open, setOpen] = useState(true)
  const [index, setIndex] = useState(0)
  const [sharing, setSharing] = useState(false)
  const touchX = useRef<number | null>(null)

  const pending = useQuery({ queryKey: ['recap-pending'], queryFn: getPendingRecaps, enabled: !!user, staleTime: 5 * 60_000, meta: { suppressGlobalError: true } })
  const target = pending.data?.[0]
  const recap = useQuery({ queryKey: ['recap', target?.competitionId], queryFn: () => getFantasyRecap(target!.competitionId), enabled: !!target, staleTime: 5 * 60_000, retry: false, meta: { suppressGlobalError: true } })

  const close = useCallback(() => {
    setOpen(false)
    if (target) {
      markRecapSeen(target.competitionId).catch(() => undefined)
      qc.setQueryData(['recap-pending'], (old: { competitionId: string; name: string }[] | undefined) => (old ?? []).filter((x) => x.competitionId !== target.competitionId))
    }
  }, [target, qc])

  const data = recap.data
  const cards = data ? buildCards(data) : []
  const last = cards.length // the title card is one past the numbered cards
  const total = cards.length + 1

  const next = () => setIndex((i) => Math.min(total - 1, i + 1))
  const back = () => setIndex((i) => Math.max(0, i - 1))

  useEffect(() => {
    if (!open || !data) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'ArrowRight') next(); else if (e.key === 'ArrowLeft') back(); else if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!open || !target || !data) return null

  const share = async () => {
    setSharing(true)
    try {
      const res = await shareRecapImage(data)
      if (res === 'downloaded') addToast('Picture saved. Post it anywhere.', 'success')
    } catch {
      addToast('Could not make the picture. Try again.', 'error')
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[400] bg-[#0E0F1E] flex flex-col" role="dialog" aria-modal="true" aria-label="Your Fantasy recap">
      <div className="absolute inset-0 bg-gradient-to-br from-[#121428] via-[#1B1630] to-[#3A1A08]" aria-hidden="true" />

      <div className="relative flex gap-1.5 px-4 pt-[calc(env(safe-area-inset-top,0px)+14px)]" aria-hidden="true">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="h-1 flex-1 rounded-full bg-white/20 overflow-hidden"><div className={`h-full bg-orange-500 transition-all duration-300 ${i <= index ? 'w-full' : 'w-0'}`} /></div>
        ))}
      </div>
      <div className="relative flex items-center justify-between px-4 pt-3">
        <span className="text-orange-400 font-black tracking-widest text-sm">GAFFER</span>
        <button onClick={close} aria-label="Close recap" className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center"><X size={20} /></button>
      </div>

      <div
        className="relative flex-1"
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX }}
        onTouchEnd={(e) => {
          if (touchX.current == null) return
          const dx = e.changedTouches[0].clientX - touchX.current
          touchX.current = null
          if (dx < -50) next(); else if (dx > 50) back()
        }}
      >
        {index < last ? cards[index] : (
          <Card glow>
            <p className={small}>Your Fantasy title</p>
            <h2 className="mt-4 text-5xl font-black leading-tight text-orange-400">{data.title}</h2>
            <p className="mt-4 text-lg text-white/75">{data.titleLine}</p>
            <div className="mt-8 rounded-3xl bg-white/5 border border-white/10 p-5">
              <p className="text-white font-black text-2xl">{ordinal(data.rank)} <span className="text-white/60 text-base font-bold">of {data.managers}</span></p>
              <p className="text-orange-400 font-black text-3xl mt-1">{data.totalPoints} pts</p>
              <p className="text-white/50 text-sm mt-1">{data.tournament}</p>
            </div>
            <button onClick={share} disabled={sharing} className="mt-8 w-full h-14 rounded-full bg-orange-500 text-black font-black flex items-center justify-center gap-2 disabled:opacity-60">
              <Share2 size={20} /> {sharing ? 'Making your picture…' : 'Share my recap'}
            </button>
            <button onClick={close} className="mt-3 w-full h-12 rounded-full border border-white/20 text-white font-bold">Done</button>
          </Card>
        )}
        {/* Tap the left or right side to move */}
        {index < last && (
          <>
            <button onClick={back} aria-label="Previous" className="absolute inset-y-0 left-0 w-1/3" />
            <button onClick={next} aria-label="Next" className="absolute inset-y-0 right-0 w-2/3" />
          </>
        )}
      </div>
      <div className="relative pb-[calc(env(safe-area-inset-bottom,0px)+16px)] text-center text-xs text-white/40">{index + 1} of {total}</div>
    </div>
  )
}
