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

  // The Jersey Mask (Base64 SVG to prevent ANY background leak/checkers)
  const jerseyMask = `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 110">
      <path d="M38,4 L50,22 L62,4 Q80,2 88,10 L96,25 Q97,35 96,40 L80,45 L79,101 Q50,110 21,101 L20,45 L4,40 Q3,30 4,25 L12,10 Q20,2 38,4Z" fill="black" />
    </svg>
  `)}`
  const uid = useId()

  return (
    <div className={`relative flex items-center justify-center pointer-events-none ${className}`} 
         style={{ width: '100%', height: '100%', perspective: '400px' }}>
      
       {/* ── Main Shaded Jersey Unit ── */}
       <div 
         className="relative w-full h-full"
         style={{ 
            transform: 'rotateY(-15deg) rotateX(2deg)',
            transformStyle: 'preserve-3d',
            // PURE NATIVE CLIP: THE MASK KILLERS THE CHECKERED BOX FOREVER
            WebkitMaskImage: `url("${jerseyMask}")`,
            maskImage: `url("${jerseyMask}")`,
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            WebkitMaskRepeat: 'no-repeat',
         }}
       >
          {/* Base Layer: Primary Team Color */}
          <div className="absolute inset-0 z-0" style={{ backgroundColor: pc }} />

          {/* Shading Layer: The 3D texture overlay */}
          <div className="absolute inset-0 z-10" style={{ 
              backgroundImage: `url(${shaderPath})`,
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
              mixBlendMode: 'multiply',
              opacity: 0.9
          }} />

          {/* BRANDING: The Gaffer (Chest Placement) */}
          <div className="absolute inset-0 z-20 flex items-center justify-center p-[20%]"
               style={{ transform: 'translateY(-15%) translateX(-2%) translateZ(1px)' }}>
             <svg width="42" viewBox="0 0 100 30" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ff7b25" />
                  <stop offset="60%" stopColor="#ff4500" />
                  <stop offset="100%" stopColor="#cc2200" />
                </linearGradient>
                <text x="2" y="8" fontSize="6" fontWeight="900" fill="#fff" opacity="0.8" fontFamily="sans-serif">THE</text>
                <g transform="translate(0, 5)">
                  <text x="0" y="20" fontSize="22" fontWeight="900" fill={`url(#${uid}-gold)`} fontFamily="Arial Black, sans-serif">G</text>
                  <g transform="translate(18, 5)">
                      <path d="M0,15 L9,0 L18,15 Z" fill="#ff7b25" />
                      <g transform="translate(9, 8) scale(0.4)">
                        <circle cx="0" cy="0" r="4.5" fill="#000" />
                        <path d="M-3,5 Q0,4 3,5 L4,18 Q0,17 -4,18 L-3,5Z" fill="#000" />
                      </g>
                  </g>
                  <text x="42" y="20" fontSize="22" fontWeight="900" fill={`url(#${uid}-gold)`} fontFamily="Arial Black, sans-serif" letterSpacing="-1">FFER</text>
                </g>
             </svg>
          </div>
       </div>
    </div>
  )
}

export default RealisticJersey
