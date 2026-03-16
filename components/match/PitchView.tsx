'use client'

/**
 * PitchView.tsx
 *
 * A broadcast-style top-down football pitch rendered with SVG field markings
 * laid over CSS grass stripes.  All dimension constants are derived from
 * real FIFA pitch ratios (68 m × 105 m) scaled into a 300 × 430 viewBox so
 * that every marking can be easily tweaked in one place.
 *
 * Layer order (back → front):
 *  1. Alternating grass stripes   (SVG <rect> fill)
 *  2. Field line markings         (SVG <rect>/<line>/<circle>/<path>)
 *  3. Penalty / center spots      (filled white circles)
 *  4. Player marker slots         (prop-driven <g> elements)
 */

import React from 'react'

// ─── Pitch constants ──────────────────────────────────────────────────────────
//
// All values are in SVG user units (the viewBox coordinate space).
// Change VB_W / VB_H to resize the whole pitch proportionally.

/** Total viewBox width */
const VB_W = 300
/** Total viewBox height */
const VB_H = 430

/** Outer margin — distance from viewBox edge to pitch boundary */
const M = 7

// Derived pitch boundary coords
const P_LEFT   = M              // 7
const P_TOP    = M              // 7
const P_RIGHT  = VB_W - M      // 293
const P_BOTTOM = VB_H - M      // 423
const P_W      = P_RIGHT  - P_LEFT   // 286 — pitch width
const P_H      = P_BOTTOM - P_TOP    // 416 — pitch height

/** Horizontal centre of the pitch */
const CX = VB_W / 2   // 150
/** Vertical centre — the halfway line */
const CY = VB_H / 2   // 215

// ─── Centre circle ────────────────────────────────────────────────────────────
// Real: 9.15 m radius on a 68 m-wide pitch → 9.15/68 × 286 ≈ 38 px
const CC_R = 40

// ─── Penalty areas ────────────────────────────────────────────────────────────
// Real: 40.32 m wide × 16.5 m deep
//   Width  : 40.32/68  × 286 ≈ 169 px  → using 170
//   Height : 16.5/105  × 416 ≈  65 px  → using 66
const PA_W = 170
const PA_H = 66
const PA_X = CX - PA_W / 2   // 65

// ─── Goal boxes (six-yard boxes) ─────────────────────────────────────────────
// Real: 18.32 m wide × 5.5 m deep
//   Width  : 18.32/68  × 286 ≈  77 px  → using 78
//   Height :  5.5/105  × 416 ≈  22 px  → using 22
const GB_W = 78
const GB_H = 22
const GB_X = CX - GB_W / 2   // 111

// ─── Penalty spots ────────────────────────────────────────────────────────────
// Real: 11 m from goal line → 11/105 × 416 ≈ 43.5 px from boundary
const PS_DIST  = 44   // distance from pitch boundary to penalty spot
const PS_TOP_Y = P_TOP    + PS_DIST   //  51
const PS_BOT_Y = P_BOTTOM - PS_DIST   // 379

// ─── Penalty arc (the "D") ────────────────────────────────────────────────────
// The D is drawn on the same radius as CC_R (9.15 m) centred on the penalty
// spot.  Only the portion that falls OUTSIDE the penalty area is visible.
//
// Intersection of the arc circle with the penalty-area edge:
//   dy  = |penalty_area_edge_y − penalty_spot_y|
//   dx  = √(D_R² − dy²)
//
const D_R = CC_R   // 40 — same radius as centre circle

// Top D — arc edge sits at the BOTTOM of the top penalty area
const TOP_D_EDGE = P_TOP + PA_H                          //  73
const TOP_D_DY   = TOP_D_EDGE - PS_TOP_Y                 //  22
const TOP_D_DX   = Math.sqrt(D_R * D_R - TOP_D_DY * TOP_D_DY)  // ≈ 34.4
// Arc path: from left intersection → clockwise (sweep=1) → right intersection
// sweep=1 draws the arc that bulges DOWNWARD (away from goal, toward center)
const TOP_D_PATH = `
  M ${CX - TOP_D_DX} ${TOP_D_EDGE}
  A ${D_R} ${D_R} 0 0 1 ${CX + TOP_D_DX} ${TOP_D_EDGE}
`.trim()

// Bottom D — arc edge sits at the TOP of the bottom penalty area
const BOT_D_EDGE = P_BOTTOM - PA_H                       // 357
const BOT_D_DY   = PS_BOT_Y - BOT_D_EDGE                //  22
const BOT_D_DX   = Math.sqrt(D_R * D_R - BOT_D_DY * BOT_D_DY)  // ≈ 34.4
// sweep=0 → counterclockwise → arc bulges UPWARD (away from goal, toward center)
const BOT_D_PATH = `
  M ${CX - BOT_D_DX} ${BOT_D_EDGE}
  A ${D_R} ${D_R} 0 0 0 ${CX + BOT_D_DX} ${BOT_D_EDGE}
`.trim()

// ─── Corner arcs ──────────────────────────────────────────────────────────────
// Real: 1 m radius → 1/68 × 286 ≈ 4 px; enlarged to 9 for visibility
const CA_R = 9
// Each corner arc is a 90° arc quarter-circle drawn INSIDE the pitch.
// Format:  M <start> A <r> <r> 0 0 <sweep> <end>
const CORNER_ARCS = [
  // Top-left:   start at bottom of arc → sweeps to the right
  `M ${P_LEFT} ${P_TOP + CA_R} A ${CA_R} ${CA_R} 0 0 1 ${P_LEFT + CA_R} ${P_TOP}`,
  // Top-right:  start at left of arc → sweeps downward
  `M ${P_RIGHT - CA_R} ${P_TOP} A ${CA_R} ${CA_R} 0 0 1 ${P_RIGHT} ${P_TOP + CA_R}`,
  // Bottom-left:  start at top of arc → sweeps to the right
  `M ${P_LEFT + CA_R} ${P_BOTTOM} A ${CA_R} ${CA_R} 0 0 0 ${P_LEFT} ${P_BOTTOM - CA_R}`,
  // Bottom-right: start at left of arc → sweeps upward
  `M ${P_RIGHT} ${P_BOTTOM - CA_R} A ${CA_R} ${CA_R} 0 0 0 ${P_RIGHT - CA_R} ${P_BOTTOM}`,
]

// ─── Grass stripes ────────────────────────────────────────────────────────────
// 10 equal horizontal bands alternating between two close shades of green.
// The stripes are clipped to the pitch boundary so they never bleed outside.
const STRIPE_COUNT  = 10
const STRIPE_H      = P_H / STRIPE_COUNT
// Colours deliberately close together — just enough contrast to feel like mown grass
const GRASS_DARK    = '#3d8c2c'
const GRASS_LIGHT   = '#4ba336'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PitchPlayerMarker {
  id: string
  /** SVG x — use VB_W coordinates (0–300) */
  x: number
  /** SVG y — use VB_H coordinates (0–430) */
  y: number
  /** Single letter or short abbrev shown inside the circle */
  label?: string
  /** Fill colour of the marker circle */
  color?: string
  /** Optional click handler */
  onClick?: () => void
}

export interface PitchViewProps {
  /**
   * Array of player markers to render on the pitch.
   * Each item is placed at (x, y) in the 300×430 coordinate space.
   * Leave empty to render the pitch alone.
   */
  players?: PitchPlayerMarker[]
  /** Extra Tailwind classes for the outer wrapper */
  className?: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PitchView({ players = [], className = '' }: PitchViewProps) {
  return (
    /**
     * Outer wrapper — rounded card with shadow.
     * `aspect-[300/430]` locks the height so the pitch never distorts;
     * `overflow-hidden` clips the rounded corners cleanly.
     */
    <div
      className={[
        'relative w-full overflow-hidden rounded-2xl shadow-2xl',
        'aspect-[300/430]',
        className,
      ].join(' ')}
    >
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Football pitch diagram"
        role="img"
      >
        {/* ── Clip path — nothing renders outside the pitch boundary ──────── */}
        <defs>
          <clipPath id="pitch-boundary">
            <rect x={P_LEFT} y={P_TOP} width={P_W} height={P_H} />
          </clipPath>
        </defs>

        {/* ════════════════════════════════════════════════════════════════════
            LAYER 1 — GRASS STRIPES
            Horizontal bands clipped to the pitch rectangle.
            Alternating dark / light shades simulate mown turf.
        ════════════════════════════════════════════════════════════════════ */}
        <g clipPath="url(#pitch-boundary)">
          {/* Full pitch base colour (catches any sub-pixel gaps between stripes) */}
          <rect x={P_LEFT} y={P_TOP} width={P_W} height={P_H} fill={GRASS_DARK} />

          {Array.from({ length: STRIPE_COUNT }, (_, i) => (
            <rect
              key={i}
              x={P_LEFT}
              y={P_TOP + i * STRIPE_H}
              width={P_W}
              /* +0.5 closes sub-pixel hairline gaps between stripes */
              height={STRIPE_H + 0.5}
              fill={i % 2 === 0 ? GRASS_LIGHT : GRASS_DARK}
            />
          ))}
        </g>

        {/* ════════════════════════════════════════════════════════════════════
            LAYER 2 — FIELD LINE MARKINGS
            All lines/shapes share the same stroke style defined on the <g>.
        ════════════════════════════════════════════════════════════════════ */}
        <g
          fill="none"
          stroke="white"
          strokeWidth="1.6"
          strokeOpacity="0.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* ── Outer pitch boundary ──────────────────────────────────────── */}
          <rect x={P_LEFT} y={P_TOP} width={P_W} height={P_H} />

          {/* ── Halfway / midfield line ───────────────────────────────────── */}
          <line x1={P_LEFT} y1={CY} x2={P_RIGHT} y2={CY} />

          {/* ── Centre circle ─────────────────────────────────────────────── */}
          <circle cx={CX} cy={CY} r={CC_R} />

          {/* ── TOP HALF ──────────────────────────────────────────────────── */}

          {/* Top penalty area — large rectangle near the top goal */}
          <rect x={PA_X} y={P_TOP} width={PA_W} height={PA_H} />

          {/* Top goal box — small rectangle inside the penalty area */}
          <rect x={GB_X} y={P_TOP} width={GB_W} height={GB_H} />

          {/* Top penalty arc — the D that extends below the penalty area */}
          <path d={TOP_D_PATH} />

          {/* ── BOTTOM HALF ───────────────────────────────────────────────── */}

          {/* Bottom penalty area */}
          <rect x={PA_X} y={P_BOTTOM - PA_H} width={PA_W} height={PA_H} />

          {/* Bottom goal box */}
          <rect x={GB_X} y={P_BOTTOM - GB_H} width={GB_W} height={GB_H} />

          {/* Bottom penalty arc */}
          <path d={BOT_D_PATH} />

          {/* ── CORNER ARCS ───────────────────────────────────────────────── */}
          {/* One quarter-circle at each corner of the pitch */}
          {CORNER_ARCS.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>

        {/* ════════════════════════════════════════════════════════════════════
            LAYER 3 — SPOT MARKERS
            Small filled circles: centre spot, two penalty spots.
        ════════════════════════════════════════════════════════════════════ */}
        {/* Centre spot */}
        <circle cx={CX} cy={CY} r={2.5} fill="white" fillOpacity={0.9} />

        {/* Top penalty spot — 11 m from goal line */}
        <circle cx={CX} cy={PS_TOP_Y} r={2.5} fill="white" fillOpacity={0.9} />

        {/* Bottom penalty spot */}
        <circle cx={CX} cy={PS_BOT_Y} r={2.5} fill="white" fillOpacity={0.9} />

        {/* ════════════════════════════════════════════════════════════════════
            LAYER 4 — PLAYER MARKERS  (prop-driven)
            Each marker is a <g> centred on (player.x, player.y).
            Replace the inner <circle>/<text> with a <foreignObject> PlayerCard
            when richer UI is needed — the transform stays the same.
        ════════════════════════════════════════════════════════════════════ */}
        {players.map((p) => (
          <g
            key={p.id}
            transform={`translate(${p.x}, ${p.y})`}
            onClick={p.onClick}
            className={p.onClick ? 'cursor-pointer' : undefined}
            role={p.onClick ? 'button' : undefined}
            aria-label={p.label ? `Player ${p.label}` : 'Player marker'}
          >
            {/* Outer glow ring — gives the marker depth against the grass */}
            <circle r={13} fill="black" fillOpacity={0.25} />
            {/* Main marker disc */}
            <circle r={11} fill={p.color ?? '#FF6B00'} stroke="white" strokeWidth="1.8" />
            {/* Player initial / short label */}
            {p.label && (
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="7.5"
                fontWeight="bold"
                fill="white"
                fontFamily="system-ui, sans-serif"
              >
                {p.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}
