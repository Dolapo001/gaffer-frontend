'use client';

import Image from 'next/image';

interface MatchScorer {
  name: string;
  minute: string;
}

interface MatchProps {
  homeTeam: { name: string; crest: string; scorers: MatchScorer[] };
  awayTeam: { name: string; crest: string; scorers: MatchScorer[] };
  score: string;
  sideCard: { name: string; minute: string; logoStyle: any };
}

export function LiveMatchSection() {
  const match = {
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
  };

  return (
    <div className="w-full overflow-x-auto no-scrollbar mb-6 px-4">
      <div 
        className="flex gap-3"
        style={{ width: 'max-content', height: '140px' }}
      >
        {/* Main Live Match Card */}
        <div 
          className="rounded-[24px] p-3 relative overflow-hidden flex flex-col justify-between shadow-lg shrink-0"
          style={{ 
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)',
            width: '260px',
            height: '140px'
          }}
        >
          {/* LIVE MATCH Tag */}
          <div className="flex justify-center mb-0.5">
            <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-[9px] font-bold px-3 py-0.5 rounded-full tracking-wider uppercase">
              Live Match
            </span>
          </div>

          {/* Score & Crests Row */}
          <div className="flex items-center justify-between px-2">
            <div className="w-10 h-10 relative flex items-center justify-center">
              <img src={match.homeTeam.crest} alt="Home" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            
            <div className="flex flex-col items-center">
              <span className="text-white text-[28px] font-black leading-none tracking-tight">
                {match.score}
              </span>
            </div>

            <div className="w-10 h-10 relative flex items-center justify-center">
              <img src={match.awayTeam.crest} alt="Away" className="w-full h-full object-contain drop-shadow-md" />
            </div>
          </div>

          {/* Scorers Row */}
          <div className="flex justify-between items-end px-2 pb-1">
            <div className="flex flex-col">
              {match.homeTeam.scorers.map((s, i) => (
                <span key={i} className="text-white/80 text-[10px] font-medium leading-[1.2]">
                  {s.name} {s.minute}
                </span>
              ))}
            </div>
            <div className="flex flex-col items-end text-right">
              {match.awayTeam.scorers.map((s, i) => (
                <span key={i} className="text-white/80 text-[10px] font-medium leading-[1.2]">
                  {s.name} {s.minute}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Side Card (Brighton/Samuel) */}
        <div 
          className="w-[100px] h-[140px] rounded-[24px] bg-[#1a1b2e] border border-white/5 flex flex-col items-center justify-center gap-3 p-3 shadow-xl shrink-0"
        >
          <div className="w-12 h-12 relative">
            <img 
              src="https://upload.wikimedia.org/wikipedia/en/f/f2/Brighton_&_Hove_Albion_logo.svg" 
              alt="Brighton" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-center">
            <p className="text-white text-[11px] font-bold leading-tight">Samuel 40&apos;</p>
          </div>
        </div>
      </div>
    </div>
  );
}

