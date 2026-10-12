import type { NextFixture } from '@/lib/fantasyMockData'

/** "TA" for "Timi -ayegunle Clevannymary jesufemi": first letter of the first and last name. */
export function initialsOf(name: string | undefined | null): string {
  const parts = (name ?? '').replace(/[^A-Za-z\u00C0-\u024F\s'-]/g, ' ').split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

/** Black or white, whichever reads better on this colour. Falls back to white for anything that isn't a hex colour. */
export function readableTextOn(hex: string | undefined | null): '#111111' | '#ffffff' {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex ?? '').trim())
  if (!m) return '#ffffff'
  const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1]
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  // Perceived brightness (ITU-R BT.601)
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#111111' : '#ffffff'
}

/** The player's next opponent as "CHE (H)" or "ARS (A)", or null when no match is scheduled. */
export function nextOpponentLabel(teamCode: string | undefined, fixtures: NextFixture[] | undefined): string | null {
  const next = fixtures?.[0]
  if (!next || !teamCode) return null
  if (next.homeCode === teamCode) return `${next.awayCode} (H)`
  if (next.awayCode === teamCode) return `${next.homeCode} (A)`
  return null
}
