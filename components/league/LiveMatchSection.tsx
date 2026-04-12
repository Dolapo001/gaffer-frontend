'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

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
  isLive?: boolean;
}

interface LiveMatchSectionProps {
  onCardClick?: (id: string) => void;
  fixtures?: any[];
}

export function LiveMatchSection({ onCardClick, fixtures }: LiveMatchSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Match data mapping
  const realMatches: MatchData[] = (fixtures || []).map(f => ({
    id: f._id,
    homeTeam: {
      // typeof null === 'object' in JS, so guard with truthiness check too
      name:  (f.homeTeamId && typeof f.homeTeamId === 'object') ? f.homeTeamId.name  : 'Home',
      crest: (f.homeTeamId && typeof f.homeTeamId === 'object') ? f.homeTeamId.logoUrl || '' : '',
      scorers: [],
    },
    awayTeam: {
      name:  (f.awayTeamId && typeof f.awayTeamId === 'object') ? f.awayTeamId.name  : 'Away',
      crest: (f.awayTeamId && typeof f.awayTeamId === 'object') ? f.awayTeamId.logoUrl || '' : '',
      scorers: [],
    },
    score: `${f.score?.home ?? 0} - ${f.score?.away ?? 0}`,
    isLive: f.status === 'live'
  }));

  const displayMatches = realMatches;

  // Design constants
  const CARD_WIDTH = 222.53;
  const GAP = 16;
  const START_PADDING = 20;

  useEffect(() => {
    if (displayMatches.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayMatches.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [displayMatches.length]);

  // Flush Left Scrolling Logic
  useEffect(() => {
    if (containerRef.current && displayMatches.length > 0) {
      const scrollPos = currentIndex * (CARD_WIDTH + GAP);
      containerRef.current.scrollTo({
        left: scrollPos,
        behavior: 'smooth'
      });
    }
  }, [currentIndex, displayMatches.length]);

  if (displayMatches.length === 0) return null;

  return (
    <div className="w-full relative overflow-hidden py-4">
      <div 
        ref={containerRef}
        className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4"
        style={{ scrollPaddingLeft: `${START_PADDING}px` }}
      >
        <div className="flex shrink-0 pb-2" style={{ paddingLeft: `${START_PADDING}px`, gap: `${GAP}px` }}>
          {displayMatches.map((match: MatchData, index: number) => {
            const isActive = index === currentIndex;

            return (
              <motion.div
                key={match.id}
                onClick={() => {
                  setCurrentIndex(index);
                  if (isActive) onCardClick?.(match.id);
                }}
                className="snap-start shrink-0 rounded-[24px] overflow-hidden cursor-pointer"
                animate={{
                  opacity: isActive ? 1 : 0.6,
                  scale: isActive ? 1 : 0.98,
                }}
                transition={{ duration: 0.5 }}
                style={{
                  width: `${CARD_WIDTH}px`,
                  height: '140.17px',
                  background: isActive
                    ? 'linear-gradient(91.01deg, #4568DC 0%, #B06AB3 100%)'
                    : '#1a2138',
                  border: '1.27px solid rgba(255,255,255,0.05)',
                  boxShadow: isActive ? '0 10px 40px -10px rgba(69, 104, 220, 0.4)' : 'none'
                }}
              >
                <div className="relative z-10 w-full h-full flex flex-col p-4 px-5">
                  <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest mb-3 w-full text-center">
                    {match.isLive ? 'LIVE MATCH' : 'LATEST RESULT'}
                  </span>

                  <div className="flex items-center justify-between w-full">
                    <div className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-full overflow-hidden p-1.5 backdrop-blur-sm shadow-inner">
                       <img src={match.homeTeam.crest} className="w-full h-full object-cover" alt="" />
                    </div>
                    <span className="text-[30px] font-black text-white italic tracking-widest">{match.score}</span>
                    <div className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-full overflow-hidden p-1.5 backdrop-blur-sm shadow-inner">
                       <img src={match.awayTeam.crest} className="w-full h-full object-cover" alt="" />
                    </div>
                  </div>

                  <div className="flex justify-between w-full mt-auto mb-1 opacity-90 px-1">
                     <span className="text-[9px] font-bold text-white italic">
                        {match.homeTeam.name}
                     </span>
                     <span className="text-[9px] font-bold text-white italic">
                        {match.awayTeam.name}
                     </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {/* Invisible spacer to allow snap-start on trailing items */}
          <div className="w-[150px] shrink-0" />
        </div>
      </div>

      <div className="flex justify-center gap-1.5 pt-2">
        {displayMatches.map((_: any, i: number) => (
          <div 
            key={i} 
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-white w-3' : 'bg-white/20'}`} 
          />
        ))}
      </div>
    </div>
  );
}
