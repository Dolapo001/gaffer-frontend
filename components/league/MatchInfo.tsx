'use client';

import Image from 'next/image';

/**
 * Figma specs (inner content panel of LiveMatchCard):
 *   Container  — 191.34 × 103.51px  |  top: 18px  left: 15.98px
 *   Club logo  — 41 × 42px          |  top: 37px  left: 16px
 *   Score text — 47 × 14px          |  top: 49.94px  left: 88.48px
 *   Typography — Poppins SemiBold 600  21.03px  line-height: 13.14px  center
 *   Text color — #FFFFFF
 */

interface MatchScorer {
  name: string;
  minute: number;
}

interface MatchInfoProps {
  homeTeam?: {
    name: string;
    logoUrl: string;
  };
  awayTeam?: {
    name: string;
    logoUrl: string;
  };
  homeScore?: number;
  awayScore?: number;
  homeScorers?: MatchScorer[];
  awayScorers?: MatchScorer[];
}

const defaults: Required<MatchInfoProps> = {
  homeTeam: {
    name: 'FC Barcelona',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
  },
  awayTeam: {
    name: 'Manchester City',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
  },
  homeScore: 2,
  awayScore: 2,
  homeScorers: [
    { name: 'De Jong', minute: 66 },
    { name: 'Depay',   minute: 79 },
  ],
  awayScorers: [
    { name: 'Alvarez', minute: 21 },
    { name: 'Palmer',  minute: 70 },
  ],
};

export default function MatchInfo({
  homeTeam   = defaults.homeTeam,
  awayTeam   = defaults.awayTeam,
  homeScore  = defaults.homeScore,
  awayScore  = defaults.awayScore,
  homeScorers = defaults.homeScorers,
  awayScorers = defaults.awayScorers,
}: MatchInfoProps) {
  return (
    /**
     * Figma container: 191.34 × 103.51px
     * Positioned relative so child absolute offsets are exact.
     */
    <div
      className="relative"
      style={{ width: '191.34px', height: '103.51px' }}
    >
      {/* ── Home club logo ──────────────────────────────────────
          Figma: 41 × 42px  |  top: 37px  left: 16px
      ────────────────────────────────────────────────────────── */}
      <div
        className="absolute"
        style={{ top: '37px', left: '16px', width: '41px', height: '42px' }}
      >
        <Image
          src={homeTeam.logoUrl}
          alt={homeTeam.name}
          width={41}
          height={42}
          priority
          unoptimized
          className="object-contain w-full h-full"
        />
      </div>

      {/* ── Away club logo (mirrored: same top, right-aligned) ──
          No Figma spec given for away logo — placed symmetrically.
          right ≈ 16px  (191.34 - 16 - 41 = 134.34px left)
      ────────────────────────────────────────────────────────── */}
      <div
        className="absolute"
        style={{ top: '37px', right: '16px', width: '41px', height: '42px' }}
      >
        <Image
          src={awayTeam.logoUrl}
          alt={awayTeam.name}
          width={41}
          height={42}
          unoptimized
          className="object-contain w-full h-full"
        />
      </div>

      {/* ── Score text ──────────────────────────────────────────
          Figma: 47 × 14px  |  top: 49.94px  left: 88.48px
          Font: Poppins SemiBold 600  21.03px  line-height: 13.14px
          Color: #FFFFFF  align: center
      ────────────────────────────────────────────────────────── */}
      <div
        className="absolute text-white text-center"
        style={{
          top: '49.94px',
          left: '88.48px',
          width: '47px',
          height: '14px',
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 600,
          fontSize: '21.03px',
          lineHeight: '13.14px',
          letterSpacing: '0px',
          // Pull text up so it visually centers within the 14px box
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
        }}
      >
        {homeScore} - {awayScore}
      </div>

      {/* ── Home scorers (bottom-left) ──────────────────────────
          Positioned below home logo area
      ────────────────────────────────────────────────────────── */}
      <div
        className="absolute flex flex-col gap-0.5"
        style={{ bottom: '0px', left: '0px' }}
      >
        {homeScorers.map((s) => (
          <span
            key={`home-${s.name}-${s.minute}`}
            className="text-white/90"
            style={{ fontSize: '9px', lineHeight: '1.4', fontFamily: 'Poppins, sans-serif' }}
          >
            {s.name} {s.minute}&apos;
          </span>
        ))}
      </div>

      {/* ── Away scorers (bottom-right) ─────────────────────────
          Positioned below away logo area
      ────────────────────────────────────────────────────────── */}
      <div
        className="absolute flex flex-col gap-0.5 items-end"
        style={{ bottom: '0px', right: '0px' }}
      >
        {awayScorers.map((s) => (
          <span
            key={`away-${s.name}-${s.minute}`}
            className="text-white/90"
            style={{ fontSize: '9px', lineHeight: '1.4', fontFamily: 'Poppins, sans-serif' }}
          >
            {s.name} {s.minute}&apos;
          </span>
        ))}
      </div>
    </div>
  );
}
