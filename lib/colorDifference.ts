/**
 * How different two colours look to a person (CIE Lab "delta E"), used to warn when a team's two kit colours would be
 * hard to tell apart on a pitch. Plain RGB distance is not used: it counts some look-alike pairs (two greens, for
 * example) as clearly different.
 */

/** Below this two colours are hard to tell apart (about 25-30 and up is clearly different). */
export const LOOKALIKE_DELTA_E = 30

export const isHexColour = (v: string | null | undefined): v is string => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test((v ?? '').trim())

function toRgb(hex: string): [number, number, number] {
  const h = hex.trim().replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number]
}

const linear = (c: number) => {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

function toLab(hex: string): [number, number, number] {
  const [r, g, b] = toRgb(hex).map(linear)
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116)
  const [fx, fy, fz] = [f(x), f(y), f(z)]
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

/** 0 for identical colours, about 100 for black against white. Both must be valid hex colours. */
export function deltaE(hexA: string, hexB: string): number {
  const [l1, a1, b1] = toLab(hexA)
  const [l2, a2, b2] = toLab(hexB)
  return Math.sqrt((l1 - l2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2)
}

/** True when both are valid colours that look too alike. Invalid colours are not judged here. */
export function coloursLookAlike(a: string, b: string): boolean {
  return isHexColour(a) && isHexColour(b) && deltaE(a, b) < LOOKALIKE_DELTA_E
}
