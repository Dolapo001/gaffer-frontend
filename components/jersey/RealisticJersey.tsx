import React, { useId } from 'react'
import { normalizeHex, getContrastColor } from './jerseyUtils'

export interface RealisticJerseyProps {
  primaryColor: string
  secondaryColor?: string   // sleeves + collar; defaults to primaryColor
  text?: string             // chest label
  textColor?: string        // auto-derived
  size?: number             // width in pixels
  width?: number
  height?: number
  brandingText?: string     // fallback for text
  className?: string
}

/**
 * RealisticJersey — Photorealistic 3D Kit shading system.
 * Uses a greyscale master template as a multiply-shader to achieve 
 * realistic shadows, wrinkles, and highlights on dynamic colors.
 */
export const RealisticJersey: React.FC<RealisticJerseyProps> = ({
  primaryColor,
  secondaryColor,
  text,
  textColor,
  size = 64,
  width,
  height,
  brandingText,
  className = '',
}) => {
  const pc = normalizeHex(primaryColor)
  const sc = normalizeHex(secondaryColor ?? primaryColor, pc)
  const label = text ?? brandingText ?? 'GAFFER'
  const tc = textColor ?? getContrastColor(pc)
  
  const finalWidth = width ?? size
  const finalHeight = height ?? Math.round(size * 1) // Using 1:1 aspect for the 3D render

  const shaderPath = '/assets/kits/master_shade_3_4.png'

  // The Jersey Mask Path (Matches the 100x110 viewbox exactly)
  const jerseyPath = 'M38,4 L50,22 L62,4 Q80,2 88,10 L96,25 Q97,35 96,40 L80,45 L79,101 Q50,110 21,101 L20,45 L4,40 Q3,30 4,25 L12,10 Q20,2 38,4Z'
  const uid = useId()
  const maskId = `kit-mask-${uid}`

  return (
    <div className={`relative flex items-center justify-center pointer-events-none ${className}`} 
         style={{ width: '100%', height: '100%' }}>
      
       <svg 
         viewBox="0 0 100 110" 
         className="w-full h-full"
         style={{ 
            filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))',
            transform: 'rotateY(-15deg)',
            transformStyle: 'preserve-3d'
         }}
       >
         <defs>
           <mask id={maskId}>
             <path d={jerseyPath} fill="white" />
           </mask>
           <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="1" y2="0">
             <stop offset="0%" stopColor="#ff7b25" />
             <stop offset="60%" stopColor="#ff4500" />
             <stop offset="100%" stopColor="#cc2200" />
           </linearGradient>
         </defs>

         {/* ── THE ONLY VISIBLE AREA IS THE MASKED GROUP ── */}
         <g mask={`url(#${maskId})`}>
            {/* Color Layer (Fills only the jersey shape) */}
            <rect x="0" y="0" width="100" height="110" fill={pc} />

            {/* Shading Layer (Multiply texture into the color) */}
            <image 
              href={shaderPath} 
              x="0" y="0" width="100" height="110"
              preserveAspectRatio="xMidYMid meet"
              style={{ mixBlendMode: 'multiply', opacity: 1 }}
            />
         </g>

         {/* ── Gaffer Branding Chest Placement ── */}
         <g transform="translate(48, 48) scale(0.65) translate(-48, -25)">
            <text x="0" y="0" fontSize="5" fontWeight="900" fill="#fff" opacity="0.8" fontFamily="sans-serif">THE</text>
            <g transform="translate(0, 1)">
              <text x="0" y="15" fontSize="18" fontWeight="900" fill={`url(#${uid}-gold)`} fontFamily="Arial Black, sans-serif">G</text>
              <g transform="translate(15, 0)">
                  <path d="M0,15 L9,0 L18,15 Z" fill="#ff7b25" />
                  <g transform="translate(9, 8) scale(0.35)">
                    <circle cx="0" cy="0" r="4.5" fill="#000" />
                    <path d="M-3,5 Q0,4 3,5 L4,18 Q0,17 -4,18 L-3,5Z" fill="#000" />
                  </g>
              </g>
              <text x="35" y="15" fontSize="18" fontWeight="900" fill={`url(#${uid}-gold)`} fontFamily="Arial Black, sans-serif" letterSpacing="-1">FFER</text>
            </g>
         </g>
       </svg>
    </div>
  )
}

export default RealisticJersey
