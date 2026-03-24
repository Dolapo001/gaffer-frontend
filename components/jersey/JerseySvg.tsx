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

// ─── SVG Paths  (viewBox "0 0 100 108") ──────────────────────────────────────
//
//  Anatomy (matches the reference image exactly):
//
//       38,4 ──────── 50,26 ──────── 62,4          ← V-neck
//      /      \                  /      \
//  Q16,0     26,20            74,20    Q84,0         ← shoulder curves
//    |                                    |
//   6,14                              94,14          ← shoulder tips
//    |                                    |
//   0,28                              100,28         ← sleeve outer
//  Q0,38                             Q100,38
//   4,42 ──────────────────────── 96,42             ← sleeve cuff
//    |                                    |
//  16,44 ─────────────────────── 84,44             ← underarm seam
//    |                                    |
//  16,106 ─────────────────────── 84,106           ← hem
//
// ─────────────────────────────────────────────────────────────────────────────

/** Full jersey silhouette — V-neck, short sleeves, straight body */
const JERSEY_PATH =
  'M38,4 L50,26 L62,4 Q84,0 94,14 L100,28 Q100,38 96,42 L84,44 L84,106 L16,106 L16,44 L4,42 Q0,38 0,28 L6,14 Q16,0 38,4Z'

/**
 * Left shoulder + sleeve panel in secondary colour.
 * Diagonal inner edge runs from underarm up to the V-neck notch,
 * giving the classic shoulder-stripe silhouette seen in the reference image.
 */
const LEFT_PANEL =
  'M38,4 Q16,0 6,14 L0,28 Q0,38 4,42 L16,44 L26,20 Z'

/**
 * Right shoulder + sleeve panel — mirror of left.
 */
const RIGHT_PANEL =
  'M62,4 Q84,0 94,14 L100,28 Q100,38 96,42 L84,44 L74,20 Z'

/** V-neck collar outline path */
const V_NECK = 'M38,4 L50,26 L62,4'

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
        <pattern id={id} x="0" y="0" width="10" height="108" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="5" height="108" fill={primary}   />
          <rect x="5" y="0" width="5" height="108" fill={secondary} />
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
        <clipPath id={leftId} ><rect x="0"  y="0" width="50" height="108" /></clipPath>
        <clipPath id={rightId}><rect x="50" y="0" width="50" height="108" /></clipPath>
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
 * Realistic SVG football jersey — matches the GAFFER card reference image.
 *
 * Visual anatomy:
 *  • Primary colour  → jersey body
 *  • Secondary colour → shoulder/sleeve panels + "GAFFER" chest text
 *  • V-neck collar with thin highlight line
 *  • Shoulder panels always in secondary regardless of body pattern
 *  • Subtle radial shine + bottom shadow for fabric depth
 *  • Always renders the team's HOME kit colours
 *
 * Safe for server and client (no state, no effects).
 * useId() prevents SVG def collisions when many jerseys share a page.
 */
export function JerseySvg({
  primaryColor,
  secondaryColor,
  jerseyPattern,
  teamCode,
  width = 50,
  height = 54,
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
  const stripeId = `${uid}-s`
  const leftId   = `${uid}-l`
  const rightId  = `${uid}-r`
  const gradId   = `${uid}-g`
  const shineId  = `${uid}-sh`
  const shadowId = `${uid}-sd`

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 108"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <defs>
        {/* Radial highlight — top-centre light source gives fabric depth */}
        <radialGradient id={shineId} cx="50%" cy="18%" r="55%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.20)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)"    />
        </radialGradient>

        {/* Vertical shadow at hem — grounds the jersey */}
        <linearGradient id={shadowId} x1="0%" y1="60%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="rgba(0,0,0,0)"    />
          <stop offset="100%" stopColor="rgba(0,0,0,0.30)" />
        </linearGradient>
      </defs>

      {/* ── 1. Body fill (pattern-driven) ───────────────────────────────── */}
      {jerseyPattern === 'solid'    && <SolidFill    primary={pc} />}
      {jerseyPattern === 'stripes'  && <StripeFill   primary={pc} secondary={sc} id={stripeId} />}
      {jerseyPattern === 'split'    && <SplitFill    primary={pc} secondary={sc} leftId={leftId} rightId={rightId} />}
      {jerseyPattern === 'gradient' && <GradientFill primary={pc} secondary={sc} id={gradId} />}

      {/* ── 2. Shoulder / sleeve panels — always secondary ──────────────── */}
      <path d={LEFT_PANEL}  fill={sc} />
      <path d={RIGHT_PANEL} fill={sc} />

      {/* ── 3. Shine overlay ────────────────────────────────────────────── */}
      <path d={JERSEY_PATH} fill={`url(#${shineId})`} />

      {/* ── 4. Bottom shadow ─────────────────────────────────────────────── */}
      <path d={JERSEY_PATH} fill={`url(#${shadowId})`} />

      {/* ── 5. Jersey outline ────────────────────────────────────────────── */}
      <path
        d={JERSEY_PATH}
        fill="none"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="0.9"
      />

      {/* ── 6. V-neck collar — dark edge + inner highlight ───────────────── */}
      <path
        d={V_NECK}
        fill="none"
        stroke="rgba(0,0,0,0.45)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={V_NECK}
        fill="none"
        stroke="rgba(255,255,255,0.20)"
        strokeWidth="0.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── 7. Sleeve cuff lines — secondary panel border ────────────────── */}
      <line x1="16" y1="44" x2="4"  y2="42" stroke="rgba(0,0,0,0.20)" strokeWidth="0.6" />
      <line x1="84" y1="44" x2="96" y2="42" stroke="rgba(0,0,0,0.20)" strokeWidth="0.6" />

      {/* ── 8. "GAFFER" chest branding — secondary colour, bold italic ────── */}
      <text
        x="50"
        y="68"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={sc}
        fontSize="13"
        fontWeight="900"
        fontStyle="italic"
        fontFamily="system-ui, 'Arial Black', Arial, sans-serif"
        letterSpacing="0.5"
        style={{ userSelect: 'none' }}
      >
        {brandingText}
      </text>

      {/* ── 9. Optional team code — small text below branding ───────────── */}
      {teamCode && (
        <text
          x="50"
          y="82"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={sc}
          fontSize="8"
          fontWeight="700"
          fontFamily="system-ui, Arial, sans-serif"
          opacity="0.75"
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
