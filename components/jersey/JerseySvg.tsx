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

// ─── SVG anatomy  (viewBox "0 0 120 130") ────────────────────────────────────
//
//  Mockup-style football jersey.
//  The body tapers very slightly inward at the waist, and the hem curves
//  gently so the jersey looks like a real garment, not a flat icon.
//
//         44,6 ────── 60,32 ────── 76,6        ← V-neck opening
//        /   \                  /   \
//   Q24,2  48,8              72,8  Q96,2        ← collar band edges
//      |                              |
//   12,16                          108,16       ← shoulder tips
//      |                              |
//    4,30                           116,30      ← sleeve outer
//  Q2,42                           Q118,42
//    4,48 ──────────────────── 116,48          ← sleeve cuff
//      |                              |
//   20,52 ──────────────────── 100,52          ← underarm seam
//      |                              |
//   22,122 ── Q60,128 ── 98,122                ← curved hem  (slight taper)
//
// ─────────────────────────────────────────────────────────────────────────────

/** Full jersey silhouette — V-neck, tapered body, curved hem */
const JERSEY_PATH =
  'M44,6 L60,32 L76,6 Q96,2 108,16 L116,30 Q118,42 116,48 L100,52 L98,122 Q60,128 22,122 L20,52 L4,48 Q2,42 4,30 L12,16 Q24,2 44,6Z'

/** Left shoulder + sleeve yoke — secondary colour */
const LEFT_PANEL =
  'M44,6 Q24,2 12,16 L4,30 Q2,42 4,48 L20,52 L34,26 Z'

/** Right shoulder + sleeve yoke — secondary colour, mirrored */
const RIGHT_PANEL =
  'M76,6 Q96,2 108,16 L116,30 Q118,42 116,48 L100,52 L86,26 Z'

/**
 * Collar band — thin filled strip along both sides of the V-neck.
 * Uses the secondary colour so collar matches the shoulder yokes,
 * exactly as on a real product mockup.
 */
const COLLAR_BAND =
  'M44,6 L60,32 L76,6 L72,9 L60,28 L48,9 Z'

/** V-neck path — reused for stroke layers only */
const V_NECK = 'M44,6 L60,32 L76,6'

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
        <pattern id={id} x="0" y="0" width="12" height="130" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="6"  height="130" fill={primary}   />
          <rect x="6" y="0" width="6"  height="130" fill={secondary} />
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
        <clipPath id={leftId} ><rect x="0"  y="0" width="60"  height="130" /></clipPath>
        <clipPath id={rightId}><rect x="60" y="0" width="60"  height="130" /></clipPath>
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
  teamCode,
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

  // Per-instance SVG def IDs
  const dropId    = `${uid}-drop`
  const shineId   = `${uid}-sh`
  const sideId    = `${uid}-side`
  const shadowId  = `${uid}-sd`
  const stripeId  = `${uid}-str`
  const leftId    = `${uid}-l`
  const rightId   = `${uid}-r`
  const gradId    = `${uid}-g`

  const dropFilter = `url(#${dropId})`

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 120 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <defs>
        {/* ── Drop shadow — gives the jersey a "floating" mockup look ── */}
        <filter id={dropId} x="-8%" y="-5%" width="116%" height="118%">
          <feDropShadow
            dx="0"
            dy="3"
            stdDeviation="3.5"
            floodColor="rgba(0,0,0,0.40)"
          />
        </filter>

        {/* ── Radial shine — top-centre light source ── */}
        <radialGradient id={shineId} cx="50%" cy="16%" r="62%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.26)" />
          <stop offset="60%"  stopColor="rgba(255,255,255,0.06)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)"    />
        </radialGradient>

        {/* ── Side vignette — subtle left/right darkening adds curvature ── */}
        <linearGradient id={sideId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="rgba(0,0,0,0.18)" />
          <stop offset="18%"  stopColor="rgba(0,0,0,0)"    />
          <stop offset="82%"  stopColor="rgba(0,0,0,0)"    />
          <stop offset="100%" stopColor="rgba(0,0,0,0.18)" />
        </linearGradient>

        {/* ── Hem shadow — grounds the jersey at the bottom ── */}
        <linearGradient id={shadowId} x1="0%" y1="58%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="rgba(0,0,0,0)"    />
          <stop offset="100%" stopColor="rgba(0,0,0,0.32)" />
        </linearGradient>
      </defs>

      {/* ── 1. Body fill with drop shadow ───────────────────────────────── */}
      {jerseyPattern === 'solid'    && <SolidFill    primary={pc} filter={dropFilter} />}
      {jerseyPattern === 'stripes'  && <StripeFill   primary={pc} secondary={sc} id={stripeId} filter={dropFilter} />}
      {jerseyPattern === 'split'    && <SplitFill    primary={pc} secondary={sc} leftId={leftId} rightId={rightId} filter={dropFilter} />}
      {jerseyPattern === 'gradient' && <GradientFill primary={pc} secondary={sc} id={gradId} filter={dropFilter} />}

      {/* ── 2. Shoulder / sleeve yokes — always secondary ───────────────── */}
      <path d={LEFT_PANEL}  fill={sc} />
      <path d={RIGHT_PANEL} fill={sc} />

      {/* ── 3. Collar band — secondary colour, thin V strip ─────────────── */}
      <path d={COLLAR_BAND} fill={sc} />

      {/* ── 4. Shine overlay — fabric highlight ─────────────────────────── */}
      <path d={JERSEY_PATH} fill={`url(#${shineId})`} />

      {/* ── 5. Side vignette — curvature depth ──────────────────────────── */}
      <path d={JERSEY_PATH} fill={`url(#${sideId})`} />

      {/* ── 6. Hem shadow ─────────────────────────────────────────────────── */}
      <path d={JERSEY_PATH} fill={`url(#${shadowId})`} />

      {/* ── 7. Jersey outline stroke ─────────────────────────────────────── */}
      <path
        d={JERSEY_PATH}
        fill="none"
        stroke="rgba(0,0,0,0.28)"
        strokeWidth="0.8"
      />

      {/* ── 8. Panel seam lines (shoulder yoke edges) ────────────────────── */}
      {/* Left diagonal seam */}
      <line x1="34" y1="26" x2="20" y2="52"
        stroke="rgba(0,0,0,0.18)" strokeWidth="0.7" strokeLinecap="round" />
      {/* Right diagonal seam */}
      <line x1="86" y1="26" x2="100" y2="52"
        stroke="rgba(0,0,0,0.18)" strokeWidth="0.7" strokeLinecap="round" />

      {/* ── 9. Sleeve cuff edge lines ─────────────────────────────────────── */}
      <line x1="4"   y1="48" x2="20"  y2="52"
        stroke="rgba(0,0,0,0.22)" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="116" y1="48" x2="100" y2="52"
        stroke="rgba(0,0,0,0.22)" strokeWidth="0.8" strokeLinecap="round" />

      {/* ── 10. V-neck outer edge ─────────────────────────────────────────── */}
      <path
        d={V_NECK}
        fill="none"
        stroke="rgba(0,0,0,0.40)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner collar highlight */}
      <path
        d={V_NECK}
        fill="none"
        stroke="rgba(255,255,255,0.16)"
        strokeWidth="0.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── 11. GAFFER chest branding ─────────────────────────────────────── */}
      <text
        x="60"
        y="82"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={sc}
        fontSize="14"
        fontWeight="900"
        fontStyle="italic"
        fontFamily="system-ui, 'Arial Black', Arial, sans-serif"
        letterSpacing="0.8"
        style={{ userSelect: 'none' }}
      >
        {brandingText}
      </text>
      {/* Subtle text shadow for depth */}
      <text
        x="60.5"
        y="82.5"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="rgba(0,0,0,0.30)"
        fontSize="14"
        fontWeight="900"
        fontStyle="italic"
        fontFamily="system-ui, 'Arial Black', Arial, sans-serif"
        letterSpacing="0.8"
        style={{ userSelect: 'none', pointerEvents: 'none' }}
        aria-hidden="true"
      >
        {brandingText}
      </text>
      <text
        x="60"
        y="82"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={sc}
        fontSize="14"
        fontWeight="900"
        fontStyle="italic"
        fontFamily="system-ui, 'Arial Black', Arial, sans-serif"
        letterSpacing="0.8"
        style={{ userSelect: 'none' }}
        aria-hidden="true"
      >
        {brandingText}
      </text>

      {/* ── 12. Optional team code ────────────────────────────────────────── */}
      {teamCode && (
        <text
          x="60"
          y="98"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={sc}
          fontSize="9"
          fontWeight="700"
          fontFamily="system-ui, Arial, sans-serif"
          opacity="0.70"
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
