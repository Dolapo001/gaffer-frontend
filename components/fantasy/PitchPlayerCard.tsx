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
      style={{
        width: '65px',
        height: '92px',
        borderRadius: '5.45px',
        border: selected ? '2px solid #ff6b00' : '0.4px solid rgba(255, 255, 255, 0.45)',
        background: 'rgba(55, 0, 60, 0.25)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0px 1.02px 1.7px 0px rgba(0, 0, 0, 0.1)',
      }}
      className={`flex flex-col overflow-hidden transition-all relative group ${selected ? 'scale-105 z-10' : ''} ${className}`}
      onClick={onClick}
    >
      {/* 1. Jersey Section (Glass) */}
      <div className="flex-1 flex items-center justify-center pt-1.5 pb-1">
        <img 
          src={kitImageUrl || "https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_0-66.webp"} 
          alt={playerName} 
          className="w-[85%] h-auto object-contain drop-shadow-xl"
        />
        
        {/* Status indicator in top right if any - design triangles */}
        {status !== 'fit' && (
          <div className="absolute top-1 right-1 flex flex-col items-center">
            {status === 'warning' && (
              <div className="w-3.5 h-3.5 bg-yellow-400 rounded-[2px] shadow-sm flex items-center justify-center transform rotate-45 mb-1 border-[0.5px] border-black/5">
                <span className="text-[8px] font-black text-black transform rotate-[-45deg] leading-none">!</span>
              </div>
            )}
            {status === 'injured' && (
              <div className="w-3.5 h-3.5 bg-red-600 rounded-[2px] shadow-sm flex items-center justify-center transform rotate-45 mb-1 border-[0.5px] border-black/5">
                <span className="text-[8px] font-black text-white transform rotate-[-45deg] leading-none">!</span>
              </div>
            )}
          </div>
        )}

        {/* Vice Captaincy Badge - Circular design like in spec */}
        {captaincy && (
          <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-[#37003c] rounded-full flex items-center justify-center border border-white/40 shadow-sm">
            <span className="text-white text-[8px] font-black">{captaincy}</span>
          </div>
        )}
      </div>

      {/* 2. Info Boxes (Solid) */}
      <div className={`w-full flex flex-col font-sans ${status === 'warning' ? 'bg-[#FFEB3B]' : status === 'injured' ? 'bg-[#EF4444]' : 'bg-white'} border-t border-black/5 py-1`}>
        {/* Name Row */}
        <div className="px-1 text-center leading-tight">
          <span className={`text-[11px] font-bold block truncate ${status === 'fit' || status === 'warning' ? 'text-[#37003c]' : 'text-white'}`}>
            {playerName || 'Player'}
          </span>
        </div>
        {/* Fixture Row */}
        <div className="px-1 text-center leading-tight">
          <span className={`text-[10px] font-medium block truncate ${status === 'fit' || status === 'warning' ? 'text-[#37003c]/70' : 'text-white/80'}`}>
            {fixture || 'TBC'}
          </span>
        </div>
      </div>
    </button>
  );
};

export default PitchPlayerCard;
