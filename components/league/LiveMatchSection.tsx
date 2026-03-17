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

export function LiveMatchSection({ onCardClick }: { onCardClick?: () => void }) {
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
          onClick={onCardClick}
          className="p-3 relative overflow-hidden flex flex-col items-center shadow-lg shrink-0 cursor-pointer active:scale-[0.98] transition-transform"
          style={{ 
            background: 'linear-gradient(90deg, #4568DC 0%, #B06AB3 100%)',
            width: '222.46px',
            height: '140.17px',
            borderRadius: '15.05px'
          }}
        >
          {/* Subtle Accent Overlay (Diagonal split seen in image) */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-white/[0.03] -skew-x-[20deg] origin-top translate-x-4 pointer-events-none" />

          {/* LIVE MATCH Tag */}
          <div 
            className="absolute flex items-center justify-center text-white text-center uppercase whitespace-nowrap"
            style={{ 
              width: '51px',
              height: '9px',
              top: '18px',
              left: '86px',
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 500,
              fontSize: '8.76px',
              lineHeight: '9.56px',
              letterSpacing: '0px'
            }}
          >
            Live Match
          </div>

          {/* Main Content Area / Bounding Box (Step 170) */}
          <div 
            className="absolute pointer-events-none"
            style={{
              width: '191.34px',
              height: '103.51px',
              top: '18px',
              left: '15.98px',
              border: '1px solid rgba(255,255,255,0.05)', // Subtle debug/guide outline
              opacity: 0
            }}
          />

          {/* Home Club Logo (Step 174) */}
          <div 
            className="absolute flex items-center justify-center overflow-hidden"
            style={{
              width: '41px',
              height: '42px',
              top: '37px',
              left: '16px',
            }}
          >
            <img 
              src={match.homeTeam.crest} 
              alt={match.homeTeam.name} 
              className="w-full h-full object-contain"
            />
          </div>

          {/* Away Club Logo (Step 193/196) */}
          <div 
            className="absolute flex items-center justify-center overflow-hidden"
            style={{
              width: '41px',
              height: '42px',
              top: '37px',
              right: '16px',
            }}
          >
            <img 
              src={match.awayTeam.crest} 
              alt={match.awayTeam.name} 
              className="w-full h-full object-contain"
            />
          </div>

          {/* Score Container (Step 186/206) - Centered between clubs */}
          <div 
            className="absolute flex items-center justify-center text-white text-center"
            style={{
              width: '47px',
              height: '14px',
              top: '49.94px',
              left: '88.48px',
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
              fontSize: '21.03px',
              lineHeight: '13.14px',
              letterSpacing: '0px'
            }}
          >
            2 - 2
          </div>

          {/* Home Scorers (Step 213) */}
          <div 
            className="absolute text-white"
            style={{
              width: '52px',
              height: '12px',
              top: '94.62px',
              left: '15.98px',
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 500,
              fontSize: '8.76px',
              lineHeight: '11.39px'
            }}
          >
            De Jong 66&apos;
          </div>
          <div 
            className="absolute text-white"
            style={{
              width: '44px',
              height: '12px',
              top: '109.51px',
              left: '15.98px',
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 500,
              fontSize: '8.76px',
              lineHeight: '11.39px'
            }}
          >
            Depay 79&apos;
          </div>

          {/* Away Scorers (Step 213) */}
          <div 
            className="absolute text-white text-right"
            style={{
              width: '45px',
              height: '12px',
              top: '94.62px',
              left: '161.57px',
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 500,
              fontSize: '8.76px',
              lineHeight: '11.39px'
            }}
          >
            Alvarez 21&apos;
          </div>
          <div 
            className="absolute text-white text-right"
            style={{
              width: '47px',
              height: '12px',
              top: '109.51px',
              left: '160.32px',
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 500,
              fontSize: '8.76px',
              lineHeight: '11.39px'
            }}
          >
            Palmer 70&apos;
          </div>
        </div>

        {/* Side Card (Brighton/Samuel) */}
        <div 
          className="rounded-[15.05px] border border-white/5 flex flex-col items-center justify-center p-3 shadow-xl shrink-0"
          style={{
            width: '144.11px',
            height: '140.17px',
            background: 'linear-gradient(180deg, rgba(5, 5, 5, 0.084) 0%, rgba(5, 13, 48, 0) 96.35%)',
            backgroundColor: '#1a1b2e' // Base color
          }}
        >
          <div 
            className="flex items-center justify-center overflow-hidden mb-3"
            style={{ width: '41px', height: '42px' }}
          >
            <img 
              src="https://upload.wikimedia.org/wikipedia/en/f/f2/Brighton_&_Hove_Albion_logo.svg" 
              alt="Brighton" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-center">
            <p 
              className="text-white text-center"
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 500,
                fontSize: '11px',
                lineHeight: '1.2'
              }}
            >
              Samuel 40&apos;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

