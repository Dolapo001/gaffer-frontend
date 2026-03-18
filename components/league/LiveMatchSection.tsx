'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

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

const LIVE_MATCHES: MatchData[] = [
  {
    id: 'm1',
    homeTeam: {
      name: 'Barcelona',
      crest: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
      scorers: [
        { name: 'De Jong', minute: "66'" },
        { name: 'Depay', minute: "79'" }
      ]
    },
    awayTeam: {
      name: 'Man City',
      crest: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
      scorers: [
        { name: 'Alvarez', minute: "21'" },
        { name: 'Palmer', minute: "70'" }
      ]
    },
    score: '2 - 2'
  },
  {
    id: 'm2',
    homeTeam: {
      name: 'Brighton',
      crest: 'https://upload.wikimedia.org/wikipedia/en/f/f2/Brighton_&_Hove_Albion_logo.svg',
      scorers: [
        { name: 'Samuel', minute: "40'" }
      ]
    },
    awayTeam: {
      name: 'Chelsea',
      crest: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
      scorers: []
    },
    score: '1 - 0'
  },
  {
    id: 'm3',
    homeTeam: {
      name: 'Arsenal',
      crest: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
      scorers: [
        { name: 'Saka', minute: "12'" },
        { name: 'Odegaard', minute: "34'" }
      ]
    },
    awayTeam: {
      name: 'Liverpool',
      crest: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
      scorers: [
        { name: 'Salah', minute: "50'" }
      ]
    },
    score: '2 - 1'
  },
  {
    id: 'm4',
    homeTeam: {
      name: 'Real Madrid',
      crest: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
      scorers: [
        { name: 'Benzema', minute: "20'" }
      ]
    },
    awayTeam: {
      name: 'PSG',
      crest: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
      scorers: [
        { name: 'Mbappe', minute: "45'" }
      ]
    },
    score: '1 - 1'
  }
];

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

