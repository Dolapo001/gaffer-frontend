'use client'

/**
 * The match header. At the top of the page: both crests, full team names, a big score, the status and the
 * scorers. Scroll down and it folds into a slim bar that keeps the score in view (crest, score, crest), with the
 * tabs pinned underneath it. Scroll back up and it opens out again.
 */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, Bell, BellOff } from 'lucide-react'
import { TeamBadge } from '@/components/ui/TeamBadge'

interface TeamInfo { name: string; shortName?: string; logoUrl?: string | null }
interface Scorer { name: string; minute: string }

export function matchStatusText(f: { status?: string; phase?: string; kickoffAt?: string }) {
  if (f.status === 'completed') return 'Full time'
  if (f.status === 'halftime') return 'Half time'
  if (f.status === 'live') return f.phase === 'extra_time' ? 'Extra time' : f.phase === 'penalties' ? 'Penalties' : 'Live'
  if (f.status === 'postponed') return 'Postponed'
  if (f.status === 'cancelled') return 'Cancelled'
  return ''
}

/** "Sat 14 Nov, 15:00" — the one date format the app uses. */
export function formatKickoff(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const day = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${day}, ${time}`
}

export function MatchHeader({
  home, away, score, status, phase, kickoffAt, penalties, scorers, isFollowing, followPending, onFollow, onBack, tabs,
}: {
  home: TeamInfo; away: TeamInfo; score: { home: number; away: number }
  status?: string; phase?: string; kickoffAt?: string; penalties?: string
  scorers: { home: Scorer[]; away: Scorer[] }
  isFollowing: boolean; followPending: boolean; onFollow: () => void; onBack: () => void
  tabs: ReactNode
}) {
  const heroRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const [compact, setCompact] = useState(false)
  const [barH, setBarH] = useState(56)

  useLayoutEffect(() => {
    if (barRef.current) setBarH(barRef.current.offsetHeight)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const hero = heroRef.current
      if (!hero) return
      // Fold once the score itself has slid under the top bar
      setCompact(hero.getBoundingClientRect().bottom - 40 < barH)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [barH])

  const scheduled = !status || status === 'scheduled'
  const live = status === 'live' || status === 'halftime'
  const statusText = matchStatusText({ status, phase })
  const scoreText = scheduled ? '–' : `${score.home} - ${score.away}`

  return (
    <>
      {/* Top bar: always there; the mini score appears once the big one has scrolled away */}
      <div
        ref={barRef}
        className={`sticky top-0 z-50 bg-[#10111d] pt-[max(env(safe-area-inset-top),12px)] transition-shadow ${compact ? 'shadow-[0_1px_0_rgba(255,255,255,0.06)]' : ''}`}
      >
        <div className="flex h-14 items-center gap-2 px-2">
          <button onClick={onBack} aria-label="Back" className="flex h-11 w-11 items-center justify-center text-white">
            <ChevronLeft size={26} />
          </button>
          <div
            className={`flex min-w-0 flex-1 items-center justify-center gap-3 transition-all duration-200 ${compact ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-2'}`}
            aria-hidden={!compact}
          >
            <TeamBadge name={home.name} logoUrl={home.logoUrl} size={26} />
            <div className="flex flex-col items-center leading-none">
              <span className="text-[17px] font-bold tabular-nums text-white">{scoreText}</span>
              {statusText && <span className={`mt-1 text-[11px] font-semibold ${live ? 'text-[#ef4444]' : 'text-white/50'}`}>{statusText}</span>}
            </div>
            <TeamBadge name={away.name} logoUrl={away.logoUrl} size={26} />
          </div>
          <button
            onClick={onFollow}
            disabled={followPending}
            aria-label={isFollowing ? 'Stop match alerts' : 'Get match alerts'}
            className="flex h-11 w-11 items-center justify-center disabled:opacity-40"
          >
            {isFollowing ? <Bell size={21} className="text-gaffer-orange" fill="currentColor" /> : <BellOff size={21} className="text-white/50" />}
          </button>
        </div>
      </div>

      {/* The big header */}
      <section ref={heroRef} className="px-4 pb-5 pt-2">
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
          <TeamColumn team={home} />
          <div className="flex min-w-[112px] flex-col items-center pt-3">
            {scheduled ? (
              <>
                <span className="text-[13px] font-semibold text-white/50">Kick-off</span>
                <span className="mt-1.5 text-center text-[17px] font-bold leading-tight text-white">{formatKickoff(kickoffAt) || 'To be confirmed'}</span>
              </>
            ) : (
              <>
                <span className="text-[40px] font-bold leading-none tabular-nums tracking-tight text-white">
                  {score.home}<span className="mx-2 text-white/35">-</span>{score.away}
                </span>
                <span className={`mt-2 flex items-center gap-1.5 text-[13px] font-semibold ${live ? 'text-[#ef4444]' : 'text-white/55'}`}>
                  {live && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ef4444]" />}
                  {statusText}
                </span>
                {penalties && <span className="mt-1 text-[12px] font-medium text-white/55">{penalties}</span>}
              </>
            )}
          </div>
          <TeamColumn team={away} />
        </div>

        {(scorers.home.length > 0 || scorers.away.length > 0) && (
          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] gap-2 text-[12px] leading-5 text-white/60">
            <ul className="min-w-0 text-right">
              {scorers.home.map((s, i) => <li key={i} className="truncate">{s.name} {s.minute}</li>)}
            </ul>
            <span className="w-4 pt-0.5 text-center text-[11px]" aria-hidden>⚽</span>
            <ul className="min-w-0">
              {scorers.away.map((s, i) => <li key={i} className="truncate">{s.name} {s.minute}</li>)}
            </ul>
          </div>
        )}
      </section>

      {/* Tabs stay pinned under the top bar */}
      <div className="sticky z-40 bg-[#10111d]" style={{ top: barH }}>
        {tabs}
      </div>
    </>
  )
}

function TeamColumn({ team }: { team: TeamInfo }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2.5">
      <TeamBadge name={team.name} logoUrl={team.logoUrl} size={56} />
      <span className="line-clamp-2 text-center text-[14px] font-semibold leading-[18px] text-white">{team.name}</span>
    </div>
  )
}
