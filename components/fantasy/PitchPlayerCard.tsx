import React from 'react';

interface PitchPlayerCardProps {
  playerName: string;
  fixture: string;
  kitImageUrl: string;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
  kitAreaClassName?: string;
}

/**
 * PitchPlayerCard component for the pitch view.
 * Built according to exact design specifications.
 */
export const PitchPlayerCard: React.FC<PitchPlayerCardProps> = ({
  playerName,
  fixture,
  kitImageUrl,
  className = "",
  onClick,
  selected = false,
  kitAreaClassName = "bg-[#6A7B51]",
}) => {
  return (
    <button 
      className={`flex flex-col w-[62px] sm:w-[76px] rounded-xl overflow-hidden shadow-lg transition-all border ${
        selected ? 'ring-2 ring-[#ff6b00] scale-105 z-10 border-[#ff6b00]' : 'border-black/5'
      } ${className}`}
      onClick={onClick}
    >
      {/* 1. Top Section (Kit/Shirt Area) */}
      <div className={`${kitAreaClassName} p-1.5 sm:p-2.5 flex items-center justify-center h-[54px] sm:h-[68px]`}>
        <img 
          src={kitImageUrl} 
          alt={`${playerName} kit`} 
          className="object-contain w-full h-full drop-shadow-md relative z-10"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_0-66.webp";
          }}
        />
      </div>

      {/* 2. Bottom Section (Player Info Area) */}
      <div className="flex flex-col w-full text-center leading-none">
        {/* Row 1: Player Name - Solid White */}
        <div className="bg-white text-[#37003c] font-semibold text-[10px] sm:text-[11px] py-1.5 px-1 truncate border-b border-[#f4f0f5]">
          {playerName}
        </div>
        
        {/* Row 2: Fixture/Opponent - Light Gray */}
        <div className="bg-[#f4f0f5] text-[#37003c] text-[9px] sm:text-[10px] py-1.5 px-1 truncate">
          {fixture}
        </div>
      </div>
    </button>
  );
};

export default PitchPlayerCard;
