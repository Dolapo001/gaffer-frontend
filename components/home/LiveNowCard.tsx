'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { listJoinedCompetitions } from '@/lib/services/competition.service'
import { listFixtures, type Fixture } from '@/lib/services/fixture.service'
import { getImageUrl } from '@/lib/api'

const side = (t: Fixture['homeTeamId'] | Fixture['awayTeamId']) =>
  typeof t === 'object' && t !== null ? { name: (t as any).shortName || (t as any).name || 'Team', logo: (t as any).logoUrl as string | undefined } : { name: 'Team', logo: undefined }

function Crest({ name, logo }: { name: string; logo?: string }) {
  return logo
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={getImageUrl(logo)} alt="" className="w-10 h-10 rounded-full object-cover bg-white/10" />
    : <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 font-black">{name[0]}</div>
}

/** Matches being played right now in the leagues you are in. Nothing is shown when nothing is live. */
export function LiveNowCard() {
  const router = useRouter()
  const { data: live = [] } = useQuery({
    queryKey: ['home-live-matches'],
    queryFn: async () => {
      const comps = (await listJoinedCompetitions().catch(() => [])).slice(0, 8)
      const lists = await Promise.all(comps.map((c) => listFixtures(c._id).then((f) => f.map((x) => ({ x, league: c.name }))).catch(() => [])))
      return lists.flat().filter(({ x }) => x.status === 'live' || x.status === 'halftime')
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
  if (!live.length) return null

  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-6 px-6" data-no-swipe>
      {live.map(({ x, league }) => {
        const h = side(x.homeTeamId)
        const a = side(x.awayTeamId)
        return (
          <button key={x._id} onClick={() => router.push(`/app/match/${x._id}`)} className="snap-center shrink-0 w-full rounded-3xl bg-[#1E2032] border border-white/5 px-4 py-3 text-center" aria-label={`${h.name} against ${a.name}, live`}>
            <p className="text-xs font-bold text-white/80 truncate">{league}</p>
            <div className="flex items-center justify-between gap-3 mt-2">
              <div className="flex-1 flex flex-col items-center gap-1 min-w-0"><Crest {...h} /><span className="text-xs text-white truncate max-w-full">{h.name}</span></div>
              <div>
                <p className="text-[10px] font-black text-red-400 tracking-widest flex items-center justify-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />{x.status === 'halftime' ? 'HALF TIME' : 'LIVE'}</p>
                <p className="mt-1 px-4 py-1.5 rounded-xl bg-[#181928] text-white font-black text-xl tabular-nums">{x.score?.home ?? 0}:{x.score?.away ?? 0}</p>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1 min-w-0"><Crest {...a} /><span className="text-xs text-white truncate max-w-full">{a.name}</span></div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
