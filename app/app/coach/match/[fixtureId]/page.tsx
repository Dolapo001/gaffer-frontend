'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Check } from 'lucide-react'
import { getMyCoachTeams, submitCoachLineup } from '@/lib/services/coach.service'
import { useToast } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'

const MAX = 11
const order = ['GK', 'DEF', 'MID', 'FWD']
const rank = (pos: string | null) => { const i = order.indexOf((pos ?? '').toUpperCase().slice(0, 3)); return i === -1 ? 9 : i }

/** The coach picks the starting lineup for one match: tick up to 11 players from the squad. */
export default function CoachLineupPage() {
  const { fixtureId } = useParams<{ fixtureId: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const { addToast } = useToast()
  const { data: teams, isLoading } = useQuery({ queryKey: ['coach-teams'], queryFn: getMyCoachTeams })

  const found = useMemo(() => {
    for (const t of teams ?? []) {
      const f = t.fixtures.find((x) => x.id === fixtureId)
      if (f) return { team: t, fixture: f }
    }
    return null
  }, [teams, fixtureId])

  const [picked, setPicked] = useState<string[]>([])
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  useEffect(() => {
    if (found && loadedFor !== fixtureId) {
      setPicked(found.fixture.lineup?.starters ?? [])
      setLoadedFor(fixtureId)
    }
  }, [found, fixtureId, loadedFor])

  const save = useMutation({
    mutationFn: () => submitCoachLineup(fixtureId, picked),
    onSuccess: () => { addToast('Starting lineup sent to the organiser.', 'success'); qc.invalidateQueries({ queryKey: ['coach-teams'] }); router.replace('/app/coach') },
    onError: (e) => addToast(getErrorMessage(e), 'error'),
  })

  const toggle = (id: string) => setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= MAX ? cur : [...cur, id]))

  if (isLoading) return <div className="min-h-screen bg-[#181928] p-5"><div className="h-40 rounded-3xl bg-white/5 animate-pulse" /></div>
  if (!found) {
    return (
      <div className="min-h-screen bg-[#181928] p-5 space-y-4">
        <button onClick={() => router.replace('/app/coach')} className="flex items-center gap-1 text-white/70 text-sm font-semibold"><ChevronLeft size={18} /> Back</button>
        <p className="text-white/60">This match was not found, or it is not one of your team&apos;s upcoming matches.</p>
      </div>
    )
  }

  const { team, fixture } = found
  const locked = fixture.status !== 'scheduled'
  const squad = [...team.squad].sort((a, b) => rank(a.position) - rank(b.position) || (a.jerseyNumber ?? 99) - (b.jerseyNumber ?? 99))

  return (
    <div className="min-h-screen bg-[#181928] px-5 pt-6" style={{ paddingBottom: 'calc(200px + env(safe-area-inset-bottom, 0px))' }}>
      <button onClick={() => router.back()} className="flex items-center gap-1 text-white/70 text-sm font-semibold"><ChevronLeft size={18} /> Back</button>
      <h1 className="text-white font-black text-2xl mt-4">Starting lineup</h1>
      <p className="text-white/50 text-sm mt-1">{team.name} {fixture.home ? 'v' : '@'} {fixture.opponent?.name ?? 'Opponent'}</p>

      {locked && <p className="mt-4 text-sm text-amber-300 bg-amber-500/10 rounded-2xl p-3">This match has started, so the lineup is locked. Ask the organiser for changes.</p>}

      <p className="mt-5 text-sm font-bold text-white">{picked.length} of {MAX} picked</p>
      <ul className="mt-2 space-y-2">
        {squad.map((p) => {
          const on = picked.includes(p.id)
          const full = !on && picked.length >= MAX
          return (
            <li key={p.id}>
              <button
                onClick={() => !locked && toggle(p.id)}
                disabled={locked || full}
                aria-pressed={on}
                className={`w-full min-h-[56px] flex items-center gap-3 px-4 rounded-2xl border text-left transition ${on ? 'border-orange-400 bg-orange-500/15' : 'border-white/10 bg-[#1E2032]'} ${full ? 'opacity-40' : ''}`}
              >
                <span className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 ${on ? 'bg-orange-500 border-orange-500 text-black' : 'border-white/30'}`}>{on && <Check size={16} />}</span>
                <span className="w-8 text-center text-white/40 text-sm font-bold">{p.jerseyNumber ?? ''}</span>
                <span className="flex-1 min-w-0 text-white text-sm font-semibold truncate">{p.name}</span>
                {p.position && <span className="text-xs text-white/50 uppercase">{p.position}</span>}
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-4 text-xs text-white/40">Everyone you do not pick is a substitute. The organiser can still change the lineup, and it is confirmed at kick-off.</p>

      {!locked && (
        <div className="fixed left-0 right-0 px-5" style={{ bottom: 'calc(120px + env(safe-area-inset-bottom, 0px))' }}>
          <button onClick={() => save.mutate()} disabled={picked.length === 0 || save.isPending} className="w-full h-12 rounded-full bg-orange-500 text-black font-black text-sm shadow-lg disabled:opacity-40">
            {save.isPending ? 'Sending…' : 'Send lineup'}
          </button>
        </div>
      )}
    </div>
  )
}
