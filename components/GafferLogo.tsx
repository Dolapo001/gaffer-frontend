'use client'

import React from 'react'
import Image from 'next/image'

interface GafferLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  animated?: boolean
}

export function GafferLogo({ size = 'md', className = '' }: GafferLogoProps) {
  const heights = {
    sm: 32,
    md: 48,
    lg: 80,
    xl: 120,
  }

  const height = heights[size]
  // Approximate aspect ratio based on the image provided (approx 4.5:1)
  const width = height * 4.5

  return (
    <div className={`relative flex items-center ${className}`}>
      {/* Subtle Glow behind the image */}
      <div className="absolute inset-0 bg-orange-gaffer/10 blur-2xl -z-10 rounded-full" />

      <Image
        src="/images/log.svg"
        alt="The Gaffer Logo"
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </div>
  )
}
