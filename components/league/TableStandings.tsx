'use client';

import { STANDINGS } from '@/lib/leagueMockData';

interface TeamRow {
  name: string;
  w: number;
  d: number;
  l: number;
  pts: number;
  status?: 'qualified' | 'playoffs';
}

const teams: TeamRow[] = STANDINGS.map((s) => ({
  name: s.team.shortName,
  w: s.wins,
  d: s.draws,
  l: s.losses,
  pts: s.points,
  status: s.position <= 3 ? 'qualified' : s.position === 4 ? 'playoffs' : undefined,
}));

export function TableStandings() {
  return (
    <div className="w-full flex justify-center mb-6 px-4">
      <div
        className="bg-[#1a1b2e]/60 rounded-[28.03px] p-5 backdrop-blur-sm shadow-xl flex flex-col mx-auto"
        style={{
          width: '302.25px',
          height: '378.47px',
          border: '1.31px solid #2E2F3E',
          fontFamily: "'Poppins', sans-serif"
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-white whitespace-nowrap"
            style={{
              width: '119px',
              height: '25px',
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 500,
              fontSize: '14.02px',
              lineHeight: '24.53px',
              letterSpacing: '0.26px'
            }}
          >
            Table Standings
          </h2>
          <button
            className="transition-colors whitespace-nowrap"
            style={{
              width: '43px',
              height: '25px',
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 500,
              fontSize: '12.27px',
              lineHeight: '24.53px',
              letterSpacing: '0.26px',
              color: '#D2B5FF',
              textAlign: 'center'
            }}
          >
            See All
          </button>
        </div>

        {/* Table Headers */}
        <div className="flex items-center text-[#94a3b8] mb-3 px-1 w-full">
          <span
            className="text-white"
            style={{
              width: '30px',
              height: '25px',
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 500,
              fontSize: '12.27px',
              lineHeight: '24.53px',
              letterSpacing: '0.26px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            Club
          </span>
          <div className="flex-1 flex items-center justify-end gap-3">
            <span className="w-[20px] text-center" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '12.27px' }}>W</span>
            <span className="w-[20px] text-center" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '12.27px' }}>D</span>
            <span className="w-[20px] text-center" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '12.27px' }}>L</span>
            <span className="w-[40px] text-right" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '12.27px' }}>Pts</span>
          </div>
        </div>

        {/* Team Rows - Controlled height to fit container */}
        <div className="flex-1 overflow-hidden space-y-0.5">
          {teams.map((team, i) => (
            <div
              key={i}
              className="flex items-center border-b border-[#2E2F3E]/40 last:border-0 hover:bg-white/[0.02] transition-colors px-1 group w-full"
              style={{
                height: '35px',
              }}
            >
              <div className="flex-1 flex items-center gap-2.5 min-w-0">
                {/* Status indicator (Step 305) */}
                <div
                  className="rounded-full shrink-0"
                  style={{
                    width: '5.51px',
                    height: '5.26px',
                    backgroundColor: team.status === 'qualified' ? '#00D1FF' :
                                     team.status === 'playoffs' ? '#ff9100' : 'transparent'
                  }}
                />
                <span
                  className="text-white truncate"
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 400,
                    fontSize: '12.27px',
                    lineHeight: '24.53px',
                    letterSpacing: '0.26px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {team.name}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3">
                <span className="w-[20px] text-center text-white text-[12.27px] font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>{team.w}</span>
                <span className="w-[20px] text-center text-white text-[12.27px] font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>{team.d}</span>
                <span className="w-[20px] text-center text-white text-[12.27px] font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>{team.l}</span>
                <span className="w-[40px] text-right text-white text-[12.27px] font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>{team.pts}</span>
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
