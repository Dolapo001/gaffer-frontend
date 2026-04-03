'use client'

/**
 * PlayerCard.tsx
 *
 * A compact Premier League-style player card designed to sit on top of a
 * football pitch visualisation.  The card has three distinct zones:
 *
 *  ┌─────────────────┐
 *  │                 │  ← Kit area   (olive green bg, team shirt image)
 *  │   [kit image]   │
 *  │                 │
 *  ├─────────────────┤
 *  │   Ebenezer      │  ← Name row   (white bg, dark-purple bold text)
 *  ├─────────────────┤
 *  │   WHU (H)       │  ← Fixture row (light grayish-purple bg, normal text)
 *  └─────────────────┘
 *
 * Props:
 *  - playerName   Player's display name (truncated with ellipsis if too long)
 *  - fixture      Short fixture string e.g. "WHU (H)"
 *  - kitImageUrl  URL / path to the team-kit PNG (transparent background works best)
 *  - selected     Whether the card is in a "selected / highlighted" state
 *  - onClick      Optional click handler (opens PlayerDetailDrawer etc.)
 *  - className    Extra Tailwind classes for the outer wrapper
 *
 * Color tokens (all defined in tailwind.config.ts under the `pitch` namespace):
 *  bg-pitch-kit-bg       →  #6A7B51  (olive green kit area)
 *  text-pitch-pl-purple  →  #37003c  (Premier League dark purple)
 *  bg-pitch-fixture-bg   →  #f4f0f5  (light grayish-purple fixture row)
 */

import Image from 'next/image'
import { motion } from 'framer-motion'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PlayerCardProps {
  /** Player display name — truncates with ellipsis when too long */
  playerName: string
  /** Short fixture string shown in the bottom row, e.g. "WHU (H)" */
  fixture: string
  /** URL or path to the team-kit image (transparent PNG recommended) */
  kitImageUrl: string
  /** Highlights the card with an orange ring when true */
  selected?: boolean
  /** Called when the card is tapped */
  onClick?: () => void
  /** Extra Tailwind classes applied to the outermost wrapper */
  className?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PlayerCard({
  playerName,
  fixture,
  kitImageUrl,
  selected = false,
  onClick,
  className = '',
}: PlayerCardProps) {
  return (
    /**
     * OUTER WRAPPER
     * ─────────────
     * - `w-14`  keeps the card compact enough to fit on a pitch tile
     * - `rounded-xl overflow-hidden` rounds all four corners and clips children
     * - `shadow-[0_2px_8px_rgba(0,0,0,0.55)]` gives a pitch-shadow lift
     * - `ring-2 ring-gaffer-orange` appears only when `selected` is true
     * - `cursor-pointer` and `whileTap` make it feel native / tappable
     */
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={onClick ? { scale: 0.93 } : undefined}
      aria-label={`${playerName} — ${fixture}`}
      className={[
        'relative flex flex-col w-14 rounded-xl overflow-hidden',
        'shadow-[0_2px_8px_rgba(0,0,0,0.55)]',
        // Selected state — orange glow ring
        selected
          ? 'ring-2 ring-gaffer-orange shadow-orange-glow'
          : 'ring-1 ring-black/20',
        onClick ? 'cursor-pointer' : 'cursor-default',
        className,
      ].join(' ')}
    >
      {/* ── KIT AREA ──────────────────────────────────────────────────────────
          Olive green background matching the Premier League card design.
          The kit image is centered and given breathing room via padding.
          A very subtle inner shadow at the top/bottom adds depth.
      */}
      <div className="relative flex items-center justify-center bg-pitch-kit-bg px-1.5 pt-2 pb-1">
        {/* Subtle inner vignette to give the kit section some depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/15 pointer-events-none" />

        <div className="relative w-10 h-10 flex-shrink-0">
          <Image
            src={kitImageUrl}
            alt={`${playerName} kit`}
            fill
            sizes="40px"
            className="object-contain drop-shadow-md"
            /**
             * `unoptimized` is left off intentionally — Next.js Image
             * optimisation works here. If using a plain <img> (e.g. in a
             * Storybook context) replace with:
             *   <img src={kitImageUrl} alt={`${playerName} kit`}
             *        className="w-full h-full object-contain drop-shadow-md" />
             */
          />
        </div>
      </div>

      {/* ── NAME ROW ──────────────────────────────────────────────────────────
          White background, bold dark-purple text.
          `truncate` ensures a long name never breaks the card width.
          `min-w-0` on the parent allows flexbox to honour the truncation.
      */}
      <div className="flex items-center justify-center bg-white px-1 py-0.5 min-w-0">
        <span
          className={[
            'text-pitch-pl-purple font-bold text-center leading-tight',
            'truncate w-full text-[9px] tracking-tight',
          ].join(' ')}
          title={playerName}
        >
          {playerName}
        </span>
      </div>

      {/* ── FIXTURE ROW ───────────────────────────────────────────────────────
          Very light grayish-purple background, normal weight, same dark purple.
          Identical vertical padding to the name row for visual symmetry.
      */}
      <div className="flex items-center justify-center bg-pitch-fixture-bg px-1 py-0.5 min-w-0">
        <span
          className={[
            'text-pitch-pl-purple text-center leading-tight font-normal',
            'truncate w-full text-[9px] tracking-tight',
          ].join(' ')}
          title={fixture}
        >
          {fixture}
        </span>
      </div>
    </motion.button>
  )
}

// ─── Fallback plain-<img> variant ────────────────────────────────────────────
//
// Use this inside SVG <foreignObject> or in environments where next/image
// cannot be used (e.g., Storybook without the Next.js adapter).
//
// Usage:  <PlayerCardImg playerName="Ebenezer" fixture="WHU (H)" kitImageUrl="/kits/scorpion.png" />
//

export function PlayerCardImg({
  playerName,
  fixture,
  kitImageUrl,
  selected = false,
  onClick,
  className = '',
}: PlayerCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={onClick ? { scale: 0.93 } : undefined}
      aria-label={`${playerName} — ${fixture}`}
      className={[
        'relative flex flex-col w-14 rounded-xl overflow-hidden',
        'shadow-[0_2px_8px_rgba(0,0,0,0.55)]',
        selected
          ? 'ring-2 ring-gaffer-orange shadow-orange-glow'
          : 'ring-1 ring-black/20',
        onClick ? 'cursor-pointer' : 'cursor-default',
        className,
      ].join(' ')}
    >
      {/* Kit area */}
      <div className="relative flex items-center justify-center bg-pitch-kit-bg px-1.5 pt-2 pb-1">
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/15 pointer-events-none" />
        {/* Plain <img> — no Next.js Image optimisation */}
        <img
          src={kitImageUrl}
          alt={`${playerName} kit`}
          className="relative w-10 h-10 object-contain drop-shadow-md"
        />
      </div>

      {/* Name row */}
      <div className="flex items-center justify-center bg-white px-1 py-0.5 min-w-0">
        <span
          className="text-pitch-pl-purple font-bold text-center leading-tight truncate w-full text-[9px] tracking-tight"
          title={playerName}
        >
          {playerName}
        </span>
      </div>

      {/* Fixture row */}
      <div className="flex items-center justify-center bg-pitch-fixture-bg px-1 py-0.5 min-w-0">
        <span
          className="text-pitch-pl-purple text-center leading-tight font-normal truncate w-full text-[9px] tracking-tight"
          title={fixture}
        >
          {fixture}
        </span>
      </div>
    </motion.button>
  )
}
