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

// ─── SVG anatomy  (viewBox "0 0 100 108") ─────────────────────────────────────
//
//  Football jersey mockup styled after the GAFFER reference kit:
//    • V-neck collar with collar band in secondary colour
//    • Shoulder panels in secondary colour
//    • 3 diagonal shoulder stripes per side (like Adidas) clipped to the panel
//    • "THE" small label above bold "GAFFER" with orange→red gradient
//    • Full 3-layer shading: radial shine, side vignette, hem shadow
//    • feDropShadow for floating product-mockup feel
//
//      37,5 ──────── 50,27 ──────── 63,5         ← V-neck
//     /    Q20,2              Q80,2    \
//   10,13                           90,13         ← shoulder tips
//     |                                |
//    3,25  Q2,35           Q98,35  97,25           ← sleeve outer
//    3,40 ───────────────────────── 97,40          ← sleeve cuff
//   17,43 ───────────────────────── 83,43          ← underarm
//     |                                |
//   18,101 ────── Q50,106 ─────── 82,101           ← hem
//
// ──────────────────────────────────────────────────────────────────────────────

const JERSEY_PATH =
  'M37,5 L50,27 L63,5 Q80,2 90,13 L97,25 Q98,35 97,40 L83,43 L82,101 Q50,106 18,101 L17,43 L3,40 Q2,35 3,25 L10,13 Q20,2 37,5Z'

const LEFT_PANEL =
  'M37,5 Q20,2 10,13 L3,25 Q2,35 3,40 L17,43 L28,22Z'

const RIGHT_PANEL =
  'M63,5 Q80,2 90,13 L97,25 Q98,35 97,40 L83,43 L72,22Z'

const COLLAR_BAND =
  'M37,5 L50,27 L63,5 L60,7.5 L50,23 L40,7.5Z'

const V_NECK = 'M37,5 L50,27 L63,5'

// ─── Pattern fill helpers ─────────────────────────────────────────────────────

function SolidFill({ primary, filter }: { primary: string; filter?: string }) {
  return <path d={JERSEY_PATH} fill={primary} filter={filter} />
}

function StripeFill({ primary, secondary, id, filter }: {
  primary: string; secondary: string; id: string; filter?: string
}) {
  return (
    <>
      <defs>
        <pattern id={id} x="0" y="0" width="10" height="108" patternUnits="userSpaceOnUse">
          <rect x="0" width="5"  height="108" fill={primary}   />
          <rect x="5" width="5"  height="108" fill={secondary} />
        </pattern>
      </defs>
      <path d={JERSEY_PATH} fill={`url(#${id})`} filter={filter} />
    </>
  )
}

function SplitFill({ primary, secondary, leftId, rightId, filter }: {
  primary: string; secondary: string; leftId: string; rightId: string; filter?: string
}) {
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

function GradientFill({ primary, secondary, id, filter }: {
  primary: string; secondary: string; id: string; filter?: string
}) {
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
  width = 64,
  height = 72,
  brandingText = 'GAFFER',
  className,
}: JerseySvgProps) {
  const uid = useId()

  const { primaryColor: pc, secondaryColor: sc } = normalizeJerseyConfig({
    primaryColor,
    secondaryColor,
    jerseyPattern,
  })

  // ── Unique def IDs ──────────────────────────────────────────────────────────
  const dropId      = `${uid}-drop`
  const shineId     = `${uid}-sh`
  const sideId      = `${uid}-side`
  const shadowId    = `${uid}-sd`
  const stripeId    = `${uid}-str`
  const leftId      = `${uid}-l`
  const rightId     = `${uid}-r`
  const gradId      = `${uid}-g`
  const gafferGradId = `${uid}-gg`   // orange→red text gradient
  const lClipId     = `${uid}-lclip` // clip for left shoulder stripes
  const rClipId     = `${uid}-rclip` // clip for right shoulder stripes

  const dropFilter  = `url(#${dropId})`

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
        {/* ── Floating drop shadow ── */}
        <filter id={dropId} x="-10%" y="-6%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="rgba(0,0,0,0.45)" />
        </filter>

        {/* ── Radial chest shine (top-centre light source) ── */}
        <radialGradient id={shineId} cx="50%" cy="13%" r="66%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.38)" />
          <stop offset="52%"  stopColor="rgba(255,255,255,0.07)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)"    />
        </radialGradient>

        {/* ── Side vignette (left/right edge darkening for curvature) ── */}
        <linearGradient id={sideId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="rgba(0,0,0,0.30)" />
          <stop offset="18%"  stopColor="rgba(0,0,0,0)"    />
          <stop offset="82%"  stopColor="rgba(0,0,0,0)"    />
          <stop offset="100%" stopColor="rgba(0,0,0,0.30)" />
        </linearGradient>

        {/* ── Hem shadow (grounds the jersey) ── */}
        <linearGradient id={shadowId} x1="0%" y1="52%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="rgba(0,0,0,0)"    />
          <stop offset="100%" stopColor="rgba(0,0,0,0.42)" />
        </linearGradient>

        {/* ── GAFFER text gradient — orange to red (brand identity) ── */}
        {/*
          gradientUnits="userSpaceOnUse" with x1/x2 spanning the text bounds:
          GAFFER text is centered at x=50, textLength=52 → x: 24 to 76
        */}
        <linearGradient id={gafferGradId} gradientUnits="userSpaceOnUse"
          x1="24" y1="71" x2="76" y2="71">
          <stop offset="0%"   stopColor="#FF6B00" />
          <stop offset="100%" stopColor="#CC1A1A" />
        </linearGradient>

        {/* ── Clip paths for shoulder stripes (constrain within panels) ── */}
        <clipPath id={lClipId}><path d={LEFT_PANEL}  /></clipPath>
        <clipPath id={rClipId}><path d={RIGHT_PANEL} /></clipPath>
      </defs>

      {/* ═══ LAYER 1 — Body fill ════════════════════════════════════════════ */}
      {jerseyPattern === 'solid'    && <SolidFill    primary={pc} filter={dropFilter} />}
      {jerseyPattern === 'stripes'  && <StripeFill   primary={pc} secondary={sc} id={stripeId} filter={dropFilter} />}
      {jerseyPattern === 'split'    && <SplitFill    primary={pc} secondary={sc} leftId={leftId} rightId={rightId} filter={dropFilter} />}
      {jerseyPattern === 'gradient' && <GradientFill primary={pc} secondary={sc} id={gradId} filter={dropFilter} />}

      {/* ═══ LAYER 2 — Shoulder panels ══════════════════════════════════════ */}
      <path d={LEFT_PANEL}  fill={sc} />
      <path d={RIGHT_PANEL} fill={sc} />

      {/* ═══ LAYER 3 — Shoulder stripes (clipped to panel, reference style) ═
          3 thin diagonal parallelograms per shoulder.
          Direction: parallel to the panel inner edge (collar→underarm seam).
          They sit offset toward the sleeve outer edge.
          Colour: slightly darkened version of sc so they read clearly.        */}

      {/* Left shoulder — 3 stripes running from upper-right → lower-left */}
      <g clipPath={`url(#${lClipId})`}>
        {/* Stripe 1 — innermost (nearest collar) */}
        <polygon
          points="32,4 35,4 25,27 22,27"
          fill="rgba(0,0,0,0.22)"
        />
        {/* Stripe 2 */}
        <polygon
          points="25,4 28,4 18,27 15,27"
          fill="rgba(0,0,0,0.22)"
        />
        {/* Stripe 3 — outermost */}
        <polygon
          points="18,6 21,6 11,29 8,29"
          fill="rgba(0,0,0,0.22)"
        />
      </g>

      {/* Right shoulder — mirror */}
      <g clipPath={`url(#${rClipId})`}>
        {/* Stripe 1 — innermost */}
        <polygon
          points="68,4 65,4 75,27 78,27"
          fill="rgba(0,0,0,0.22)"
        />
        {/* Stripe 2 */}
        <polygon
          points="75,4 72,4 82,27 85,27"
          fill="rgba(0,0,0,0.22)"
        />
        {/* Stripe 3 — outermost */}
        <polygon
          points="82,6 79,6 89,29 92,29"
          fill="rgba(0,0,0,0.22)"
        />
      </g>

      {/* ═══ LAYER 4 — Collar band ════════════════════════════════════════════ */}
      <path d={COLLAR_BAND} fill={sc} />

      {/* ═══ LAYER 5 — Shading overlays ══════════════════════════════════════ */}
      {/* Radial chest shine */}
      <path d={JERSEY_PATH} fill={`url(#${shineId})`} />
      {/* Side vignette */}
      <path d={JERSEY_PATH} fill={`url(#${sideId})`}  />
      {/* Hem shadow */}
      <path d={JERSEY_PATH} fill={`url(#${shadowId})`} />

      {/* ═══ LAYER 6 — Outline & seam lines ══════════════════════════════════ */}
      {/* Jersey perimeter */}
      <path d={JERSEY_PATH} fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth="0.65" />
      {/* Panel seam (shoulder yoke → underarm) */}
      <line x1="28" y1="22" x2="17" y2="43" stroke="rgba(0,0,0,0.18)" strokeWidth="0.55" strokeLinecap="round" />
      <line x1="72" y1="22" x2="83" y2="43" stroke="rgba(0,0,0,0.18)" strokeWidth="0.55" strokeLinecap="round" />
      {/* Sleeve cuff edges */}
      <line x1="3"  y1="40" x2="17" y2="43" stroke="rgba(0,0,0,0.22)" strokeWidth="0.65" strokeLinecap="round" />
      <line x1="97" y1="40" x2="83" y2="43" stroke="rgba(0,0,0,0.22)" strokeWidth="0.65" strokeLinecap="round" />
      {/* V-neck edge + inner highlight */}
      <path d={V_NECK} fill="none" stroke="rgba(0,0,0,0.42)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d={V_NECK} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="0.45" strokeLinecap="round" strokeLinejoin="round" />

      {/* ═══ LAYER 7 — THE GAFFER chest branding ═════════════════════════════
          Matches the reference: small "THE" label above bold "GAFFER" gradient.

          Scale at width=64 (viewBox 100 wide):
            scale = 64/100 = 0.64
            "GAFFER" fontSize=19, textLength=52 → 33.3 px on screen ✓
            "THE"    fontSize=6.5             →  4.2 px on screen (subtle) ✓
      */}

      {/* Shadow pass — depth behind both lines */}
      <text x="25.4" y="62.4" fontSize="6.5" fontWeight="700"
        fontFamily="system-ui, 'Arial Black', Arial, sans-serif"
        fill="rgba(0,0,0,0.35)" style={{ userSelect: 'none', pointerEvents: 'none' }}
        aria-hidden="true">THE</text>
      <text x="50.5" y="71.5" textAnchor="middle" dominantBaseline="middle"
        fontSize="19" fontWeight="900" textLength="52" lengthAdjust="spacing"
        fontFamily="system-ui, 'Arial Black', Arial, sans-serif"
        fill="rgba(0,0,0,0.35)" style={{ userSelect: 'none', pointerEvents: 'none' }}
        aria-hidden="true">{brandingText}</text>

      {/* "THE" — small label above the G, secondary colour */}
      <text x="25" y="62" fontSize="6.5" fontWeight="700"
        fontFamily="system-ui, 'Arial Black', Arial, sans-serif"
        fill={sc} style={{ userSelect: 'none' }}>THE</text>

      {/* "GAFFER" — large, orange→red gradient */}
      <text x="50" y="71" textAnchor="middle" dominantBaseline="middle"
        fontSize="19" fontWeight="900" textLength="52" lengthAdjust="spacing"
        fontFamily="system-ui, 'Arial Black', Arial, sans-serif"
        fill={`url(#${gafferGradId})`}
        style={{ userSelect: 'none' }}>{brandingText}</text>

      {/* Top-edge highlight for embossed/heat-transfer print look */}
      <text x="50" y="70.4" textAnchor="middle" dominantBaseline="middle"
        fontSize="19" fontWeight="900" textLength="52" lengthAdjust="spacing"
        fontFamily="system-ui, 'Arial Black', Arial, sans-serif"
        fill="rgba(255,255,255,0.18)" style={{ userSelect: 'none', pointerEvents: 'none' }}
        aria-hidden="true">{brandingText}</text>
    </svg>
  )
}

export default JerseySvg
export type { JerseyPattern }
