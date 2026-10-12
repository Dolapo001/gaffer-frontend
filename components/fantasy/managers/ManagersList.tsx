'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Search, ChevronRight } from 'lucide-react'
import { listManagers, type ManagerRow } from '@/lib/services/fantasy.service'
import { asArray } from '@/lib/asArray'

/**
 * Every manager in a tournament, ranked, with search and "Load more". Managers see names and points; organisers also
 * see who has not picked a team. Each row opens that manager's team.
 * `basePath` is where a row links to, e.g. /app/fantasy/<id>/managers: the row goes to `${basePath}/<teamId>`.
 */
export function ManagersList({ competitionId, basePath }: { competitionId: string; basePath: string }) {
  const [input, setInput] = useState('')
  const [q, setQ] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setQ(input.trim()), 300)
    return () => clearTimeout(t)
  }, [input])

  const query = useInfiniteQuery({
    queryKey: ['fantasy-managers', competitionId, q],
    queryFn: ({ pageParam }) => listManagers(competitionId, pageParam, q),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.pageSize < last.total ? last.page + 1 : undefined),
  })

  const pages = query.data?.pages ?? []
  const rows: ManagerRow[] = pages.flatMap((p) => asArray<ManagerRow>(p.data))
  const total = pages[0]?.total ?? 0
  const isAdmin = !!pages[0]?.isAdmin
  const withoutTeam = pages[0]?.withoutTeam ?? []

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 bg-[#1E2032] border border-white/10 rounded-2xl px-4 h-12">
        <Search size={16} className="text-white/40" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search by manager or team name"
          aria-label="Search managers"
          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
        />
      </label>

      <p className="text-xs text-white/40 px-1">{query.isLoading ? 'Loading managers…' : `${total} ${total === 1 ? 'manager' : 'managers'}`}</p>

      {query.isError && <p className="text-sm text-red-300 px-1">Could not load the managers. Pull down to try again.</p>}

      <ul className="space-y-2">
        {rows.map((m) => (
          <li key={m.teamId}>
            <Link
              href={`${basePath}/${m.teamId}`}
              className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${m.isMine ? 'bg-gaffer-orange/15 border-gaffer-orange/40' : 'bg-[#1a1b2e]/60 border-white/5'}`}
            >
              <span className="w-9 text-center font-display font-black text-sm text-white/70">#{m.rank}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">
                  {m.teamName}
                  {m.isMine && <span className="ml-2 text-[9px] bg-gaffer-orange text-white font-black px-1.5 py-0.5 rounded uppercase">You</span>}
                </p>
                <p className="text-xs text-white/40 truncate">
                  {m.manager.name}
                  {isAdmin && m.isComplete === false && <span className="ml-2 text-yellow-300/80">team not finished</span>}
                  {isAdmin && m.hidden && <span className="ml-2 text-red-300/80">hidden</span>}
                </p>
              </div>
              <span className="font-display font-black text-white tabular-nums">{m.totalPoints}<span className="text-[9px] text-white/40 font-normal"> pts</span></span>
              <ChevronRight size={16} className="text-white/30" />
            </Link>
          </li>
        ))}
      </ul>

      {!query.isLoading && rows.length === 0 && (
        <p className="text-sm text-white/50 text-center py-8">{q ? 'No manager matches that search.' : 'No managers yet.'}</p>
      )}

      {query.hasNextPage && (
        <button
          onClick={() => query.fetchNextPage()}
          disabled={query.isFetchingNextPage}
          className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 text-white text-xs font-black uppercase tracking-widest disabled:opacity-50"
        >
          {query.isFetchingNextPage ? 'Loading…' : 'Load more'}
        </button>
      )}

      {isAdmin && withoutTeam.length > 0 && (
        <section className="rounded-2xl bg-[#1E2032] border border-white/5 p-4 space-y-2">
          <h4 className="text-xs font-black uppercase tracking-widest text-white/50">Joined, no team yet ({withoutTeam.length})</h4>
          <ul className="text-sm text-white/70 space-y-1">
            {withoutTeam.map((u, i) => <li key={`${u.id}-${i}`}>{u.name}</li>)}
          </ul>
        </section>
      )}
    </div>
  )
}
