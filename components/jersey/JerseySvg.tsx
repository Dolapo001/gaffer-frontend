import { useId } from 'react'
import { normalizeJerseyConfig } from './jerseyUtils'
import type { JerseyPattern } from './jerseyUtils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JerseySvgProps {
  primaryColor: string
  secondaryColor: string
  jerseyPattern: JerseyPattern
  teamCode?: string
  width?: number
  height?: number
  /** Chest branding label. Defaults to "GAFFER". */
  brandingText?: string
  className?: string
}

// ─── SVG Paths (viewBox "0 0 100 112") ────────────────────────────────────────
//
// T-shaped football jersey with crew-neck collar.
//
//      37,10 ── Q50,22 ──  63,10    ← crew neck neckline
//     /                          \
//   9,18                        91,18  ← shoulders
//    |                            |
//   2,29                        98,29  ← sleeve outer tips
//   Q0,33                    Q100,33
//   2,37                        98,37  ← sleeve underarm corners
//    |                            |
//  10,37 ──────────────────── 90,37   ← underarm seam
//    |                            |
//  10,100 ─────────────────── 90,100  ← hem
//

/** Full jersey silhouette */
const JERSEY_PATH =
  'M37,10 Q23,4 9,18 L2,29 Q0,33 2,37 L10,37 L10,100 L90,100 L90,37 L98,37 Q100,33 98,29 L91,18 Q77,4 63,10 Q50,20 37,10Z'

/** Left shoulder + sleeve panel — filled with secondary colour */
const LEFT_PANEL =
  'M37,10 Q23,4 9,18 L2,29 Q0,33 2,37 L10,37 L20,28 L28,14Z'

/** Right shoulder + sleeve panel — filled with secondary colour (mirror of left) */
const RIGHT_PANEL =
  'M63,10 Q77,4 91,18 L98,29 Q100,33 98,37 L90,37 L80,28 L72,14Z'

/** Crew-neck arc — used for collar trim stroke */
const COLLAR_ARC = 'M37,10 Q50,22 63,10'

// ─── Pattern fill helpers ─────────────────────────────────────────────────────

function SolidFill({ primary }: { primary: string }) {
  return <path d={JERSEY_PATH} fill={primary} />
}

function StripeFill({
  primary, secondary, id,
}: { primary: string; secondary: string; id: string }) {
  return (
    <>
      <defs>
        <pattern id={id} x="0" y="0" width="10" height="112" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="5" height="112" fill={primary} />
          <rect x="5" y="0" width="5" height="112" fill={secondary} />
        </pattern>
      </defs>
      <path d={JERSEY_PATH} fill={`url(#${id})`} />
    </>
  )
}

function SplitFill({
  primary, secondary, leftId, rightId,
}: { primary: string; secondary: string; leftId: string; rightId: string }) {
  return (
    <>
      <defs>
        <clipPath id={leftId}><rect x="0" y="0" width="50" height="112" /></clipPath>
        <clipPath id={rightId}><rect x="50" y="0" width="50" height="112" /></clipPath>
      </defs>
      <path d={JERSEY_PATH} fill={primary}   clipPath={`url(#${leftId})`} />
      <path d={JERSEY_PATH} fill={secondary} clipPath={`url(#${rightId})`} />
    </>
  )
}

function GradientFill({
  primary, secondary, id,
}: { primary: string; secondary: string; id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={primary} />
          <stop offset="100%" stopColor={secondary} />
        </linearGradient>
      </defs>
      <path d={JERSEY_PATH} fill={`url(#${id})`} />
    </>
  )
}

// ─── JerseySvg ────────────────────────────────────────────────────────────────

/**
 * Realistic SVG football jersey renderer.
 *
 * - Safe for server and client components (no state, no effects).
 * - Uses React.useId() so multiple instances never share SVG def IDs.
 * - Supports four patterns: solid | stripes | split | gradient.
 * - Secondary colour appears on shoulder/sleeve panels and collar trim.
 * - "GAFFER" chest branding is always rendered in secondary colour.
 * - Always reflects the team's home kit (pass primaryColor / secondaryColor
 *   directly from team.jersey — never from resolvedKits or away-kit data).
 */
export function JerseySvg({
  primaryColor,
  secondaryColor,
  jerseyPattern,
  teamCode,
  width = 50,
  height = 58,
  brandingText = 'GAFFER',
  className,
}: JerseySvgProps) {
  const uid = useId()

  // Normalise at the render boundary — never mutates fetched data.
  const { primaryColor: pc, secondaryColor: sc } = normalizeJerseyConfig({
    primaryColor,
    secondaryColor,
    jerseyPattern,
  })

  // Unique per-instance IDs — prevents SVG def collisions on multi-jersey pages.
  const stripeId = `${uid}-s`
  const leftId   = `${uid}-l`
  const rightId  = `${uid}-r`
  const gradId   = `${uid}-g`
  const shineId  = `${uid}-sh`

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <defs>
        {/* Radial shine — gives the jersey subtle 3-D depth */}
        <radialGradient id={shineId} cx="38%" cy="28%" r="55%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.20)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      {/* 1 ── Body fill (chosen pattern) */}
      {jerseyPattern === 'solid'    && <SolidFill    primary={pc} />}
      {jerseyPattern === 'stripes'  && <StripeFill   primary={pc} secondary={sc} id={stripeId} />}
      {jerseyPattern === 'split'    && <SplitFill    primary={pc} secondary={sc} leftId={leftId} rightId={rightId} />}
      {jerseyPattern === 'gradient' && <GradientFill primary={pc} secondary={sc} id={gradId} />}

      {/* 2 ── Shoulder / sleeve panels in secondary colour */}
      <path d={LEFT_PANEL}  fill={sc} />
      <path d={RIGHT_PANEL} fill={sc} />

      {/* 3 ── Shine overlay for depth */}
      <path d={JERSEY_PATH} fill={`url(#${shineId})`} />

      {/* 4 ── Jersey outline */}
      <path d={JERSEY_PATH} fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth="0.8" />

      {/* 5 ── Collar trim: thick secondary band + white highlight */}
      <path
        d={COLLAR_ARC}
        fill="none"
        stroke={sc}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d={COLLAR_ARC}
        fill="none"
        stroke="rgba(255,255,255,0.30)"
        strokeWidth="0.8"
        strokeLinecap="round"
      />

      {/* 6 ── GAFFER chest branding — secondary colour, italic bold */}
      <text
        x="50"
        y="66"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={sc}
        fontSize="11"
        fontWeight="900"
        fontStyle="italic"
        fontFamily="system-ui, 'Arial Black', Arial, sans-serif"
        letterSpacing="0.8"
        style={{ userSelect: 'none' }}
      >
        {brandingText}
      </text>

      {/* 7 ── Optional team code below branding */}
      {teamCode && (
        <text
          x="50"
          y="80"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={sc}
          fontSize="8"
          fontWeight="700"
          fontFamily="system-ui, Arial, sans-serif"
          opacity="0.85"
          style={{ userSelect: 'none' }}
        >
          {teamCode}
        </text>
      )}
    </svg>
  )
}

export default JerseySvg
export type { JerseyPattern }
