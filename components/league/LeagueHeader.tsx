'use client';
 
import Image from 'next/image';
 
interface LeagueHeaderProps {
  name?: string;
  bannerUrl?: string;
}

export function LeagueHeader({ name, bannerUrl }: LeagueHeaderProps) {
  return (
    <div className="flex flex-col items-center pt-2 pb-6 w-full">
      {/* Small Iconic Logo (Lion or Competition Logo) */}
      <div 
        className="mb-4 flex items-center justify-center" 
        style={{ width: '48px', height: '48px' }}
      >
        <Image
          src={bannerUrl || "https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg"}
          alt="League Logo"
          width={48}
          height={48}
          priority
          unoptimized
          className="w-full h-full object-contain filter brightness-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
        />
      </div>
      
      {/* Competition Name */}
      <div className="px-4 text-center">
        <h1 
          className="text-white font-black tracking-tight leading-none"
          style={{ 
            fontFamily: "'Chakra Petch', sans-serif",
            fontSize: '24px',
            textTransform: 'uppercase',
            letterSpacing: '0.02em'
          }}
        >
          {name || "BOWEN FANS LEAGUES"}
        </h1>
      </div>
    </div>
  );
}
