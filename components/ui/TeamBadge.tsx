import { getImageUrl } from '@/lib/api'

/** A team's crest: its logo, or its initials on a neutral disc. One look everywhere a team appears. */
export function TeamBadge({ name, logoUrl, size = 32, className = '' }: { name: string; logoUrl?: string | null; size?: number; className?: string }) {
  const initials = (name || '?').replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.08] text-white/80 font-semibold ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.34)) }}
      aria-hidden
    >
      {logoUrl ? <img src={getImageUrl(logoUrl)} alt="" className="h-full w-full object-cover" /> : initials}
    </span>
  )
}
