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

// ─── SVG Paths  (viewBox "0 0 100 112") ──────────────────────────────────────
//
//  Coordinate guide
//  ─────────────────────────────────────────────────────────────────────────────
//
//         36,8 ── Q50,21 ── 64,8          ← crew-neck opening
//        /                        \
//    Q21,2                        Q79,2   ← shoulder curves
//      |                              |
//    10,16                          90,16  ← shoulder tips
//      |                              |
//    2,29                           98,29  ← sleeve outer corners
//   Q0,34                         Q100,34
//    2,38                           98,38  ← sleeve underarm corners
//      |                              |
//   12,38 ────────────────────── 88,38   ← underarm seam
//      |                              |
//   12,108 ────────────────────── 88,108 ← hem
//  ─────────────────────────────────────────────────────────────────────────────

/** Complete jersey silhouette */
const JERSEY_PATH =
  'M36,8 Q50,21 64,8 Q79,2 90,16 L98,29 Q100,34 98,38 L88,38 L88,108 L12,108 L12,38 L2,38 Q0,34 2,29 L10,16 Q21,2 36,8Z'

/**
 * Left shoulder + sleeve panel (secondary colour).
 * Covers the sleeve from collar point down to underarm seam,
 * creating the classic diagonal shoulder-stripe look.
 */
const LEFT_PANEL =
  'M36,8 Q21,2 10,16 L2,29 Q0,34 2,38 L12,38 L24,24 L30,10Z'

/**
 * Right shoulder + sleeve panel (secondary colour, mirrored).
 */
const RIGHT_PANEL =
  'M64,8 Q79,2 90,16 L98,29 Q100,34 98,38 L88,38 L76,24 L70,10Z'

/** Crew-neck arc — used only for the collar edge line */
const COLLAR_ARC = 'M36,8 Q50,21 64,8'

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
          <rect x="0" y="0" width="5"  height="112" fill={primary}   />
          <rect x="5" y="0" width="5"  height="112" fill={secondary} />
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
        <clipPath id={leftId} ><rect x="0"  y="0" width="50"  height="112" /></clipPath>
        <clipPath id={rightId}><rect x="50" y="0" width="50"  height="112" /></clipPath>
      </defs>
      <path d={JERSEY_PATH} fill={primary}   clipPath={`url(#${leftId})`}  />
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
          <stop offset="0%"   stopColor={primary}   />
          <stop offset="100%" stopColor={secondary} />
        </linearGradient>
      </defs>
      <path d={JERSEY_PATH} fill={`url(#${id})`} />
    </>
  )
}

// ─── JerseySvg ────────────────────────────────────────────────────────────────

/**
 * Realistic SVG football jersey — matches the GAFFER card design.
 *
 * Visual anatomy (matches reference image):
 *  • Primary colour  → jersey body
 *  • Secondary colour → shoulder / sleeve panels  +  "GAFFER" chest text
 *  • Four body patterns: solid | stripes | split | gradient
 *  • Shoulder panels always in secondary regardless of body pattern
 *  • Subtle radial shine + bottom shadow for 3-D depth
 *  • Always uses the team's HOME kit — pass primaryColor / secondaryColor
 *    directly from team.jersey, never from resolvedKits or away-kit data.
 *
 * Safe for server and client components (no state, no effects).
 * useId() prevents SVG def ID collisions when many jerseys render on one page.
 */
export function JerseySvg({
  primaryColor,
  secondaryColor,
  jerseyPattern,
  teamCode,
  width = 50,
  height = 56,
  brandingText = 'GAFFER',
  className,
}: JerseySvgProps) {
  const uid = useId()

  // Normalise at render boundary — never mutates fetched data.
  const { primaryColor: pc, secondaryColor: sc } = normalizeJerseyConfig({
    primaryColor,
    secondaryColor,
    jerseyPattern,
  })

  // Unique per-instance IDs — prevents SVG def collisions.
  const stripeId  = `${uid}-s`
  const leftId    = `${uid}-l`
  const rightId   = `${uid}-r`
  const gradId    = `${uid}-g`
  const shineId   = `${uid}-sh`
  const shadowId  = `${uid}-sd`

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
        {/* Radial highlight — top-left light source gives fabric a 3-D feel */}
        <radialGradient id={shineId} cx="32%" cy="22%" r="52%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.22)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)"    />
        </radialGradient>

        {/* Linear shadow at hem — anchors the jersey visually */}
        <linearGradient id={shadowId} x1="0%" y1="65%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="rgba(0,0,0,0)"    />
          <stop offset="100%" stopColor="rgba(0,0,0,0.28)" />
        </linearGradient>
      </defs>

      {/* ── 1. Body fill (driven by jerseyPattern) ──────────────────────── */}
      {jerseyPattern === 'solid'    && <SolidFill    primary={pc} />}
      {jerseyPattern === 'stripes'  && <StripeFill   primary={pc} secondary={sc} id={stripeId} />}
      {jerseyPattern === 'split'    && <SplitFill    primary={pc} secondary={sc} leftId={leftId} rightId={rightId} />}
      {jerseyPattern === 'gradient' && <GradientFill primary={pc} secondary={sc} id={gradId} />}

      {/* ── 2. Shoulder / sleeve panels — always secondary colour ───────── */}
      <path d={LEFT_PANEL}  fill={sc} />
      <path d={RIGHT_PANEL} fill={sc} />

      {/* ── 3. Shine overlay (top-left highlight) ───────────────────────── */}
      <path d={JERSEY_PATH} fill={`url(#${shineId})`} />

      {/* ── 4. Bottom shadow ─────────────────────────────────────────────── */}
      <path d={JERSEY_PATH} fill={`url(#${shadowId})`} />

      {/* ── 5. Jersey outline ────────────────────────────────────────────── */}
      <path
        d={JERSEY_PATH}
        fill="none"
        stroke="rgba(0,0,0,0.30)"
        strokeWidth="0.8"
      />

      {/* ── 6. Collar edge — subtle dark arc, no secondary colour ───────── */}
      <path
        d={COLLAR_ARC}
        fill="none"
        stroke="rgba(0,0,0,0.40)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {/* Inner collar highlight */}
      <path
        d={COLLAR_ARC}
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="0.6"
        strokeLinecap="round"
      />

      {/* ── 7. "GAFFER" chest branding — secondary colour, bold italic ───── */}
      <text
        x="50"
        y="70"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={sc}
        fontSize="12"
        fontWeight="900"
        fontStyle="italic"
        fontFamily="system-ui, 'Arial Black', Arial, sans-serif"
        letterSpacing="0.6"
        style={{ userSelect: 'none' }}
      >
        {brandingText}
      </text>

      {/* ── 8. Optional team code (small, below branding) ────────────────── */}
      {teamCode && (
        <text
          x="50"
          y="84"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={sc}
          fontSize="8"
          fontWeight="700"
          fontFamily="system-ui, Arial, sans-serif"
          opacity="0.80"
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
