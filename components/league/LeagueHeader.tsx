'use client';

import Image from 'next/image';

export function LeagueHeader() {
  return (
    <div className="flex flex-col items-center pt-2 pb-4">
      {/* Premier League Logo */}
      <div className="mb-2" style={{ width: '41px', height: '57.95px' }}>
        <Image
          src="https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg"
          alt="Premier League"
          width={41}
          height={58}
          priority
          unoptimized
          className="drop-shadow-sm w-full h-full object-contain"
        />
      </div>
      
      {/* Title Area */}
      <div 
        className="flex items-center justify-center pt-2"
        style={{ width: '100%', minHeight: '30px' }}
      >
        <h1 
          className="text-white font-medium text-center uppercase"
          style={{ 
            fontFamily: "'Poppins', sans-serif",
            fontSize: '21.38px',
            lineHeight: '16.75px',
            fontWeight: 500,
            letterSpacing: '0px',
            verticalAlign: 'middle'
          }}
        >
          BOWEN FANS LEAGUES
        </h1>
      </div>
    </div>
  );
}
