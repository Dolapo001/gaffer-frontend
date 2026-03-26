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
   const jerseyPath = 'M33,10 Q50,5 67,10 L81,18 L91,48 L73,52 L73,106 Q50,110 27,106 L27,52 L9,48 L19,18 Z'
  const uid = useId()
  const maskId = `kit-mask-${uid}`
  const filterId = `kit-filter-${uid}`
  
  return (
    <div className={`relative flex items-center justify-center pointer-events-none ${className}`} 
         style={{ width: finalWidth, height: finalHeight, overflow: 'visible' }}>
      
       <svg 
         viewBox="0 0 100 110" 
         className="w-full h-full overflow-visible"
       >
         <defs>
           <mask id={maskId}>
             <path d={jerseyPath} fill="white" />
           </mask>
           
           <filter id={filterId}>
              <feColorMatrix 
                type="matrix" 
                values="0.33 0.33 0.33 0 0
                        0.33 0.33 0.33 0 0
                        0.33 0.33 0.33 0 0
                        0    0    0    1 0" />
           </filter>

           <linearGradient id="gold-brand" x1="0" y1="0" x2="1" y2="0">
             <stop offset="0%" stopColor="#ffb347" />
             <stop offset="100%" stopColor="#ffcc33" />
           </linearGradient>
         </defs>

         <g mask={`url(#${maskId})`}>
            {/* 1. TEAM COLOR BASE */}
            <rect x="0" y="0" width="100" height="110" fill={pc} />

            {/* 2. MAIN LOGO — Shifted down slightly for better proportions */}
            <image 
              href="/images/gaffer-logo.png" 
              x="42" y="31" width="32" height="8.8"
              style={{ opacity: 0.95 }}
            />

            {/* 3. SHADING LAYER — MULTIPLY (The shader now defines the collar interior) */}
            <image 
              href={shaderPath} 
              x="0" y="0" width="100" height="110"
              preserveAspectRatio="xMidYMid slice"
              style={{ mixBlendMode: 'multiply', opacity: 1, filter: `url(#${filterId})` }}
            />
         </g>

         {/* 3. BRANDING REMOVED AS PER LOGO REQUEST */}
       </svg>
    </div>
  )
}


export default RealisticJersey
