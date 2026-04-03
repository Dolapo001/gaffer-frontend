'use client';

interface TableStandingsProps {
  standings?: any[];
  onSeeAll?: () => void;
}

export function TableStandings({ standings, onSeeAll }: TableStandingsProps) {
  const hasData = standings && standings.length > 0;
  const teams = hasData ? standings.map((s, i) => ({
    name: s.teamId?.shortName || s.teamId?.name || 'Team',
    w: s.won || 0,
    d: s.drawn || 0,
    l: s.lost || 0,
    pts: s.points || 0,
    status: (i + 1) <= 4 ? 'qualified' : (i + 1) === 5 ? 'playoffs' : undefined,
  })).slice(0, 5) : [];

  if (teams.length === 0) {
    return (
       <div className="w-full flex justify-center mb-6 px-4">
          <div className="bg-[#1a1b2e]/60 rounded-[28px] p-10 backdrop-blur-md border border-white/5 flex flex-col items-center justify-center text-center w-full max-w-[340px]">
             <p className="text-white/20 font-black uppercase tracking-widest text-xs">No Rankings Yet</p>
          </div>
       </div>
    );
  }

  return (
    <div className="w-full flex justify-center mb-6 px-4">
      <div
        className="bg-[#1a1b2e]/60 rounded-[24px] p-6 backdrop-blur-md shadow-2xl flex flex-col mx-auto"
        style={{
          width: '100%',
          maxWidth: '340px',
          border: '1px solid rgba(255,255,255,0.08)',
          fontFamily: "'Poppins', sans-serif"
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-[15px] font-bold tracking-tight">
            Table Standings
          </h2>
          <button
            onClick={onSeeAll}
            className="text-[#D2B5FF] text-[13px] font-medium hover:text-white transition-colors"
          >
            See All
          </button>
        </div>

        {/* Table Headers */}
        <div className="flex items-center text-[#94a3b8] mb-4 text-[11px] font-bold uppercase tracking-widest px-1">
          <span className="flex-1">Club</span>
          <div className="flex items-center gap-4">
            <span className="w-6 text-center">W</span>
            <span className="w-6 text-center">D</span>
            <span className="w-6 text-center">L</span>
            <span className="w-8 text-right">Poin</span>
          </div>
        </div>

        {/* Team Rows */}
        <div className="flex flex-col gap-1">
          {teams.map((team, i) => (
            <div
              key={i}
              className="flex items-center py-3 px-1 border-b border-white/5 last:border-0 hover:bg-white/[0.03] rounded-lg transition-all group"
            >
              <div className="flex-1 flex items-center gap-4 min-w-0">
                {/* Status indicator */}
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                  style={{
                    backgroundColor: team.status === 'qualified' ? '#00D1FF' :
                                     team.status === 'playoffs' ? '#FFAC33' : 'transparent'
                  }}
                />
                <span className="text-white text-[13px] font-bold truncate tracking-wide uppercase">
                  {team.name}
                </span>
              </div>

              <div className="flex items-center gap-4 text-[13px] font-medium text-white/90">
                <span className="w-6 text-center">{team.w}</span>
                <span className="w-6 text-center">{team.d}</span>
                <span className="w-6 text-center">{team.l}</span>
                <span className="w-8 text-right font-black text-white">{team.pts}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-8 mt-6 pt-5 border-t border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-[#00D1FF] shadow-[0_0_10px_#00D1FF66]" />
            <span className="text-[#94a3b8] text-[11px] font-bold uppercase tracking-wider">Qualified</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-[#FFAC33] shadow-[0_0_10px_#FFAC3366]" />
            <span className="text-[#94a3b8] text-[11px] font-bold uppercase tracking-wider">Playoffs</span>
          </div>
        </div>
      </div>
    </div>
  );
}
