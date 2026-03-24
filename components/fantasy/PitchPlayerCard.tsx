import React from 'react';
import { JerseySvg } from '@/components/jersey/JerseySvg';
import type { JerseyPattern } from '@/components/jersey/jerseyUtils';

export interface JerseyProps {
  primaryColor: string;
  secondaryColor: string;
  jerseyPattern: JerseyPattern;
  teamCode?: string;
}

interface PitchPlayerCardProps {
  playerName: string;
  fixture: string;
  /** External kit image URL. When `jersey` is also provided, jersey takes precedence. */
  kitImageUrl: string;
  /** Inline SVG jersey. When present, renders JerseySvg instead of the external image. */
  jersey?: JerseyProps;
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
  jersey,
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
        width: '64px',
        height: '102px',
        borderRadius: '5px',
        border: selected ? '2px solid #ff6b00' : '0.5px solid rgba(255, 255, 255, 0.4)',
        background: 'rgba(55, 0, 60, 0.35)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
      className={`flex flex-col overflow-hidden transition-all relative group ${selected ? 'scale-105 z-10' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Points Badge */}
      {points !== undefined && (
        <div className="absolute top-1 right-1 z-20 bg-[#ff6b00] text-white text-[10px] sm:text-[11px] font-black px-1.5 py-0.5 rounded-md shadow-md">
          {points}
        </div>
      )}

      {/* 1. Jersey Section (Glass) */}
      <div className="flex-1 flex items-center justify-center pt-2 pb-1 px-1 relative">
        {jersey ? (
          <JerseySvg
            primaryColor={jersey.primaryColor}
            secondaryColor={jersey.secondaryColor}
            jerseyPattern={jersey.jerseyPattern}
            teamCode={jersey.teamCode}
            width={46}
            height={54}
            className="drop-shadow-md group-hover:scale-110 transition-transform"
          />
        ) : (
          <img
            src={kitImageUrl || "https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_0-66.webp"}
            alt={playerName}
            className="w-[80%] h-auto object-contain drop-shadow-md group-hover:scale-110 transition-transform"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_0-66.webp"
            }}
          />
        )}

        {/* Status indicator top right */}
        {status !== 'fit' && (
          <div className="absolute top-1 right-0.5">
            {status === 'warning' && (
              <div className="w-4 h-4 bg-yellow-400 rounded-sm shadow-sm flex items-center justify-center border-[0.5px] border-black/10">
                 <span className="text-[10px] font-black text-black leading-none -mt-0.5">!</span>
              </div>
            )}
            {status === 'injured' && (
              <div className="w-4 h-4 bg-red-600 rounded-sm shadow-sm flex items-center justify-center border-[0.5px] border-black/10">
                 <span className="text-[10px] font-black text-white leading-none -mt-0.5">!</span>
              </div>
            )}
          </div>
        )}

        {/* Captaincy Badge - AMETHYST/PURPLE for Vice-Captain in spec */}
        {captaincy && (
          <div className={`absolute top-0.5 left-0.5 w-4 h-4 ${captaincy === 'C' ? 'bg-[#ff6b00]' : 'bg-[#6B46C1]'} rounded-full flex items-center justify-center border border-white/40 shadow-sm`}>
            <span className="text-white text-[9px] font-black leading-none">{captaincy}</span>
          </div>
        )}
      </div>

      {/* 2. Info Boxes (Solid) */}
      <div className={`w-full flex flex-col font-sans ${status === 'warning' ? 'bg-[#FFEB3B]' : status === 'injured' ? 'bg-[#EF4444]' : 'bg-white'} py-1`}>
        {/* Name Row */}
        <div className="px-0.5 text-center flex items-center justify-center min-h-[14px]">
          <p className={`text-[10px] font-black truncate uppercase tracking-tighter leading-none ${status === 'fit' ? 'text-[#37003c]' : status === 'warning' ? 'text-black' : 'text-white'}`}>
            {playerName || 'Player'}
          </p>
        </div>
        {/* Fixture Row */}
        <div className="px-0.5 text-center flex items-center justify-center min-h-[12px] mt-0.5">
          <p className={`text-[9px] font-bold truncate uppercase tracking-[0.01em] leading-none opacity-80 ${status === 'fit' || status === 'warning' ? 'text-[#37003c]' : 'text-white'}`}>
            {fixture || 'TBC'}
          </p>
        </div>
      </div>
    </button>
  );
};

export default PitchPlayerCard;
