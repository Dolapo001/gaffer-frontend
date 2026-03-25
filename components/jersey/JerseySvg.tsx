import { useId } from 'react'
import { normalizeHex, getContrastColor } from './jerseyUtils'

export interface JerseySvgProps {
  primaryColor: string
  secondaryColor?: string   // sleeves + collar; defaults to primaryColor (monochrome)
  text?: string             // chest label; defaults to 'GAFFER'
  textColor?: string        // auto-derived from contrast if omitted
  size?: number             // scales proportionally (width = size, height = size × 1.08)
  jerseyPattern?: string
  teamCode?: string
  width?: number
  height?: number
  brandingText?: string     // fallback for text
  className?: string
}

const JERSEY_PATH = 'M37,5 L50,27 L63,5 Q80,2 90,13 L97,25 Q98,35 97,40 L83,43 L82,101 Q50,106 18,101 L17,43 L3,40 Q2,35 3,25 L10,13 Q20,2 37,5Z'
const LEFT_PANEL  = 'M37,5 Q20,2 10,13 L3,25 Q2,35 3,40 L17,43 L28,22Z'
const RIGHT_PANEL = 'M63,5 Q80,2 90,13 L97,25 Q98,35 97,40 L83,43 L72,22Z'
const COLLAR_BAND = 'M37,5 L50,27 L63,5 L60,7.5 L50,23 L40,7.5Z'
const V_NECK = 'M37,5 L50,27 L63,5'

const MAX_TEXT_WIDTH = 58

function computeTextLength(text: string): number {
  const natural = text.length * 9
  return Math.min(natural, MAX_TEXT_WIDTH)
}

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
}: JerseySvgProps) {
  const uid = useId()
  const pc = normalizeHex(primaryColor)
  const sc = normalizeHex(secondaryColor ?? primaryColor, pc)
  const label = text ?? brandingText ?? 'GAFFER'
  const tc = textColor ?? getContrastColor(pc)
  const svgWidth  = width  ?? size
  const svgHeight = height ?? Math.round(size * 1.08)
  const textLen = computeTextLength(label)

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox="0 0 100 108"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d={JERSEY_PATH} fill={pc} />
      <path d={LEFT_PANEL}  fill={sc} />
      <path d={RIGHT_PANEL} fill={sc} />
      <path d={COLLAR_BAND} fill={sc} />
      <path d={JERSEY_PATH} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />
      <text
        x="50" y="72" textAnchor="middle" dominantBaseline="middle"
        fontSize="18" fontWeight="900" textLength={textLen}
        lengthAdjust="spacingAndGlyphs" fill={tc}
        style={{ userSelect: 'none', fontFamily: 'sans-serif' }}
      >
        {label}
      </text>
    </svg>
  )
}

export default JerseySvg
export type { JerseySvgProps as JerseyProps }
