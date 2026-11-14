'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { getMyCoachTeams, submitCoachLineup } from '@/lib/services/coach.service'
import { useToast } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'
import { formatDateTime } from '@/lib/dates'
import { LineupEditor, duplicateNumbers, initialSpots, type SpotMap } from '@/components/match/LineupEditor'
import { defaultFormation, formationString, parseFormation } from '@/lib/lineupFormation'

/** The coach picks the starting lineup for one match on a pitch: formation, who plays where, and the substitutes. */
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

  const playersPerSide = found?.fixture.playersPerSide ?? 11
  const [formation, setFormation] = useState<string>('')
  const [spots, setSpots] = useState<SpotMap>({})
  const [dirty, setDirty] = useState(false)
  const [loadedFor, setLoadedFor] = useState<string | null>(null)

  // Start from what was saved (by the coach or the organiser)
  useEffect(() => {
    if (!found || loadedFor === fixtureId) return
    const f = found.fixture
    const shape = formationString(parseFormation(f.formation || defaultFormation(playersPerSide), playersPerSide))
    setFormation(shape)
    setSpots(initialSpots({
      starters: f.lineup?.starters ?? [],
      slots: f.lineup?.slots,
      zones: parseFormation(shape, playersPerSide),
      squad: found.team.squad,
      playersPerSide,
    }))
    setDirty(false)
    setLoadedFor(fixtureId)
  }, [found, fixtureId, loadedFor, playersPerSide])

  const placedCount = Object.keys(spots).length
  const save = useMutation({
    mutationFn: () => {
      const order = Object.keys(spots).map(Number).sort((a, b) => a - b)
      return submitCoachLineup(fixtureId, order.map((i) => spots[i]), {
        formation,
        slots: order.map((i) => ({ playerId: spots[i], positionIndex: i })),
      })
    },
    onSuccess: () => {
      addToast('Lineup sent to the organiser.', 'success')
      setDirty(false)
      qc.invalidateQueries({ queryKey: ['coach-teams'] })
    },
    onError: (e) => addToast(getErrorMessage(e), 'error'),
  })

  if (isLoading) return <div className="min-h-screen bg-[#181928] p-5"><div className="h-40 animate-pulse rounded-3xl bg-white/5" /></div>
  if (!found) {
    return (
      <div className="min-h-screen space-y-4 bg-[#181928] p-5">
        <button onClick={() => router.replace('/coach')} className="flex items-center gap-1 text-sm font-semibold text-white/70"><ChevronLeft size={18} /> Back</button>
        <p className="text-white/60">This match was not found, or it is not one of your team&apos;s upcoming matches.</p>
      </div>
    )
  }

  const { team, fixture } = found
  const locked = fixture.status !== 'scheduled'
  const dupes = duplicateNumbers(team.squad)
  const saved = fixture.lineup
  const missing = playersPerSide - placedCount

  return (
    <div className="min-h-screen bg-[#181928] pt-6" style={{ paddingBottom: 'calc(130px + env(safe-area-inset-bottom, 0px))' }}>
      <div className="px-4">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm font-semibold text-white/70"><ChevronLeft size={18} /> Back</button>
        <h1 className="mt-4 font-body text-[24px] font-bold text-white">Starting lineup</h1>
        <p className="mt-0.5 font-body text-[14px] text-white/55">
          {team.name} {fixture.home ? 'v' : 'at'} {fixture.opponent?.name ?? 'their opponent'} · {formatDateTime(fixture.kickoffAt)}
        </p>

        {/* Where things stand */}
        {locked ? (
          <p className="mt-4 rounded-2xl bg-amber-500/10 p-3 font-body text-[14px] text-amber-300">This match has started, so the lineup is locked. Ask the organiser for changes.</p>
        ) : saved?.setBy === 'organiser' ? (
          <p className="mt-4 rounded-2xl bg-white/[0.06] p-3 font-body text-[14px] text-white/75">
            The organiser set this lineup{saved.updatedAt ? ` (${formatDateTime(saved.updatedAt)})` : ''}. You can change it and send it again before kick-off.
          </p>
        ) : saved ? (
          <p className="mt-4 rounded-2xl bg-white/[0.06] p-3 font-body text-[14px] text-white/75">
            Sent{saved.updatedAt ? ` ${formatDateTime(saved.updatedAt)}` : ''}. The organiser can still change it before kick-off.
          </p>
        ) : null}

        {dupes.length > 0 && (
          <p className="mt-3 rounded-2xl bg-white/[0.06] p-3 font-body text-[13px] leading-snug text-white/70">
            Shirt numbers used twice: {dupes.map((d) => `${d.number} (${d.names.join(', ')})`).join('; ')}. Ask the organiser to fix them so fans can tell players apart.
          </p>
        )}
      </div>

      <div className="mt-5 px-2">
        {formation && (
          <LineupEditor
            squad={team.squad}
            playersPerSide={playersPerSide}
            formation={formation}
            spots={spots}
            locked={locked}
            onChange={(next) => { setFormation(next.formation); setSpots(next.spots); setDirty(true) }}
          />
        )}
      </div>

      {!locked && (
        <div
          className="fixed inset-x-0 z-40 border-t border-white/[0.08] bg-[#181928] px-4 pt-3"
          style={{ bottom: 0, paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="mb-2 flex items-baseline justify-between font-body text-[13px]">
            <span className="text-white/70">
              <b className="font-semibold text-white">{placedCount}</b> of {playersPerSide} on the pitch
            </span>
            {missing > 0 && placedCount > 0 && <span className="text-white/50">{missing} spot{missing === 1 ? '' : 's'} empty</span>}
          </div>
          <button
            onClick={() => save.mutate()}
            disabled={placedCount === 0 || save.isPending || (!dirty && !!saved && saved.setBy === 'coach')}
            className="h-12 w-full rounded-full bg-gaffer-orange font-body text-[16px] font-bold text-white disabled:bg-white/[0.08] disabled:text-white/40"
          >
            {save.isPending ? 'Sending…' : placedCount === 0 ? 'Put players on the pitch' : !dirty && saved?.setBy === 'coach' ? 'Lineup sent' : saved ? 'Send changes' : 'Send lineup'}
          </button>
        </div>
      )}
    </div>
  )
}
