'use client';

/**
 * Figma specs:
 *   width:         222.46px
 *   height:        140.17px
 *   border-radius: 15.05px
 *   angle:         0deg  |  opacity: 1
 *   background:    linear-gradient(90deg, #4568DC 0%, #B06AB3 100%)
 */

interface MatchScorer {
  name: string;
  minute: number;
}

interface LiveMatchCardProps {
  homeScorers?: MatchScorer[];
  awayScorers?: MatchScorer[];
  homeScore?: number;
  awayScore?: number;
}

const defaultHomeScorers: MatchScorer[] = [
  { name: 'De Jong', minute: 66 },
  { name: 'Depay',   minute: 79 },
];

const defaultAwayScorers: MatchScorer[] = [
  { name: 'Alvarez', minute: 21 },
  { name: 'Palmer',  minute: 70 },
];

export default function LiveMatchCard({
  homeScorers = defaultHomeScorers,
  awayScorers = defaultAwayScorers,
  homeScore = 2,
  awayScore = 2,
}: LiveMatchCardProps) {
  return (
    // Figma width: 222.52px → w-full inside a constrained parent
    // Figma height: 140.17px → fixed h
    <div
      className="relative w-full overflow-hidden flex flex-col"
      style={{
        // Figma: linear-gradient(90deg, #4568DC 0%, #B06AB3 100%)
        background: 'linear-gradient(90deg, #4568DC 0%, #B06AB3 100%)',
        // Figma: height 140.17px, border-radius 15.05px
        height: '140.17px',
        borderRadius: '15.05px',
      }}
    >
      {/* Subtle noise/overlay to soften the gradient */}
      <div className="absolute inset-0 bg-white/5 pointer-events-none" />

      {/* LIVE MATCH pill — centered top */}
      <div className="flex justify-center pt-3 relative z-10">
        <span className="text-white text-[10px] font-semibold tracking-widest uppercase">
          LIVE MATCH
        </span>
      </div>

      {/* Score — centered middle */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <span
          className="text-white font-bold tracking-tight"
          style={{ fontSize: '36px', lineHeight: '1' }}
        >
          {homeScore} - {awayScore}
        </span>
      </div>

      {/* Scorers row — bottom */}
      <div className="flex justify-between px-4 pb-4 relative z-10">
        {/* Home scorers — left aligned */}
        <div className="flex flex-col gap-0.5">
          {homeScorers.map((s) => (
            <span key={`${s.name}-${s.minute}`} className="text-white/90 text-[11px]">
              {s.name} {s.minute}&apos;
            </span>
          ))}
        </div>

        {/* Away scorers — right aligned */}
        <div className="flex flex-col gap-0.5 items-end">
          {awayScorers.map((s) => (
            <span key={`${s.name}-${s.minute}`} className="text-white/90 text-[11px]">
              {s.name} {s.minute}&apos;
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
