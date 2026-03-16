'use client';

interface TeamRow {
  name: string;
  w: number;
  d: number;
  l: number;
  pts: number;
  status?: 'qualified' | 'playoffs';
}

const teams: TeamRow[] = [
  { name: 'COCCS', w: 3, d: 0, l: 0, pts: 9, status: 'qualified' },
  { name: 'COHES', w: 2, d: 1, l: 0, pts: 7, status: 'qualified' },
  { name: 'COSMS', w: 2, d: 1, l: 0, pts: 7, status: 'qualified' },
  { name: 'COLAW', w: 1, d: 2, l: 0, pts: 5, status: 'qualified' },
  { name: 'COAES', w: 1, d: 1, l: 1, pts: 4, status: 'playoffs' },
];

export function TableStandings() {
  return (
    <div className="w-full flex justify-center mb-6 px-4">
      <div 
        className="bg-[#1a1b2e]/60 rounded-[28px] p-5 border backdrop-blur-sm shadow-xl flex flex-col"
        style={{ 
          width: '297px', 
          height: '378.47px', 
          borderRadius: '28.03px',
          border: '1.31px solid #2E2F3E'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white text-[17px] font-bold tracking-tight">Table Standings</h2>
          <button className="text-[#a855f7] text-[13px] font-bold hover:text-[#d8b4fe] transition-colors">See All</button>
        </div>

        {/* Table Headers */}
        <div className="flex items-center text-[#94a3b8] text-[12px] font-bold mb-3 px-1">
          <span className="flex-1">Club</span>
          <div className="flex items-center gap-4">
            <span className="w-5 text-center">W</span>
            <span className="w-5 text-center">D</span>
            <span className="w-5 text-center">L</span>
            <span className="w-8 text-right">Poin</span>
          </div>
        </div>

        {/* Team Rows - Controlled height to fit container */}
        <div className="flex-1 overflow-hidden space-y-0.5">
          {teams.map((team, i) => (
            <div 
              key={i} 
              className="flex items-center py-2.5 border-b border-[#2E2F3E]/40 last:border-0 hover:bg-white/[0.02] transition-colors rounded-lg px-1 group"
            >
              <div className="flex-1 flex items-center gap-2.5 min-w-0">
                {/* Status indicator */}
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  team.status === 'qualified' ? 'bg-[#00e5ff]' : 
                  team.status === 'playoffs' ? 'bg-[#ff9100]' : 'bg-transparent'
                }`} />
                
                <span className="text-white text-[14px] font-bold tracking-tight truncate">{team.name}</span>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="w-5 text-center text-white text-[13px] font-bold">{team.w}</span>
                <span className="w-5 text-center text-white text-[13px] font-bold">{team.d}</span>
                <span className="w-5 text-center text-white text-[13px] font-bold">{team.l}</span>
                <span className="w-8 text-right text-white text-[13px] font-black">{team.pts}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-around mt-4 pt-4 border-t border-[#2E2F3E]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00e5ff]" />
            <span className="text-white text-[12px] font-bold">Qualified</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#ff9100]" />
            <span className="text-white text-[12px] font-bold">Playoffs</span>
          </div>
        </div>
      </div>
    </div>
  );
}

