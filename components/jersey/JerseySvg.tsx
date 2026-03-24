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
// Strategy: fixed fontSize=18, textLength capped at 58 SVG units (jersey chest
// width minus margins). lengthAdjust="spacingAndGlyphs" lets SVG compress or
// expand glyphs natively to always fit within the given textLength bound.
//
// For short text (≤4 chars) we reduce textLength so the text isn't stretched
// unnaturally wide. For longer text it compresses to fit.
//
const MAX_TEXT_WIDTH = 58  // SVG units — jersey chest is ~64 units wide

function computeTextLength(text: string): number {
  // Natural width estimate: ~9 SVG units per character at fontSize=18
  const natural = text.length * 9
  return Math.min(natural, MAX_TEXT_WIDTH)
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
  const sc = normalizeHex(secondaryColor ?? primaryColor, pc)  // monochrome if omitted

  // Chest label: text > brandingText > 'GAFFER'
  const label = text ?? brandingText ?? 'GAFFER'

  // Text color: explicit > WCAG contrast auto-pick
  const tc = textColor ?? getContrastColor(pc)

  // Sizing: size prop sets width; height preserves 100:108 aspect ratio
  const svgWidth  = width  ?? size
  const svgHeight = height ?? Math.round(size * 1.08)

  const textLen = computeTextLength(label)

  // Unique IDs for clip paths (shoulder seam lines need none, but kept for safety)
  const lSeamId = `${uid}-ls`
  const rSeamId = `${uid}-rs`

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
      {/* ═══ LAYER 1 — Jersey body ══════════════════════════════════════════ */}
      <path d={JERSEY_PATH} fill={pc} />

      {/* ═══ LAYER 2 — Sleeve panels + collar band ══════════════════════════ */}
      <path d={LEFT_PANEL}  fill={sc} />
      <path d={RIGHT_PANEL} fill={sc} />
      <path d={COLLAR_BAND} fill={sc} />

      {/* ═══ LAYER 3 — Outline + seam lines ════════════════════════════════ */}
      {/* Jersey perimeter */}
      <path
        d={JERSEY_PATH}
        fill="none"
        stroke="rgba(0,0,0,0.22)"
        strokeWidth="0.6"
      />
      {/* Shoulder yoke seams */}
      <line
        id={lSeamId}
        x1="28" y1="22" x2="17" y2="43"
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="0.5"
        strokeLinecap="round"
      />
      <line
        id={rSeamId}
        x1="72" y1="22" x2="83" y2="43"
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="0.5"
        strokeLinecap="round"
      />
      {/* Sleeve cuff edges */}
      <line
        x1="3"  y1="40" x2="17" y2="43"
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="0.55"
        strokeLinecap="round"
      />
      <line
        x1="97" y1="40" x2="83" y2="43"
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="0.55"
        strokeLinecap="round"
      />
      {/* V-neck edge */}
      <path
        d={V_NECK}
        fill="none"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ═══ LAYER 4 — Chest text ════════════════════════════════════════════
          textLength + lengthAdjust="spacingAndGlyphs" handles all scaling
          natively: short labels stay proportional, long labels compress to fit.
      */}
      <text
        x="50"
        y="72"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="18"
        fontWeight="900"
        textLength={textLen}
        lengthAdjust="spacingAndGlyphs"
        fontFamily="system-ui, 'Arial Black', Arial, sans-serif"
        fill={tc}
        style={{ userSelect: 'none' }}
      >
        {label}
      </text>
    </svg>
  )
}

export default JerseySvg
export type { JerseySvgProps as JerseyProps }
