'use client';

import React from 'react';

// Define the shape of the data we'll eventually get from the database
export interface Team {
  name: string;
  logo: string;
}

export interface NextMatchProps {
  gameweek?: string;
  homeTeam?: Team;
  awayTeam?: Team;
  day?: string;
  time?: string;
}

function TeamLogo({ name, logo }: { name: string; logo?: string }) {
  const [imgError, setImgError] = React.useState(false)
  const initials = name ? name.substring(0, 3).toUpperCase() : 'TBD'

  if (!logo || imgError) {
    return (
      <div className="w-[48px] h-[48px] rounded-full overflow-hidden bg-gradient-to-br from-[#2C355A] to-[#181E32] flex items-center justify-center flex-shrink-0 border border-white/10 shadow-sm">
        <span className="text-white font-bold text-[12px]">{initials}</span>
      </div>
    )
  }

  return (
    <div className="w-[48px] h-[48px] rounded-full overflow-hidden bg-white/5 flex items-center justify-center p-1 flex-shrink-0 border border-white/10 shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo}
        alt={name}
        className="w-full h-full object-contain"
        onError={() => setImgError(true)}
      />
    </div>
  )
}

export const NextMatchWidget = ({
  gameweek,
  homeTeam,
  awayTeam,
  day,
  time,
}: NextMatchProps) => {
  const hTeam = homeTeam || { name: 'Home Team', logo: '' }
  const aTeam = awayTeam || { name: 'Away Team', logo: '' }

  return (
    <div className="w-full max-w-[380px] mx-auto mt-6 font-chakra">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-3 px-1">
        <h2 className="text-white text-[18px] font-bold tracking-wide">Next Match</h2>
        <span className="text-[#e25f05] text-[13px] font-medium">{gameweek || 'Next Match'}</span>
      </div>

      {/* Main Card Container */}
      <div className="w-full bg-[#1c2230] border border-white/5 rounded-[16px] p-5 flex flex-row items-center justify-between shadow-lg">
        {/* Home Team */}
        <div className="flex flex-col items-center gap-2 w-1/3 min-w-0">
          <TeamLogo name={hTeam.name} logo={hTeam.logo} />
          <span className="text-white font-bold text-[13px] text-center truncate w-full">{hTeam.name}</span>
        </div>

        {/* Match Info (Center) */}
        <div className="flex flex-col items-center justify-center gap-1.5 w-1/3">
          <span className="text-[#94a3b8] text-[11px] font-medium tracking-wide uppercase">{day || 'TBD'}</span>
          <div className="bg-[#242c3d] rounded-[8px] px-4 py-2 border border-white/5 shadow-inner">
            <span className="text-white font-chakra text-[16px] font-bold tracking-wider">{time || '--:--'}</span>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center gap-2 w-1/3 min-w-0">
          <TeamLogo name={aTeam.name} logo={aTeam.logo} />
          <span className="text-white font-bold text-[13px] text-center truncate w-full">{aTeam.name}</span>
        </div>
      </div>
    </div>
  )
}
