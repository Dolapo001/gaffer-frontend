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
  brandingText?: string
  className?: string
}

// ─── SVG anatomy (viewBox "0 0 100 116") ─────────────────────────────────────
// v2: More organic, volumetric curves.

const JERSEY_PATH =
  'M35,10 L50,28 L65,10 Q85,6 94,26 L83,50 L81,106 Q50,114 19,106 L17,50 L6,26 Q15,6 35,10 Z'

// Separate sleeve paths for volumetric overlap
const SLEEVE_L = 'M35,10 Q22,8 6,26 L17,50 L28,30 Z'
const SLEEVE_R = 'M65,10 Q78,8 94,26 L83,50 L72,30 Z'

const COLLAR_BAND = 'M35,10 L50,28 L65,10 L61,12 L50,25 L39,12 Z'
const COLLAR_DEPTH = 'M39,12 L50,25 L61,12 Q50,4 39,12 Z'

// Arched path for branding text
const BRANDING_PATH = 'M25,72 Q50,66 75,72'

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
        <pattern id={id} x="0" y="0" width="12" height="116" patternUnits="userSpaceOnUse">
          <rect x="0" width="6"  height="116" fill={primary}   />
          <rect x="6" width="6"  height="116" fill={secondary} />
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
        <clipPath id={leftId} ><rect x="0"  y="0" width="50"  height="116" /></clipPath>
        <clipPath id={rightId}><rect x="50" y="0" width="50"  height="116" /></clipPath>
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

export function JerseySvg({
  primaryColor,
  secondaryColor,
  jerseyPattern,
  width = 64,
  height = 74,
  brandingText = 'GAFFER',
  className,
}: JerseySvgProps) {
  const uid = useId()
  const { primaryColor: pc, secondaryColor: sc } = normalizeJerseyConfig({ primaryColor, secondaryColor, jerseyPattern })

  const dropId = `${uid}-drop`; const meshId = `${uid}-mesh`; const rimId = `${uid}-rim`; const shadowId = `${uid}-sd`
  const sideId = `${uid}-side`; const logoId = `${uid}-logo`; const brandPId = `${uid}-bp`; const camoId = `${uid}-camo`

  return (
    <svg width={width} height={height} viewBox="0 0 100 116" fill="none" className={className}>
      <defs>
        <filter id={dropId} x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="rgba(0,0,0,0.3)" />
        </filter>
        <pattern id={meshId} x="0" y="0" width="1.2" height="1.2" patternUnits="userSpaceOnUse">
          <circle cx="0.3" cy="0.3" r="0.25" fill="rgba(255,255,255,0.04)" />
        </pattern>
        
        {/* Subtle Camo-like Texture */}
        <filter id={camoId}>
          <feTurbulence type="fractalNoise" baseFrequency="0.4" numOctaves="2" result="noise" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="discrete" tableValues="0 0.1 0 0.12 0" />
          </feComponentTransfer>
          <feComposite operator="in" in2="SourceGraphic" />
        </filter>

        <radialGradient id={rimId} cx="50%" cy="5%" r="70%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.2)" />
          <stop offset="70%" stopColor="rgba(255,255,255,0)"    />
        </radialGradient>
        <linearGradient id={sideId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="rgba(0,0,0,0.15)" />
          <stop offset="15%"  stopColor="rgba(0,0,0,0)" />
          <stop offset="85%"  stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
        </linearGradient>
        <linearGradient id={shadowId} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="80%"  stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.12)" />
        </linearGradient>
        <linearGradient id={logoId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#FF9800" />
          <stop offset="100%" stopColor="#D32F2F" />
        </linearGradient>
      </defs>

      {/* Body & Pattern */}
      <g filter={`url(#${dropId})`}>
        {jerseyPattern === 'solid'    && <SolidFill    primary={pc} />}
        {jerseyPattern === 'stripes'  && <StripeFill   primary={pc} secondary={sc} id={`${uid}-str`} />}
        {jerseyPattern === 'split'    && <SplitFill    primary={pc} secondary={sc} leftId={`${uid}-l`} rightId={`${uid}-r`} />}
        {jerseyPattern === 'gradient' && <GradientFill primary={pc} secondary={sc} id={`${uid}-g`} />}
      </g>

      {/* Texture & Shading Layers */}
      <path d={JERSEY_PATH} fill="white" filter={`url(#${camoId})`} style={{ mixBlendMode: 'overlay', opacity: 0.2 }} />
      <path d={SLEEVE_L} fill="rgba(0,0,0,0.08)" />
      <path d={SLEEVE_R} fill="rgba(0,0,0,0.08)" />
      <path d={JERSEY_PATH} fill={`url(#${meshId})`} style={{ mixBlendMode: 'overlay' }} />
      <path d={JERSEY_PATH} fill={`url(#${sideId})`} />
      <path d={JERSEY_PATH} fill={`url(#${shadowId})`} />
      <path d={JERSEY_PATH} fill={`url(#${rimId})`} />

      {/* Crisp Shoulder Stripes */}
      <g stroke={sc} strokeWidth="1.5" opacity="0.8">
        <path d="M30,12 L18,22" />
        <path d="M32,14 L20,24" />
        <path d="M34,16 L22,26" />
        
        <path d="M70,12 L82,22" />
        <path d="M68,14 L80,24" />
        <path d="M66,16 L78,26" />
      </g>

      {/* Left Chest Club Badge placeholder */}
      <circle cx="28" cy="42" r="4" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="0.5" />
      <circle cx="28" cy="42" r="2.5" fill={sc} fillOpacity="0.3" />

      {/* Right Sleeve Badge placeholder */}
      <circle cx="88" cy="38" r="3" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="0.4" />

      {/* Subtle Folds */}
      <g opacity="0.08" stroke="black" strokeWidth="0.8" fill="none">
        <path d="M50,28 Q55,48 60,68" />
        <path d="M18,50 Q30,56 35,72" />
        <path d="M82,50 Q70,56 65,72" />
      </g>

      {/* Deep V-Collar */}
      <path d={COLLAR_DEPTH} fill="rgba(0,0,0,0.4)" />
      <path d={COLLAR_BAND} fill={sc} stroke="rgba(0,0,0,0.1)" strokeWidth="0.8" />

      {/* Pro Logo Branding */}
      <g transform="translate(50, 74) scale(0.9)" filter="drop-shadow(0 1px 1px rgba(0,0,0,0.3))">
        <text x="-25" y="-12" fontSize="5" fontWeight="900" fill="white" fontFamily="Inter, sans-serif" opacity="0.8">THE</text>
        <g fill={`url(#${logoId})`} fontFamily="Chakra Petch, sans-serif" fontWeight="900" fontStyle="italic">
           <text x="-25" y="6" fontSize="18">G</text>
           {/* 'A' Silhouette */}
           <path d="M-10,6 L-7,-10 L-4,6 L-6,6 L-6.2,2 L-7.8,2 L-8,6 Z" />
           <circle cx="-7" cy="-5" r="1.5" fill="rgba(0,0,0,0.9)" />
           <path d="M-8.5,-1 L-5.5,-1 L-4,1 L-10,1 Z" fill="rgba(0,0,0,0.9)" />
           
           <text x="-1" y="6" fontSize="18">F</text>
           <text x="10" y="6" fontSize="18">F</text>
           <text x="21" y="6" fontSize="18">E</text>
           <text x="32" y="6" fontSize="18">R</text>
        </g>
      </g>
      
      {/* Seams */}
      <path d="M35,10 Q35,32 25,104" stroke="rgba(0,0,0,0.04)" strokeWidth="0.5" fill="none" />
      <path d="M65,10 Q65,32 75,104" stroke="rgba(0,0,0,0.04)" strokeWidth="0.5" fill="none" />
    </svg>
  )
}

export default JerseySvg
export type { JerseyPattern }
