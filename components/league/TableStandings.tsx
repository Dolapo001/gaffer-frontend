'use client'

import { motion } from 'framer-motion'

interface TableStandingsProps {
  standings?: any[]
  /** Fallback list of competition teams to show when standings is empty */
  competitionTeams?: any[]
  onSeeAll?: () => void
  /** Max rows to show before truncating. Defaults to showing all. */
  limit?: number
}

export function TableStandings({ standings, competitionTeams, onSeeAll, limit }: TableStandingsProps) {
  const hasStandings = standings && standings.length > 0
  const hasTeams = competitionTeams && competitionTeams.length > 0

  // Map every row from the real standings endpoint
  const standingsTeams = hasStandings
    ? standings!.map((s, i) => ({
        pos: i + 1,
        name: s.teamId?.shortName || s.teamId?.name || 'Team',
        logoUrl: s.teamId?.logoUrl ?? null,
        mp:  s.played          ?? 0,
        w:   s.won             ?? 0,
        d:   s.drawn           ?? 0,
        l:   s.lost            ?? 0,
        gd:  s.goalDifference  ?? 0,
        pts: s.points          ?? 0,
        // status bands — top 4 qualify, 5th is playoffs, bottom 3 are relegated
        status:
          i + 1 <= 4 ? 'qualified' :
          i + 1 === 5 ? 'playoffs' :
          standings!.length >= 6 && i + 1 >= standings!.length - 2 ? 'relegated' :
          undefined,
      }))
    : []

  // Fallback: when standings is empty but we have competition teams, show them with zero stats
  const fallbackTeams = !hasStandings && hasTeams
    ? [...competitionTeams!]
        .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
        .map((t, i) => ({
          pos: i + 1,
          name: t.shortName || t.name || 'Team',
          logoUrl: t.logoUrl ?? null,
          mp: 0, w: 0, d: 0, l: 0, gd: 0, pts: 0,
          status: undefined,
        }))
    : []

  const allZeroStats = !hasStandings && fallbackTeams.length > 0
  const allTeams = hasStandings ? standingsTeams : fallbackTeams

  const teams = limit ? allTeams.slice(0, limit) : allTeams
  const hasMore = limit != null && allTeams.length > limit

  // ── Empty state ──────────────────────────────────────────────────────────

  if (teams.length === 0) {
    return (
      <div className="w-full flex justify-center mb-6 px-4">
        <div className="bg-[#1a1b2e]/60 rounded-[28px] p-10 backdrop-blur-md border border-white/5 flex flex-col items-center justify-center text-center w-full max-w-[400px]">
          <p className="text-white/20 font-black uppercase tracking-widest text-xs">
            No Rankings Yet
          </p>
        </div>
      </div>
    )
  }

  // ── Table ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full flex justify-center mb-6 px-4">
      <div
        className="bg-[#1a1b2e]/60 rounded-[24px] backdrop-blur-md shadow-2xl flex flex-col w-full"
        style={{
          maxWidth: '420px',
          border: '1px solid rgba(255,255,255,0.08)',
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        {/* Card header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <h2 className="text-white text-[15px] font-bold tracking-tight">
            Table Standings
          </h2>
          {onSeeAll && (
            <button
              onClick={onSeeAll}
              className="text-[#D2B5FF] text-[12px] font-medium hover:text-white transition-colors"
            >
              See All
            </button>
          )}
        </div>

        {/* No matches played hint */}
        {allZeroStats && (
          <div className="px-5 pb-3">
            <p className="text-white/30 text-[10px] font-medium uppercase tracking-widest text-center">
              No matches played yet
            </p>
          </div>
        )}

        {/* Column headers */}
        <div className="flex items-center text-[#94a3b8] text-[10px] font-bold uppercase tracking-widest px-5 pb-2">
          <span className="w-6 text-center flex-shrink-0">#</span>
          <span className="flex-1 pl-3">Club</span>
          <div className="flex items-center gap-3 text-center">
            <span className="w-6">MP</span>
            <span className="w-5">W</span>
            <span className="w-5">D</span>
            <span className="w-5">L</span>
            <span className="w-7 text-right">Pts</span>
          </div>
        </div>

        {/* Rows */}
        <div className="flex flex-col px-2 pb-4">
          {teams.map((team, i) => (
            <motion.div
              key={team.pos}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center py-2.5 px-3 rounded-xl hover:bg-white/[0.03] transition-all"
            >
              {/* Position + status dot */}
              <div className="w-6 flex-shrink-0 flex items-center justify-center gap-1">
                <div
                  className="w-1 h-4 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor:
                      team.status === 'qualified' ? '#00D1FF' :
                      team.status === 'playoffs'  ? '#FFAC33' :
                      team.status === 'relegated' ? '#EF4444' :
                      'transparent',
                    boxShadow:
                      team.status === 'qualified' ? '0 0 6px #00D1FF88' :
                      team.status === 'playoffs'  ? '0 0 6px #FFAC3388' :
                      team.status === 'relegated' ? '0 0 6px #EF444488' :
                      'none',
                  }}
                />
              </div>

              {/* Team name + optional logo */}
              <div className="flex-1 flex items-center gap-2.5 pl-2 min-w-0">
                {team.logoUrl ? (
                  <img
                    src={team.logoUrl}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover flex-shrink-0 opacity-90"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-white/[0.06] border border-white/10 flex-shrink-0 flex items-center justify-center">
                    <span className="text-white/40 text-[8px] font-black">
                      {team.name[0]}
                    </span>
                  </div>
                )}
                <span className="text-white text-[12px] font-bold truncate tracking-wide uppercase">
                  {team.name}
                </span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 text-[12px] flex-shrink-0">
                <span className="w-6 text-center text-white/50">{team.mp}</span>
                <span className="w-5 text-center text-white/80">{team.w}</span>
                <span className="w-5 text-center text-white/80">{team.d}</span>
                <span className="w-5 text-center text-white/80">{team.l}</span>
                <span className="w-7 text-right font-black text-white">{team.pts}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* "Show more" row if truncated */}
        {hasMore && onSeeAll && (
          <button
            onClick={onSeeAll}
            className="w-full py-3 text-[11px] font-chakra font-black text-white/30 uppercase tracking-widest border-t border-white/5 hover:text-white/60 transition-colors"
          >
            +{allTeams.length - (limit ?? 0)} more teams
          </button>
        )}

        {/* Legend */}
        <div className="flex items-center gap-6 px-5 py-4 border-t border-white/5 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 rounded-full bg-[#00D1FF] shadow-[0_0_8px_#00D1FF66]" />
            <span className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-wider">Qualified</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 rounded-full bg-[#FFAC33] shadow-[0_0_8px_#FFAC3366]" />
            <span className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-wider">Playoffs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 rounded-full bg-[#EF4444] shadow-[0_0_8px_#EF444466]" />
            <span className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-wider">Relegated</span>
          </div>
        </div>
      </div>
    </div>
  )
}
