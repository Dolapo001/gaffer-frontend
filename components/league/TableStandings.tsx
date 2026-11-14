'use client'

import { TeamBadge } from '@/components/ui/TeamBadge'

interface TableStandingsProps {
  standings?: any[]
  /** Fallback list of competition teams to show when standings is empty */
  competitionTeams?: any[]
  onSeeAll?: () => void
  /** Max rows to show before truncating. Defaults to showing all. */
  limit?: number
}

/** The league table: position, crest, full team name, then P W D L GD Pts. */
export function TableStandings({ standings, competitionTeams, onSeeAll, limit }: TableStandingsProps) {
  const hasStandings = !!standings?.length
  const rows = hasStandings
    ? standings!.map((s) => ({
        id: s.teamId?._id,
        name: s.teamId?.name || s.teamId?.shortName || 'Team',
        logoUrl: s.teamId?.logoUrl ?? null,
        p: s.played ?? 0, w: s.won ?? 0, d: s.drawn ?? 0, l: s.lost ?? 0, gd: s.goalDifference ?? 0, pts: s.points ?? 0,
      }))
    : [...(competitionTeams ?? [])]
        .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
        .map((t) => ({ id: t.teamId ?? t._id, name: t.name || t.shortName || 'Team', logoUrl: t.logoUrl ?? null, p: 0, w: 0, d: 0, l: 0, gd: 0, pts: 0 }))

  const teams = limit ? rows.slice(0, limit) : rows
  const hasMore = limit != null && rows.length > limit
  const col = 'w-[22px] shrink-0 text-center tabular-nums'

  return (
    <section className="mb-6 w-full overflow-hidden rounded-2xl bg-[#1B1D25]">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h2 className="font-body text-[17px] font-semibold text-white">Table</h2>
        {onSeeAll && teams.length > 0 && (
          <button onClick={onSeeAll} className="font-body text-[13px] font-medium text-gaffer-orange">See all</button>
        )}
      </div>

      {teams.length === 0 ? (
        <p className="px-4 pb-6 pt-2 text-center font-body text-sm text-white/50">The table appears once teams are added.</p>
      ) : (
        <>
          {!hasStandings && <p className="px-4 pb-2 font-body text-[13px] text-white/50">No matches played yet.</p>}
          <div className="flex items-center gap-1 px-3 pb-1.5 font-body text-[12px] font-medium text-white/45">
            <span className="w-5 shrink-0 text-center">#</span>
            <span className="min-w-0 flex-1 pl-1">Team</span>
            <span className={col}>P</span>
            <span className={`${col} hidden min-[400px]:block`}>W</span>
            <span className={`${col} hidden min-[400px]:block`}>D</span>
            <span className={`${col} hidden min-[400px]:block`}>L</span>
            <span className="w-[30px] shrink-0 text-center">GD</span>
            <span className="w-[28px] shrink-0 text-center">Pts</span>
          </div>
          <ol>
            {teams.map((t, i) => (
              <li key={t.id || i} className="flex h-11 items-center gap-1 border-t border-white/[0.06] px-3 font-body text-[14px] text-white">
                <span className="w-5 shrink-0 text-center text-[13px] tabular-nums text-white/60">{i + 1}</span>
                <span className="flex min-w-0 flex-1 items-center gap-2 pl-1">
                  <TeamBadge name={t.name} logoUrl={t.logoUrl} size={22} />
                  <span className="truncate font-medium">{t.name}</span>
                </span>
                <span className={`${col} text-white/70`}>{t.p}</span>
                <span className={`${col} hidden text-white/70 min-[400px]:block`}>{t.w}</span>
                <span className={`${col} hidden text-white/70 min-[400px]:block`}>{t.d}</span>
                <span className={`${col} hidden text-white/70 min-[400px]:block`}>{t.l}</span>
                <span className="w-[30px] shrink-0 text-center tabular-nums text-white/70">{t.gd > 0 ? `+${t.gd}` : t.gd}</span>
                <span className="w-[28px] shrink-0 text-center font-semibold tabular-nums">{t.pts}</span>
              </li>
            ))}
          </ol>
          {hasMore && onSeeAll && (
            <button onClick={onSeeAll} className="w-full border-t border-white/[0.06] py-3 font-body text-[13px] font-medium text-white/60">
              Show all {rows.length} teams
            </button>
          )}
        </>
      )}
    </section>
  )
}
