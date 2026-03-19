'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MATCHES, getTeamCrest } from '@/lib/leagueMockData';

interface Scorer {
  name: string;
  minute: string;
}

interface TeamData {
  name: string;
  crest: string;
  scorers: Scorer[];
}

interface MatchData {
  id: string;
  homeTeam: TeamData;
  awayTeam: TeamData;
  score: string;
}

const LIVE_MATCHES: MatchData[] = MATCHES
  .filter((m) => m.status === 'live' || m.status === 'finished')
  .map((m) => ({
    id: m.id,
    homeTeam: {
      name: m.homeTeam.name,
      crest: getTeamCrest(m.homeTeam.id),
      scorers: (m.goalScorers ?? [])
        .filter((s) => s.team === 'home')
        .map((s) => ({ name: s.name, minute: `${s.minute}'` })),
    },
    awayTeam: {
      name: m.awayTeam.name,
      crest: getTeamCrest(m.awayTeam.id),
      scorers: (m.goalScorers ?? [])
        .filter((s) => s.team === 'away')
        .map((s) => ({ name: s.name, minute: `${s.minute}'` })),
    },
    score: `${m.homeScore ?? 0} - ${m.awayScore ?? 0}`,
  }));

export function LiveMatchSection({ onCardClick }: { onCardClick?: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (LIVE_MATCHES.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % LIVE_MATCHES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Card dimensions for the 'calc' formula
  const ACTIVE_WIDTH = 222.46;
  const INACTIVE_WIDTH = 144.11;
  const GAP = 16;

  // Center of active card relative to the container's start
  const activeCenterOffset = (currentIndex * (INACTIVE_WIDTH + GAP)) + (ACTIVE_WIDTH / 2);

  return (
    <div className="w-full overflow-hidden mb-6 relative py-4">
      <div className="relative w-full h-[150px] flex items-center overflow-visible">
        {/* Sliding Track - Positioned at 50% by default, then offset by activeCenterOffset */}
        <motion.div
          className="flex items-center absolute"
          style={{
            left: '50%',
            gap: `${GAP}px`,
            width: 'max-content',
            transformOrigin: 'left center'
          }}
          animate={{ x: -activeCenterOffset }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        >
          {LIVE_MATCHES.map((match, index) => {
            const isActive = index === currentIndex;

            return (
              <motion.div
                key={match.id}
                onClick={onCardClick}
                animate={{
                  width: isActive ? `${ACTIVE_WIDTH}px` : `${INACTIVE_WIDTH}px`,
                  opacity: isActive ? 1 : 0.4,
                  scale: isActive ? 1 : 0.9
                }}
                transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
                className="relative h-[140.17px] rounded-[15.05px] overflow-hidden shadow-2xl shrink-0 cursor-pointer"
                style={{
                  background: isActive
                    ? 'linear-gradient(91.01deg, #4568DC 0%, #B06AB3 100%)'
                    : '#1a1b2e',
                  border: '1.27px solid rgba(255,255,255,0.05)'
                }}
              >
                {/* Visual Polish */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                   {isActive && (
                     <div className="absolute top-0 right-0 w-full h-full bg-white/[0.04] -skew-x-[15deg] origin-top translate-x-1/2" />
                   )}
                </div>

                <div className="relative z-10 w-full h-full">
                  {isActive ? (
                    <div className="flex flex-col items-center pt-3 h-full px-4 overflow-hidden">
                      <span className="text-[9px] font-bold text-white uppercase mb-4 tracking-[0.2em] w-full text-right pr-2">
                        LIVE MATCH
                      </span>

                      <div className="flex items-center justify-between w-full mt-1 px-1">
                        <div className="w-10 h-10 flex items-center justify-center shrink-0">
                          <img src={match.homeTeam.crest} className="max-w-full max-h-full object-contain" alt="" />
                        </div>
                        <span className="text-[26px] font-bold text-white tracking-widest leading-none">
                          {match.score}
                        </span>
                        <div className="w-10 h-10 flex items-center justify-center shrink-0">
                          <img src={match.awayTeam.crest} className="max-w-full max-h-full object-contain" alt="" />
                        </div>
                      </div>

                      <div className="flex flex-col w-full mt-auto pb-4 gap-0.5 pl-1">
                        {match.homeTeam.scorers.map((s, i) => (
                          <span key={i} className="text-[9px] font-medium text-white/90 truncate max-w-[120px]">
                            {s.name} {s.minute}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full px-2">
                      <div className="w-10 h-10 flex items-center justify-center mb-4">
                        <img
                          src={match.homeTeam.crest}
                          className="max-w-full max-h-full object-contain opacity-70"
                          alt=""
                        />
                      </div>
                      <span className="text-[11px] font-medium text-white/60 text-center leading-tight truncate w-full">
                        {match.homeTeam.scorers[0]?.name || match.homeTeam.name}
                      </span>
                      <span className="text-[9px] text-white/30 mt-0.5">
                        {match.homeTeam.scorers[0]?.minute || "KO"}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
