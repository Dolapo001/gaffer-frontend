import { useId } from 'react'
import { getContrastColor, normalizeJerseyConfig } from './jerseyUtils'
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

// ─── Jersey silhouette path (viewBox "0 0 50 58") ─────────────────────────────
//
// M17,7   – left collar point
// L5,15   – left shoulder
// L1,22   – left sleeve tip
// L7,26   – left armpit
// L7,52   – left hem
// L43,52  – right hem
// L43,26  – right armpit
// L49,22  – right sleeve tip
// L45,15  – right shoulder
// L33,7   – right collar point
// Q25,13 17,7 – V-neck collar curve back to start
//
const JERSEY_PATH = 'M17,7 L5,15 L1,22 L7,26 L7,52 L43,52 L43,26 L49,22 L45,15 L33,7 Q25,13 17,7Z'

// Centre of jersey body (used for text placement)
const CX = 25   // horizontal centre
const TEXT_Y_BRAND = 39   // baseline for GAFFER text
const TEXT_Y_CODE  = 48   // baseline for team code

// ─── Pattern renderers ────────────────────────────────────────────────────────

function SolidFill({ primary }: { primary: string }) {
  return <path d={JERSEY_PATH} fill={primary} />
}

function StripeFill({
  primary,
  secondary,
  patternId,
}: {
  primary: string
  secondary: string
  patternId: string
}) {
  return (
    <>
      <defs>
        <pattern
          id={patternId}
          x="0"
          y="0"
          width="8"
          height="58"
          patternUnits="userSpaceOnUse"
        >
          <rect x="0" y="0" width="4" height="58" fill={primary} />
          <rect x="4" y="0" width="4" height="58" fill={secondary} />
        </pattern>
      </defs>
      <path d={JERSEY_PATH} fill={`url(#${patternId})`} />
    </>
  )
}

function SplitFill({
  primary,
  secondary,
  leftClipId,
  rightClipId,
}: {
  primary: string
  secondary: string
  leftClipId: string
  rightClipId: string
}) {
  return (
    <>
      <defs>
        <clipPath id={leftClipId}>
          <rect x="0" y="0" width="25" height="58" />
        </clipPath>
        <clipPath id={rightClipId}>
          <rect x="25" y="0" width="25" height="58" />
        </clipPath>
      </defs>
      <path d={JERSEY_PATH} fill={primary}   clipPath={`url(#${leftClipId})`}  />
      <path d={JERSEY_PATH} fill={secondary} clipPath={`url(#${rightClipId})`} />
    </>
  )
}

function GradientFill({
  primary,
  secondary,
  gradientId,
}: {
  primary: string
  secondary: string
  gradientId: string
}) {
  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor={primary}   />
          <stop offset="100%" stopColor={secondary} />
        </linearGradient>
      </defs>
      <path d={JERSEY_PATH} fill={`url(#${gradientId})`} />
    </>
  )
}

// ─── JerseySvg ────────────────────────────────────────────────────────────────

/**
 * Pure, deterministic SVG jersey renderer.
 * - Safe for server and client components (no state, no effects).
 * - Uses React.useId() so multiple instances on the same page never share SVG def IDs.
 * - Supports four patterns: solid | stripes | split | gradient.
 * - Always shows GAFFER chest branding; optionally shows team code below.
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

  // Normalise colors at the render boundary — never mutates fetched data.
  const { primaryColor: pc, secondaryColor: sc } = normalizeJerseyConfig({
    primaryColor,
    secondaryColor,
    jerseyPattern,
  })

  const textColor  = getContrastColor(pc)
  const codeColor  = getContrastColor(pc)

  // Unique IDs for SVG defs — prevents collisions when many jerseys render.
  const stripeId   = `${uid}-stripe`
  const leftClipId = `${uid}-left`
  const rightClipId= `${uid}-right`
  const gradientId = `${uid}-grad`

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 50 58"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* ── Pattern fill ─────────────────────────────────────────────── */}
      {jerseyPattern === 'solid'    && <SolidFill    primary={pc} />}
      {jerseyPattern === 'stripes'  && <StripeFill   primary={pc} secondary={sc} patternId={stripeId} />}
      {jerseyPattern === 'split'    && <SplitFill    primary={pc} secondary={sc} leftClipId={leftClipId} rightClipId={rightClipId} />}
      {jerseyPattern === 'gradient' && <GradientFill primary={pc} secondary={sc} gradientId={gradientId} />}

      {/* ── Jersey outline ───────────────────────────────────────────── */}
      <path
        d={JERSEY_PATH}
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="0.8"
      />

      {/* ── Collar ───────────────────────────────────────────────────── */}
      <path
        d="M17,7 Q25,13 33,7"
        fill="none"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* ── Centre seam ──────────────────────────────────────────────── */}
      <line
        x1={CX} y1="14"
        x2={CX} y2="50"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="0.7"
        strokeDasharray="2 2"
      />

      {/* ── Chest branding ───────────────────────────────────────────── */}
      <text
        x={CX}
        y={TEXT_Y_BRAND}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={textColor}
        fontSize="7"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
        letterSpacing="0.5"
        style={{ userSelect: 'none' }}
      >
        {brandingText}
      </text>

      {/* ── Team code (optional) ─────────────────────────────────────── */}
      {teamCode && (
        <text
          x={CX}
          y={TEXT_Y_CODE}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={codeColor}
          fontSize="5"
          fontWeight="600"
          fontFamily="system-ui, sans-serif"
          letterSpacing="0.3"
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
