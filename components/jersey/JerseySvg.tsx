import { useId } from 'react'
import { normalizeHex, getContrastColor } from './jerseyUtils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JerseySvgProps {
  primaryColor: string
  secondaryColor?: string   // sleeves + collar; defaults to primaryColor (monochrome)
  text?: string             // chest label; defaults to 'GAFFER'
  textColor?: string        // auto-derived from contrast if omitted
  size?: number             // scales proportionally (width = size, height = size × 1.08)
  // Backward-compat props — accepted but ignored in rendering
  jerseyPattern?: string
  teamCode?: string
  width?: number
  height?: number
  brandingText?: string     // fallback for text
  className?: string
}

// ─── SVG coordinate space: viewBox "0 0 100 108" ─────────────────────────────
//
//   V-neck at top centre, sleeve panels on each side, curved hem at bottom.
//
//      37,5 ──── 50,27 ──── 63,5             ← V-neck opening
//     /    Q20,2          Q80,2    \
//   10,13                         90,13       ← shoulder tips
//     |                              |
//    3,25  Q2,35         Q98,35  97,25        ← sleeve outer edge
//    3,40 ─────────────────────── 97,40       ← sleeve cuff
//   17,43 ─────────────────────── 83,43       ← underarm seam
//     |                              |
//   18,101 ──── Q50,106 ──── 82,101           ← curved hem
//
// ─────────────────────────────────────────────────────────────────────────────

const JERSEY_PATH =
  'M37,5 L50,27 L63,5 Q80,2 90,13 L97,25 Q98,35 97,40 L83,43 L82,101 Q50,106 18,101 L17,43 L3,40 Q2,35 3,25 L10,13 Q20,2 37,5Z'

// Shoulder sleeve panels — filled with secondaryColor
const LEFT_PANEL  = 'M37,5 Q20,2 10,13 L3,25 Q2,35 3,40 L17,43 L28,22Z'
const RIGHT_PANEL = 'M63,5 Q80,2 90,13 L97,25 Q98,35 97,40 L83,43 L72,22Z'

// V-neck collar band — filled with secondaryColor
const COLLAR_BAND = 'M37,5 L50,27 L63,5 L60,7.5 L50,23 L40,7.5Z'

// V-neck inner edge — outline only
const V_NECK = 'M37,5 L50,27 L63,5'

// ─── Text scaling ─────────────────────────────────────────────────────────────
//
// Fixed fontSize=18, textLength capped at 58 SVG units. SVG's native
// lengthAdjust="spacingAndGlyphs" compresses or expands glyphs to always fit.
//
const MAX_TEXT_WIDTH = 58

function computeTextLength(text: string): number {
  return Math.min(text.length * 9, MAX_TEXT_WIDTH)
}

// ─── JerseySvg ────────────────────────────────────────────────────────────────

export function JerseySvg({
  primaryColor,
  secondaryColor,
  text,
  textColor,
  size = 64,
  width,
  height,
  brandingText,
  className,
  // ignored: jerseyPattern, teamCode
}: JerseySvgProps) {
  const uid = useId()

  // Normalise colors at the render boundary
  const pc = normalizeHex(primaryColor)
  const sc = normalizeHex(secondaryColor ?? primaryColor, pc)

  // Chest label: text > brandingText > 'GAFFER'
  const label = text ?? brandingText ?? 'GAFFER'

  // Text color: explicit > WCAG contrast auto-pick
  const tc = textColor ?? getContrastColor(pc)

  // Sizing
  const svgWidth  = width  ?? size
  const svgHeight = height ?? Math.round(size * 1.08)

  const textLen = computeTextLength(label)

  // Unique gradient / filter IDs (avoids collisions when multiple jerseys render)
  const dropId  = `${uid}-drop`
  const shineId = `${uid}-sh`
  const sideId  = `${uid}-side`
  const hemId   = `${uid}-hem`

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox="0 0 100 108"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <defs>
        {/* Floating drop shadow — lifts the jersey off the background */}
        <filter id={dropId} x="-10%" y="-6%" width="120%" height="120%">
          <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="rgba(0,0,0,0.45)" />
        </filter>

        {/* Radial chest shine — top-centre light source, creates convex illusion */}
        <radialGradient id={shineId} cx="50%" cy="12%" r="65%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.38)" />
          <stop offset="50%"  stopColor="rgba(255,255,255,0.08)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)"    />
        </radialGradient>

        {/* Side vignette — left/right edge darkening simulates fabric wrapping away */}
        <linearGradient id={sideId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="rgba(0,0,0,0.28)" />
          <stop offset="18%"  stopColor="rgba(0,0,0,0)"    />
          <stop offset="82%"  stopColor="rgba(0,0,0,0)"    />
          <stop offset="100%" stopColor="rgba(0,0,0,0.28)" />
        </linearGradient>

        {/* Hem shadow — grounds the jersey, adds bottom depth */}
        <linearGradient id={hemId} x1="0%" y1="55%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="rgba(0,0,0,0)"    />
          <stop offset="100%" stopColor="rgba(0,0,0,0.38)" />
        </linearGradient>
      </defs>

      {/* ═══ LAYER 1 — Jersey body (drop shadow applied here) ═══════════════ */}
      <path d={JERSEY_PATH} fill={pc} filter={`url(#${dropId})`} />

      {/* ═══ LAYER 2 — Sleeve panels + collar band ══════════════════════════ */}
      <path d={LEFT_PANEL}  fill={sc} />
      <path d={RIGHT_PANEL} fill={sc} />
      <path d={COLLAR_BAND} fill={sc} />

      {/* ═══ LAYER 3 — 3D shading overlays (transparent, color-agnostic) ════
          Applied over the solid fill — these are what create the illusion of
          a real shirt with volume. They work on any primaryColor/secondaryColor.
      */}
      {/* Radial highlight: chest centre catches the light */}
      <path d={JERSEY_PATH} fill={`url(#${shineId})`} />
      {/* Side vignette: edges curve away from viewer */}
      <path d={JERSEY_PATH} fill={`url(#${sideId})`}  />
      {/* Hem shadow: bottom of garment falls into shadow */}
      <path d={JERSEY_PATH} fill={`url(#${hemId})`}   />

      {/* ═══ LAYER 4 — Outline + seam lines ════════════════════════════════ */}
      <path
        d={JERSEY_PATH}
        fill="none"
        stroke="rgba(0,0,0,0.22)"
        strokeWidth="0.6"
      />
      <line x1="28" y1="22" x2="17" y2="43" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" strokeLinecap="round" />
      <line x1="72" y1="22" x2="83" y2="43" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" strokeLinecap="round" />
      <line x1="3"  y1="40" x2="17" y2="43" stroke="rgba(0,0,0,0.18)" strokeWidth="0.55" strokeLinecap="round" />
      <line x1="97" y1="40" x2="83" y2="43" stroke="rgba(0,0,0,0.18)" strokeWidth="0.55" strokeLinecap="round" />
      <path d={V_NECK} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />

      {/* ═══ LAYER 5 — Chest text ════════════════════════════════════════════
          Shadow pass first gives the print an embossed/heat-transfer look.
      */}
      <text
        x="50.4" y="72.5"
        textAnchor="middle" dominantBaseline="middle"
        fontSize="18" fontWeight="900"
        textLength={textLen} lengthAdjust="spacingAndGlyphs"
        fontFamily="system-ui, 'Arial Black', Arial, sans-serif"
        fill="rgba(0,0,0,0.30)"
        aria-hidden="true"
        style={{ userSelect: 'none', pointerEvents: 'none' }}
      >{label}</text>
      <text
        x="50" y="72"
        textAnchor="middle" dominantBaseline="middle"
        fontSize="18" fontWeight="900"
        textLength={textLen} lengthAdjust="spacingAndGlyphs"
        fontFamily="system-ui, 'Arial Black', Arial, sans-serif"
        fill={tc}
        style={{ userSelect: 'none' }}
      >{label}</text>
    </svg>
  )
}

export default JerseySvg
export type { JerseySvgProps as JerseyProps }
