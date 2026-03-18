'use client';

import { useRouter } from 'next/navigation';

interface Fixture {
  id: string;
  homeTeam: { name: string; logo: string };
  awayTeam: { name: string; logo: string };
  time: string;
  date: string;
  status: 'upcoming' | 'finished';
  score?: { home: number; away: number };
}

const upcomingFixtures: Fixture[] = [
  {
    id: '1',
    homeTeam: { name: 'Engineering', logo: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg' },
    awayTeam: { name: 'Law', logo: '/images/law_logo.png' },
    time: '14:00',
    date: 'SAT 14:00',
    status: 'upcoming'
  },
  {
    id: '2',
    homeTeam: { name: 'Engineering', logo: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg' },
    awayTeam: { name: 'Law', logo: '/images/law_logo.png' },
    time: '14:00',
    date: 'SAT 14:00',
    status: 'upcoming'
  }
];

const previousFixtures: Fixture[] = [
  {
    id: '3',
    homeTeam: { name: 'Engineering', logo: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg' },
    awayTeam: { name: 'Law', logo: '/images/law_logo.png' },
    time: '14:00',
    date: 'SAT 14:00',
    status: 'finished',
    score: { home: 4, away: 0 }
  },
  {
    id: '4',
    homeTeam: { name: 'Engineering', logo: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg' },
    awayTeam: { name: 'Law', logo: '/images/law_logo.png' },
    time: '14:00',
    date: 'SAT 14:00',
    status: 'finished',
    score: { home: 4, away: 0 }
  },
  {
    id: '5',
    homeTeam: { name: 'Engineering', logo: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg' },
    awayTeam: { name: 'Law', logo: '/images/law_logo.png' },
    time: '14:00',
    date: 'SAT 14:00',
    status: 'finished',
    score: { home: 4, away: 0 }
  }
];

export function FixturesSection() {
  const router = useRouter();
  return (
    <div className="flex flex-col w-full px-[13.37px]" style={{ gap: '20px', paddingBottom: '40px' }}>
      {/* Match Schedule (Step 454 & 463 Specs) */}
      <div 
        className="flex flex-col mx-auto" 
        style={{ 
          width: '297px', 
          height: '223px',
        }}
      >
        <h2 
          className="text-white text-[15.93px] font-medium"
          style={{ 
            fontFamily: "'Poppins', sans-serif",
            height: '39px', // Header + spacing offset
            display: 'flex',
            alignItems: 'center'
          }}
        >
          Match Schedule
        </h2>
        
        <div 
          className="flex flex-col gap-[8px]"
          style={{ height: '184px' }}
        >
          {upcomingFixtures.map((fixture) => (
            <FixtureCard 
              key={fixture.id} 
              fixture={fixture} 
              customWidth="297px" 
              customHeight="88px" 
              onClick={() => router.push(`/app/match/${fixture.id}`)}
            />
          ))}
        </div>
      </div>

      {/* Previous Fixtures */}
      <div className="flex flex-col gap-4">
        <h2 
          className="text-white text-[15.93px] font-medium"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          Previous Fixtures
        </h2>
        
        <div className="flex flex-col gap-3">
          <h3 className="text-[#D2B5FF] text-[12px] font-medium pl-1">Round 1</h3>
          {previousFixtures.slice(0, 3).map((fixture) => (
            <FixtureCard 
              key={fixture.id} 
              fixture={fixture} 
              onClick={() => router.push(`/app/match/${fixture.id}`)}
            />
          ))}
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <h3 className="text-[#D2B5FF] text-[12px] font-medium pl-1">Round 2</h3>
          {previousFixtures.slice(0, 3).map((fixture) => (
            <FixtureCard 
              key={`r2-${fixture.id}`} 
              fixture={fixture} 
              onClick={() => router.push(`/app/match/${fixture.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FixtureCard({ fixture, customWidth, customHeight, onClick }: { fixture: Fixture, customWidth?: string, customHeight?: string, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`bg-[#1a1b2e]/60 rounded-[28.03px] border border-[#2E2F3E] p-4 flex items-center justify-between shadow-lg ${onClick ? 'cursor-pointer active:scale-[0.98] hover:bg-[#1a1b2e]/80 transition-all' : ''}`}
      style={{ 
        width: customWidth || '302.25px',
        height: customHeight || '110.15px',
        backdropFilter: 'blur(8px)'
      }}
    >
      {/* Home Team */}
      <div className="flex flex-col items-center gap-2 w-[80px]">
        <div className="w-10 h-10 flex items-center justify-center">
          <img src={fixture.homeTeam.logo} alt={fixture.homeTeam.name} className="w-full h-full object-contain" />
        </div>
        <span className="text-white text-[10.6px] font-medium text-center">{fixture.homeTeam.name}</span>
      </div>

      {/* Center Info */}
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-[#94A3B8] text-[9.3px] font-medium uppercase">{fixture.date}</span>
        <div 
          className="bg-[#2a2b45] rounded-[5.3px] flex items-center justify-center"
          style={{ width: '60px', height: '35px' }}
        >
          <span className="text-white text-[14.6px] font-bold">
            {fixture.status === 'finished' ? `${fixture.score?.home} : ${fixture.score?.away}` : fixture.time}
          </span>
        </div>
      </div>

      {/* Away Team */}
      <div className="flex flex-col items-center gap-2 w-[80px]">
        <div className="w-10 h-10 flex items-center justify-center">
          <img src={fixture.awayTeam.logo} alt={fixture.awayTeam.name} className="w-full h-full object-contain" />
        </div>
        <span className="text-white text-[10.6px] font-medium text-center">{fixture.awayTeam.name}</span>
      </div>
    </div>
  );
}
