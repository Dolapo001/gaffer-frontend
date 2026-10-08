'use client'

import { useQuery } from '@tanstack/react-query'
import { getShootout, type Fixture, type ShootoutKick } from '@/lib/services/fixture.service'

const idOf = (t: unknown): string => (t && typeof t === 'object' ? String((t as { _id?: string })._id ?? '') : String(t ?? ''))
const nameOf = (t: Fixture['homeTeamId']): string => (typeof t === 'object' ? t.name : 'Team')

function takerName(k: ShootoutKick): string {
  const t = k.takerId
  return t && typeof t === 'object' ? `${t.firstName} ${t.lastName}`.trim() : 'Taker not recorded'
}

function Mark({ result }: { result: ShootoutKick['result'] }) {
  const scored = result === 'scored'
  return (
    <span
      aria-label={result}
      className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-[11px] font-black ${
        scored ? 'bg-[#22C55E] text-white' : 'bg-[#ef4444] text-white'
      }`}
    >
      {scored ? '✓' : result === 'saved' ? 'S' : '✕'}
    </span>
  )
}

/** The penalty shootout as fans see it: the tally, then every kick. Hidden until a shootout exists. */
export function ShootoutView({ fixture }: { fixture: Fixture }) {
  const live = fixture.status !== 'completed'
  const { data } = useQuery({
    queryKey: ['shootout', fixture._id],
    queryFn: () => getShootout(fixture._id),
    refetchInterval: live ? 8_000 : false,
    enabled: fixture.phase === 'penalties' || fixture.shootout?.status !== 'none',
  })

  if (!data || data.kicks.length === 0) {
    return fixture.phase === 'penalties' ? (
      <p className="text-center text-white/50 text-sm py-4">Penalty shootout is about to start.</p>
    ) : null
  }

  const homeId = idOf(fixture.homeTeamId)
  const awayId = idOf(fixture.awayTeamId)
  const homeKicks = data.kicks.filter((k) => idOf(k.teamId) === homeId)
  const awayKicks = data.kicks.filter((k) => idOf(k.teamId) === awayId)
  const winnerName = data.winner === 'home' ? nameOf(fixture.homeTeamId) : data.winner === 'away' ? nameOf(fixture.awayTeamId) : null

  return (
    <section aria-label="Penalty shootout" className="rounded-2xl bg-[#1E2032] border border-white/5 p-5 space-y-4">
      <div className="text-center">
        <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest">Penalty shootout{data.suddenDeath ? ' · sudden death' : ''}</p>
        <p className="font-chakra font-black text-3xl text-white mt-1">{data.home} - {data.away}</p>
        {winnerName && <p className="text-[#22C55E] text-sm font-bold mt-1">{winnerName} win on penalties</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[{ label: nameOf(fixture.homeTeamId), kicks: homeKicks }, { label: nameOf(fixture.awayTeamId), kicks: awayKicks }].map((side) => (
          <div key={side.label} className="space-y-2">
            <p className="text-white text-xs font-bold truncate">{side.label}</p>
            <ul className="space-y-1.5">
              {side.kicks.map((k) => (
                <li key={k._id} className="flex items-center gap-2">
                  <Mark result={k.result} />
                  <span className="text-white/70 text-xs truncate">{takerName(k)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
