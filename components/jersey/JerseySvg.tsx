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

// ─── SVG anatomy  (viewBox "0 0 100 108") ────────────────────────────────────
//
//  Mockup-style football jersey — coordinate system sized so that when
//  rendered at width=68 each SVG unit ≈ 0.68 px, meaning:
//    • GAFFER text (fontSize 18) ≈ 12 px on screen  (legible)
//    • Gradients at 0.28–0.38 opacity are clearly visible at small sizes
//
//  Paths rescaled from the original 120×130 grid (×0.833, ×0.831):
//
//      37,5 ──────── 50,27 ──────── 63,5         ← V-neck opening
//     /    \                      /    \
//  Q20,2  40,8                60,8  Q80,2        ← collar band edges
//     |                                |
//   10,13                           90,13        ← shoulder tips
//     |                                |
//    3,25                            97,25        ← sleeve outer
//  Q2,35                            Q98,35
//    3,40 ──────────────────────── 97,40         ← sleeve cuff
//     |                                |
//   17,43 ──────────────────────── 83,43         ← underarm seam
//     |                                |
//   18,101 ─── Q50,106 ─── 82,101               ← curved hem (slight taper)
//
// ─────────────────────────────────────────────────────────────────────────────

/** Full jersey silhouette — V-neck, tapered body, curved hem */
const JERSEY_PATH =
  'M37,5 L50,27 L63,5 Q80,2 90,13 L97,25 Q98,35 97,40 L83,43 L82,101 Q50,106 18,101 L17,43 L3,40 Q2,35 3,25 L10,13 Q20,2 37,5Z'

/** Left shoulder + sleeve yoke — secondary colour */
const LEFT_PANEL =
  'M37,5 Q20,2 10,13 L3,25 Q2,35 3,40 L17,43 L28,22Z'

/** Right shoulder + sleeve yoke — secondary colour, mirrored */
const RIGHT_PANEL =
  'M63,5 Q80,2 90,13 L97,25 Q98,35 97,40 L83,43 L72,22Z'

/**
 * Collar band — thin filled strip along both sides of the V-neck.
 * Matches secondary colour so collar / yokes read as one piece.
 */
const COLLAR_BAND =
  'M37,5 L50,27 L63,5 L60,7.5 L50,23 L40,7.5Z'

/** V-neck path — reused for stroke layers only */
const V_NECK = 'M37,5 L50,27 L63,5'

// ─── Pattern fill helpers ─────────────────────────────────────────────────────

function SolidFill({ primary, filter }: { primary: string; filter?: string }) {
  return <path d={JERSEY_PATH} fill={primary} filter={filter} />
}

function StripeFill({
  primary, secondary, id, filter,
}: { primary: string; secondary: string; id: string; filter?: string }) {
  return (
    <>
      <defs>
        {/* stripe width ≈ 10 units (scaled from 12 in old 120-wide viewBox) */}
        <pattern id={id} x="0" y="0" width="10" height="108" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="5"  height="108" fill={primary}   />
          <rect x="5" y="0" width="5"  height="108" fill={secondary} />
        </pattern>
      </defs>
      <path d={JERSEY_PATH} fill={`url(#${id})`} filter={filter} />
    </>
  )
}

function SplitFill({
  primary, secondary, leftId, rightId, filter,
}: { primary: string; secondary: string; leftId: string; rightId: string; filter?: string }) {
  return (
    <>
      <defs>
        <clipPath id={leftId} ><rect x="0"  y="0" width="50"  height="108" /></clipPath>
        <clipPath id={rightId}><rect x="50" y="0" width="50"  height="108" /></clipPath>
      </defs>
      <path d={JERSEY_PATH} fill={primary}   clipPath={`url(#${leftId})`}  filter={filter} />
      <path d={JERSEY_PATH} fill={secondary} clipPath={`url(#${rightId})`} />
    </>
  )
}

function GradientFill({
  primary, secondary, id, filter,
}: { primary: string; secondary: string; id: string; filter?: string }) {
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={primary}   />
          <stop offset="100%" stopColor={secondary} />
        </linearGradient>
      </defs>
      <path d={JERSEY_PATH} fill={`url(#${id})`} filter={filter} />
    </>
  )
}

// ─── JerseySvg ────────────────────────────────────────────────────────────────

export function JerseySvg({
  primaryColor,
  secondaryColor,
  jerseyPattern,
  // teamCode intentionally not rendered — too small to read on a 64px card
  width = 50,
  height = 54,
  brandingText = 'GAFFER',
  className,
}: JerseySvgProps) {
  const uid = useId()

  const { primaryColor: pc, secondaryColor: sc } = normalizeJerseyConfig({
    primaryColor,
    secondaryColor,
    jerseyPattern,
  })

  // Per-instance SVG def IDs — prevents collisions when multiple jerseys render
  const dropId   = `${uid}-drop`
  const shineId  = `${uid}-sh`
  const sideId   = `${uid}-side`
  const shadowId = `${uid}-sd`
  const stripeId = `${uid}-str`
  const leftId   = `${uid}-l`
  const rightId  = `${uid}-r`
  const gradId   = `${uid}-g`

  const dropFilter = `url(#${dropId})`

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
        {/* ── Drop shadow — floating product-mockup feel ── */}
        <filter id={dropId} x="-10%" y="-6%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="rgba(0,0,0,0.42)" />
        </filter>

        {/* ── Radial chest shine — top-centre light source ── */}
        <radialGradient id={shineId} cx="50%" cy="14%" r="65%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.34)" />
          <stop offset="55%"  stopColor="rgba(255,255,255,0.08)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)"    />
        </radialGradient>

        {/* ── Side vignette — left/right darkening for 3D curvature ── */}
        <linearGradient id={sideId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="rgba(0,0,0,0.28)" />
          <stop offset="20%"  stopColor="rgba(0,0,0,0)"    />
          <stop offset="80%"  stopColor="rgba(0,0,0,0)"    />
          <stop offset="100%" stopColor="rgba(0,0,0,0.28)" />
        </linearGradient>

        {/* ── Hem shadow — grounds the jersey, darker for small-size visibility ── */}
        <linearGradient id={shadowId} x1="0%" y1="55%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="rgba(0,0,0,0)"    />
          <stop offset="100%" stopColor="rgba(0,0,0,0.40)" />
        </linearGradient>
      </defs>

      {/* ── 1. Body fill with drop shadow ──────────────────────────────── */}
      {jerseyPattern === 'solid'    && <SolidFill    primary={pc} filter={dropFilter} />}
      {jerseyPattern === 'stripes'  && <StripeFill   primary={pc} secondary={sc} id={stripeId} filter={dropFilter} />}
      {jerseyPattern === 'split'    && <SplitFill    primary={pc} secondary={sc} leftId={leftId} rightId={rightId} filter={dropFilter} />}
      {jerseyPattern === 'gradient' && <GradientFill primary={pc} secondary={sc} id={gradId} filter={dropFilter} />}

      {/* ── 2. Shoulder / sleeve yokes — secondary colour ──────────────── */}
      <path d={LEFT_PANEL}  fill={sc} />
      <path d={RIGHT_PANEL} fill={sc} />

      {/* ── 3. Collar band — secondary, thin V strip ───────────────────── */}
      <path d={COLLAR_BAND} fill={sc} />

      {/* ── 4. Chest shine overlay ─────────────────────────────────────── */}
      <path d={JERSEY_PATH} fill={`url(#${shineId})`} />

      {/* ── 5. Side vignette — curvature depth ─────────────────────────── */}
      <path d={JERSEY_PATH} fill={`url(#${sideId})`} />

      {/* ── 6. Hem shadow ──────────────────────────────────────────────── */}
      <path d={JERSEY_PATH} fill={`url(#${shadowId})`} />

      {/* ── 7. Jersey outline ──────────────────────────────────────────── */}
      <path d={JERSEY_PATH} fill="none" stroke="rgba(0,0,0,0.30)" strokeWidth="0.7" />

      {/* ── 8. Panel seam lines ────────────────────────────────────────── */}
      <line x1="28" y1="22" x2="17" y2="43" stroke="rgba(0,0,0,0.20)" strokeWidth="0.6" strokeLinecap="round" />
      <line x1="72" y1="22" x2="83" y2="43" stroke="rgba(0,0,0,0.20)" strokeWidth="0.6" strokeLinecap="round" />

      {/* ── 9. Sleeve cuff edges ───────────────────────────────────────── */}
      <line x1="3"  y1="40" x2="17" y2="43" stroke="rgba(0,0,0,0.25)" strokeWidth="0.7" strokeLinecap="round" />
      <line x1="97" y1="40" x2="83" y2="43" stroke="rgba(0,0,0,0.25)" strokeWidth="0.7" strokeLinecap="round" />

      {/* ── 10. V-neck outer edge + inner collar highlight ─────────────── */}
      <path d={V_NECK} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={V_NECK} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* ── 11. GAFFER sponsor plate ───────────────────────────────────── */}
      {/*
        Sponsor backdrop: a subtle pill/rect centred on the chest.
        At width=68 this rect is 60*(68/100)=40.8px wide — big enough to read.
        The translucent dark fill ensures the text contrasts against any kit colour.
      */}
      <rect
        x="20" y="57" width="60" height="21"
        rx="3.5"
        fill="rgba(0,0,0,0.14)"
      />
      {/* Drop shadow behind the text for depth */}
      <text
        x="50.6" y="68.6"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="rgba(0,0,0,0.38)"
        fontSize="18"
        fontWeight="900"
        fontFamily="system-ui, 'Arial Black', Arial, sans-serif"
        textLength="54"
        lengthAdjust="spacing"
        style={{ userSelect: 'none', pointerEvents: 'none' }}
        aria-hidden="true"
      >
        {brandingText}
      </text>
      {/* Main sponsor text */}
      <text
        x="50" y="68"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={sc}
        fontSize="18"
        fontWeight="900"
        fontFamily="system-ui, 'Arial Black', Arial, sans-serif"
        textLength="54"
        lengthAdjust="spacing"
        style={{ userSelect: 'none' }}
      >
        {brandingText}
      </text>
      {/* Top-edge highlight on text for embossed kit-print look */}
      <text
        x="50" y="67.4"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="rgba(255,255,255,0.22)"
        fontSize="18"
        fontWeight="900"
        fontFamily="system-ui, 'Arial Black', Arial, sans-serif"
        textLength="54"
        lengthAdjust="spacing"
        style={{ userSelect: 'none', pointerEvents: 'none' }}
        aria-hidden="true"
      >
        {brandingText}
      </text>
    </svg>
  )
}

export default JerseySvg
export type { JerseyPattern }
