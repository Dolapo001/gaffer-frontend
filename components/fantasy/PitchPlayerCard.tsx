import React from 'react';
import { JerseySvg } from '@/components/jersey/JerseySvg';
import { normalizeJerseyConfig } from '@/components/jersey/jerseyUtils';
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
  /** Kept for API compatibility; ignored — JerseySvg is always rendered. */
  kitImageUrl?: string;
  /**
   * Team home-kit config. When omitted the card renders a neutral grey
   * fallback jersey so no external image request is ever made.
   */
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
 * PitchPlayerCard — pitch-view player card.
 *
 * Always renders the JerseySvg system.  If no `jersey` prop is passed
 * (e.g. stale persisted store data) a neutral grey fallback jersey is shown
 * so the layout never breaks and no external image requests are made.
 */
export const PitchPlayerCard: React.FC<PitchPlayerCardProps> = ({
  playerName,
  fixture,
  jersey,
  className = '',
  onClick,
  selected = false,
  highlightMode = 'none',
  points,
  kitAreaClassName = 'bg-black/20',
  status = 'fit',
  captaincy = null,
}) => {
  // ── Resolve jersey colours ─────────────────────────────────────────────────
  // Always produce a valid config — never fall back to an external image.
  // Priority: jersey prop → teamColor solid → neutral grey fallback.
  const resolvedJersey = normalizeJerseyConfig(
    jersey ?? { primaryColor: '#4a5568', secondaryColor: '#718096', jerseyPattern: 'solid' }
  );

  // ── Container ring / highlight colours ────────────────────────────────────
  let containerRing = selected
    ? 'ring-2 ring-[#ff6b00] scale-105 z-10 border-[#ff6b00]'
    : 'border-white/20';

  if (highlightMode === 'sub_out') {
    containerRing = 'ring-2 ring-red-600 scale-105 z-10 border-red-600';
  } else if (highlightMode === 'sub_in_valid') {
    containerRing = 'ring-2 ring-green-500 border-green-500';
  }

  const infoBg =
    status === 'warning'
      ? 'bg-[#FFEB3B]'
      : status === 'injured'
      ? 'bg-[#EF4444]'
      : 'bg-white';

  const nameColor =
    status === 'fit'
      ? 'text-[#37003c]'
      : status === 'warning'
      ? 'text-black'
      : 'text-white';

  const fixtureColor =
    status === 'fit' || status === 'warning' ? 'text-[#37003c]' : 'text-white';

  return (
    <button
      style={{
        width: '64px',
        height: '102px',
        borderRadius: '5px',
        border: selected
          ? '2px solid #ff6b00'
          : '0.5px solid rgba(255, 255, 255, 0.4)',
        background: 'rgba(55, 0, 60, 0.35)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
      className={`flex flex-col overflow-hidden transition-all relative group ${
        selected ? 'scale-105 z-10' : ''
      } ${className}`}
      onClick={onClick}
    >
      {/* ── Points badge ─────────────────────────────────────────────────── */}
      {points !== undefined && (
        <div className="absolute top-1 right-1 z-20 bg-[#ff6b00] text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-md leading-none">
          {points}
        </div>
      )}

      {/* ── Jersey section ───────────────────────────────────────────────── */}
      <div className="flex-1 flex items-end justify-center pb-0 px-0 relative overflow-hidden">
        <JerseySvg
          primaryColor={resolvedJersey.primaryColor}
          secondaryColor={resolvedJersey.secondaryColor}
          jerseyPattern={resolvedJersey.jerseyPattern}
          teamCode={jersey?.teamCode}
          width={64}
          height={72}
          className="drop-shadow-md group-hover:scale-105 transition-transform -mb-1"
        />

        {/* Status badge ── top-right corner */}
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

        {/* Captaincy badge ── top-left corner */}
        {captaincy && (
          <div
            className={`absolute top-0.5 left-0.5 w-4 h-4 ${
              captaincy === 'C' ? 'bg-[#ff6b00]' : 'bg-[#6B46C1]'
            } rounded-full flex items-center justify-center border border-white/40 shadow-sm`}
          >
            <span className="text-white text-[9px] font-black leading-none">
              {captaincy}
            </span>
          </div>
        )}
      </div>

      {/* ── Info bar ─────────────────────────────────────────────────────── */}
      <div className={`w-full flex flex-col font-sans ${infoBg} py-1`}>
        <div className="px-0.5 text-center flex items-center justify-center min-h-[14px]">
          <p className={`text-[10px] font-black truncate uppercase tracking-tighter leading-none ${nameColor}`}>
            {playerName || 'Player'}
          </p>
        </div>
        <div className="px-0.5 text-center flex items-center justify-center min-h-[12px] mt-0.5">
          <p className={`text-[9px] font-bold truncate uppercase tracking-[0.01em] leading-none opacity-80 ${fixtureColor}`}>
            {fixture || 'TBC'}
          </p>
        </div>
      </div>
    </button>
  );
};

export default PitchPlayerCard;
