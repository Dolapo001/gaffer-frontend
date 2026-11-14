'use client'

/**
 * Team of the Week: the best XI of a gameweek on one clean half-pitch (attack at the top, goalkeeper at the
 * bottom). Each player has a photo with a rating pill on its lower edge, their club's crest, and an
 * "I. Agbaje" label. A star marks the best player; the team's average rating sits in the header.
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getTOTW, type TOTWPlayer } from '@/lib/services/stats.service'
import { Avatar, PitchMarkings, RatingPill, ratingColour } from '@/components/match/PitchKit'
import { TeamBadge } from '@/components/ui/TeamBadge'

function shortName(p: TOTWPlayer): string {
  const parts = (p.fullName || p.name || '').trim().split(/\s+/)
  return parts.length >= 2 ? `${parts[0][0]}. ${parts.slice(1).join(' ')}` : p.name || 'Player'
}

export interface TeamOfTheWeekWidgetProps {
  leagueId: string
}

export function TeamOfTheWeekWidget({ leagueId }: TeamOfTheWeekWidgetProps) {
  const router = useRouter()
  const [gw, setGw] = useState<number | undefined>(undefined)
  const [maxGw, setMaxGw] = useState(1)
  const [players, setPlayers] = useState<TOTWPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!leagueId) return
    let cancelled = false
    setLoading(true)
    getTOTW(leagueId, gw)
      .then((data) => {
        if (cancelled) return
        setPlayers(data.results)
        setMaxGw((m) => Math.max(m, data.maxGameweek ?? 1))
        if (gw === undefined) setGw(data.selectedGameweek ?? 1)
        setError(null)
      })
      .catch((err) => !cancelled && setError(err?.message || 'Couldn’t load the Team of the Week.'))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [leagueId, gw])

  const current = gw ?? 1
  const rated = players.filter((p) => p.rating != null)
  const avg = rated.length ? rated.reduce((s, p) => s + (p.rating as number), 0) / rated.length : null
  const top = rated.length ? Math.max(...rated.map((p) => p.rating as number)) : null
  const bestId = top != null && rated.filter((p) => p.rating === top).length === 1 ? rated.find((p) => p.rating === top)?.id : undefined

  const rows = (['FWD', 'MID', 'DEF', 'GK'] as const)
    .map((pos) => players.filter((p) => p.position === pos))
    .filter((r) => r.length)

  return (
    <section className="mb-6 w-full overflow-hidden rounded-2xl bg-[#1B1D25]">
      <header className="flex items-center gap-3 px-4 pb-3 pt-4">
        <h2 className="flex-1 font-body text-[17px] font-semibold text-white">Team of the Week</h2>
        {avg != null && (
          <span className="flex items-center gap-1.5 font-body text-[13px] text-white/60">
            Avg
            <span className="rounded-[3px] px-1.5 py-px text-[12px] font-bold tabular-nums text-white" style={{ background: ratingColour(avg) }}>{avg.toFixed(1)}</span>
          </span>
        )}
      </header>

      <div className="flex items-center justify-between px-3 pb-3">
        <button
          onClick={() => setGw(current - 1)}
          disabled={current <= 1 || loading}
          aria-label="Previous gameweek"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-white disabled:opacity-25"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="font-body text-[14px] font-semibold text-white">Gameweek {current}</span>
        <button
          onClick={() => setGw(current + 1)}
          disabled={current >= maxGw || loading}
          aria-label="Next gameweek"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-white disabled:opacity-25"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className={`relative mx-2 mb-2 bg-[#15171e] transition-opacity ${loading && players.length ? 'opacity-50' : ''}`}>
        <PitchMarkings half />
        {loading && !players.length ? (
          <div className="flex h-[300px] items-center justify-center font-body text-sm text-white/40">Loading…</div>
        ) : !players.length ? (
          <div className="flex h-[300px] items-center justify-center px-8 text-center font-body text-sm text-white/50">
            {error ?? `No Team of the Week for gameweek ${current} yet. It appears once that gameweek's matches are played.`}
          </div>
        ) : (
          <div className="relative py-4">
            {rows.map((row, i) => (
              <div key={i} className="flex h-[96px] items-start justify-evenly">
                {row.map((p) => (
                  <button key={p.id} onClick={() => router.push(`/app/player/${p.id}`)} className="flex min-w-0 max-w-[96px] flex-1 flex-col items-center px-0.5">
                    <span className="relative">
                      <Avatar photoUrl={p.photoUrl || undefined} size={40} />
                      <span className="absolute -right-[7px] -top-[3px]">
                        <TeamBadge name={p.teamName} logoUrl={p.logoUrl} size={16} className="ring-1 ring-[#15171e]" />
                      </span>
                      {p.rating != null && <RatingPill rating={p.rating} best={bestId === p.id} className="top-[29px]" />}
                    </span>
                    <span className={`max-w-full truncate font-body text-[12px] font-medium leading-[15px] text-white ${p.rating != null ? 'mt-[10px]' : 'mt-[5px]'}`}>
                      {shortName(p)}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default TeamOfTheWeekWidget
