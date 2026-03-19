import React from 'react';

interface PitchPlayerCardProps {
  playerName: string;
  fixture: string;
  kitImageUrl: string;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
  highlightMode?: 'none' | 'sub_out' | 'sub_in_valid';
  points?: number;
  kitAreaClassName?: string;
  status?: 'fit' | 'injured' | 'warning';
  captaincy?: 'C' | 'V' | null;
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
  highlightMode = 'none',
  points,
  kitAreaClassName = "bg-black/20",
  status = 'fit',
  captaincy = null,
}) => {
  let containerRing = selected ? 'ring-2 ring-[#ff6b00] scale-105 z-10 border-[#ff6b00]' : 'border-white/20';
  let bottomBg = 'bg-[#f4f0f5] text-[#37003c]';
  let topTextBg = 'bg-white text-[#37003c]';
  let topTextBorder = 'border-[#f4f0f5]';

  if (highlightMode === 'sub_out') {
    containerRing = 'ring-2 ring-red-600 scale-105 z-10 border-red-600';
    topTextBg = 'bg-white text-red-600';
    bottomBg = 'bg-red-600 text-white';
    topTextBorder = 'border-red-600';
  } else if (highlightMode === 'sub_in_valid') {
    containerRing = 'ring-2 ring-green-500 border-green-500';
    topTextBg = 'bg-white text-green-600';
    bottomBg = 'bg-green-500 text-white';
    topTextBorder = 'border-green-500';
  }

  return (
    <button 
      className={`flex flex-col w-[62px] sm:w-[76px] rounded-xl overflow-hidden shadow-lg transition-all border relative group backdrop-blur-md bg-white/10 ${containerRing} ${className}`}
      onClick={onClick}
    >
      {/* Points Badge */}
      {points !== undefined && (
        <div className="absolute top-1 right-1 z-20 bg-[#ff6b00] text-white text-[10px] sm:text-[11px] font-black px-1.5 py-0.5 rounded-md shadow-md">
          {points}
        </div>
      )}

      {/* Injury/Warning Status Badge */}
      {status !== 'fit' && (
        <div className="absolute top-1 right-1 z-20 flex shadow-sm">
           {status === 'injured' && (
             <div className="w-4 h-4 bg-red-600 rounded-sm flex items-center justify-center border border-white/20">
                <span className="text-white text-[8px] font-black">!</span>
             </div>
           )}
           {status === 'warning' && (
             <div className="w-4 h-4 bg-yellow-400 rounded-sm flex items-center justify-center border border-white/20">
                <span className="text-black text-[8px] font-black">!</span>
             </div>
           )}
        </div>
      )}

      {/* Captaincy Badge */}
      {captaincy && (
        <div className={`absolute top-1 left-1 z-20 w-4 h-4 rounded-full flex items-center justify-center border border-white/20 shadow-sm ${captaincy === 'C' ? 'bg-[#ff6b00]' : 'bg-purple-600'}`}>
           <span className="text-white text-[8px] font-black">{captaincy}</span>
        </div>
      )}

      {/* 1. Top Section (Player Image Area) */}
      <div className={`bg-transparent p-0 flex items-center justify-center h-[60px] sm:h-[74px] overflow-hidden`}>
        <img 
          src={kitImageUrl || "https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_0-66.webp"} 
          alt={`${playerName}`} 
          className={`${kitImageUrl.includes('images') ? 'w-full h-full object-cover object-top' : 'w-[85%] h-[85%] object-contain mt-1'} drop-shadow-lg relative z-10 mx-auto`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_0-66.webp"
          }}
        />
      </div>

      {/* 2. Bottom Section (Player Info Area) */}
      <div className="flex flex-col w-full text-center leading-none">
        {/* Row 1: Player Name */}
        <div className={`${topTextBg} font-semibold text-[10px] sm:text-[11px] py-1.5 px-1 truncate border-b ${topTextBorder}`}>
          {playerName}
        </div>
        
        {/* Row 2: Fixture/Opponent */}
        <div className={`${bottomBg} text-[9px] sm:text-[10px] py-1.5 px-1 truncate`}>
          {fixture}
        </div>
      </div>
    </button>
  );
};

export default PitchPlayerCard;
