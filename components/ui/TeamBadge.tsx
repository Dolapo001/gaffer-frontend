'use client'

import { useState } from 'react'
import { getImageUrl } from '@/lib/api'

/**
 * A team's crest: its logo, or its initials on a neutral disc when there is no logo or it fails to load.
 * One look everywhere a team appears.
 */
export function TeamBadge({ name, logoUrl, size = 32, className = '' }: { name: string; logoUrl?: string | null; size?: number; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null)
  const initials = (name || '?').replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'
  const src = logoUrl ? getImageUrl(logoUrl) : ''
  const showImage = !!src && failed !== src
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.08] font-semibold text-white/80 ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.34)) }}
      aria-hidden
    >
      {showImage ? <img src={src} alt="" className="h-full w-full object-cover" onError={() => setFailed(src)} /> : initials}
    </span>
  )
}
