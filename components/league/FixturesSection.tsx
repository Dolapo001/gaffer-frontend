'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { JerseySvg } from '@/components/jersey/JerseySvg';
import type { JerseyPattern } from '@/components/jersey/jerseyUtils';

interface FixturesSectionProps {
  fixtures?: any[];
}

// ─── TeamBadge ────────────────────────────────────────────────────────────────
// Always shows the team's HOME kit (team.jersey).
// Falls back to logo or initial letter if jersey data is absent.

function TeamBadge({
  team,
}: {
  team: {
    name?: string;
    logoUrl?: string;
    jersey?: { primaryColor: string; secondaryColor: string; jerseyPattern: JerseyPattern };
  };
}) {
  // Always use the home kit stored on the team record — never resolvedKits / away kit.
  const jersey = team.jersey ?? null;

  return (
    <div className="flex flex-col items-center gap-2.5 w-[85px]">
      <div className="w-12 h-12 flex items-center justify-center">
        {jersey ? (
          <JerseySvg
            primaryColor={jersey.primaryColor}
            secondaryColor={jersey.secondaryColor}
            jerseyPattern={jersey.jerseyPattern}
            width={44}
            height={50}
          />
        ) : team.logoUrl ? (
          <img src={team.logoUrl} alt="" className="w-full h-full object-contain" />
        ) : (
          <div className="text-white/20 font-black text-xs">{team.name?.charAt(0)}</div>
        )}
      </div>
      <span className="text-white text-[12px] font-bold tracking-tight truncate w-full text-center">
        {team.name}
      </span>
    </div>
  );
}

// ─── FixtureCard ──────────────────────────────────────────────────────────────

function FixtureCard({
  fixture,
  onClick,
  type,
  score,
}: {
  fixture: any;
  onClick?: () => void;
  type: 'upcoming' | 'finished';
  score?: string;
}) {
  // homeTeamId / awayTeamId are populated objects from the backend.
  const home = typeof fixture.homeTeamId === 'string' ? { name: 'Home', logoUrl: '' } : fixture.homeTeamId;
  const away = typeof fixture.awayTeamId === 'string' ? { name: 'Away', logoUrl: '' } : fixture.awayTeamId;

  const kickoff = fixture.kickoffAt ? new Date(fixture.kickoffAt) : new Date();
  const time = kickoff.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const day  = kickoff.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase();

  const displayScore = score || (fixture.score ? `${fixture.score.home} : ${fixture.score.away}` : '0 : 0');

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-[#1a2138]/60 border border-white/[0.03] rounded-[24px] p-5 flex items-center justify-between backdrop-blur-md shadow-xl hover:bg-white/[0.02] transition-all cursor-pointer"
    >
      {/* Home team — always home kit */}
      <TeamBadge team={home} />

      {/* Centre: date/time or score */}
      <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
        <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">
          {day} {time}
        </span>
        <div className="bg-[#1a2138] border border-white/5 rounded-[8px] h-[34px] px-4 flex items-center justify-center shadow-lg">
          <span className="text-white text-[16px] font-black tracking-tight italic">
            {type === 'upcoming' && fixture.status !== 'live' ? time : displayScore}
          </span>
        </div>
      </div>

      {/* Away team — always home kit */}
      <TeamBadge team={away} />
    </motion.div>
  );
}

// ─── FixturesSection ──────────────────────────────────────────────────────────

export function FixturesSection({ fixtures }: FixturesSectionProps) {
  const router = useRouter();

  const finished = fixtures?.filter(f => f.status === 'completed') || [];
  const upcoming = fixtures?.filter(f => f.status === 'scheduled' || f.status === 'live') || [];

  const rounds = finished.reduce((acc: any, fixture: any) => {
    const roundName = fixture.roundId?.name || fixture.stageId?.name || 'Previous Fixtures';
    if (!acc[roundName]) acc[roundName] = [];
    acc[roundName].push(fixture);
    return acc;
  }, {});

  if (!fixtures || fixtures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-10 text-center w-full">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/5 shadow-2xl">
          <div className="w-8 h-8 rounded-full border-2 border-white/10" />
        </div>
        <h2 className="text-white text-lg font-black uppercase tracking-tight mb-2">No Fixtures Scheduled</h2>
        <p className="text-white/30 text-xs font-medium max-w-[200px]">Matches for this competition haven't been generated yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full px-5 py-6 gap-10">
      {upcoming.length > 0 && (
        <section className="flex flex-col gap-5 max-w-sm mx-auto w-full">
          <h2 className="text-white text-[16px] font-bold tracking-tight">Match Schedule</h2>
          <div className="flex flex-col gap-4">
            {upcoming.map((fixture) => (
              <FixtureCard
                key={fixture._id}
                fixture={fixture}
                onClick={() => router.push(`/app/match/${fixture._id}`)}
                type="upcoming"
              />
            ))}
          </div>
        </section>
      )}

      {finished.length > 0 && (
        <section className="flex flex-col gap-6 max-w-sm mx-auto w-full">
          <h2 className="text-white text-[16px] font-bold tracking-tight">Previous Fixtures</h2>
          {Object.entries(rounds).map(([roundName, roundFixtures]: [string, any], roundIdx) => (
            <div key={roundIdx} className="flex flex-col gap-4">
              <h3 className="text-[#D2B5FF]/50 text-[13px] font-bold tracking-widest uppercase mb-1">
                {roundName}
              </h3>
              <div className="flex flex-col gap-4">
                {roundFixtures.map((fixture: any) => (
                  <FixtureCard
                    key={fixture._id}
                    fixture={fixture}
                    onClick={() => router.push(`/app/match/${fixture._id}`)}
                    type="finished"
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {upcoming.length === 0 && finished.length === 0 && (
        <div className="text-center py-10 opacity-20 italic font-black text-xs uppercase tracking-widest">
          No fixtures found.
        </div>
      )}
    </div>
  );
}
