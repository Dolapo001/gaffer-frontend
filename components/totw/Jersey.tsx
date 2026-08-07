import React from 'react'

export interface JerseyProps {
  primaryColor?: string
  secondaryColor?: string
  className?: string
}

export function Jersey({
  primaryColor = '#1c2230',
  secondaryColor = '#e25f05',
  className = 'w-full h-full object-contain',
}: JerseyProps) {
  const pColor = primaryColor || '#1c2230'
  const sColor = secondaryColor || '#e25f05'

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.45))' }}
    >
      {/* Sleeves (Secondary Color) */}
      <path
        d="M 14 26 L 28 17 L 35 34 L 19 41 Z"
        fill={sColor}
      />
      <path
        d="M 86 26 L 72 17 L 65 34 L 81 41 Z"
        fill={sColor}
      />

      {/* Main Shirt Body (Primary Color) */}
      <path
        d="M 28 17 L 42 24 L 58 24 L 72 17 L 74 82 C 74 85 71 87 68 87 L 32 87 C 29 87 26 85 26 82 Z"
        fill={pColor}
      />

      {/* Collar Accent */}
      <path
        d="M 40 23 C 45 29 55 29 60 23 L 50 33 Z"
        fill={sColor}
      />

      {/* Vertical Chest Accent Stripe */}
      <rect
        x="47"
        y="33"
        width="6"
        height="54"
        fill={sColor}
        opacity="0.9"
      />

      {/* Side Contours for Depth */}
      <path
        d="M 26 35 C 30 50 30 70 26 82"
        stroke="black"
        strokeWidth="2"
        strokeOpacity="0.25"
      />
      <path
        d="M 74 35 C 70 50 70 70 74 82"
        stroke="black"
        strokeWidth="2"
        strokeOpacity="0.25"
      />
    </svg>
  )
}
