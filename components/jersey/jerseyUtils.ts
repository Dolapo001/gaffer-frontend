// ─── Jersey Utilities ─────────────────────────────────────────────────────────

export type JerseyPattern = 'solid'

export interface JerseyConfig {
  primaryColor: string
  secondaryColor: string
  jerseyPattern: JerseyPattern
}

/** Neutral fallback rendered at component boundaries when jersey data is absent. */
export const JERSEY_FALLBACK: JerseyConfig = {
  primaryColor: '#4a5568',
  secondaryColor: '#718096',
  jerseyPattern: 'solid',
}

// ─── Color Helpers ────────────────────────────────────────────────────────────

/** Parse a hex string (#RGB or #RRGGBB) into [r, g, b] (0-255). Returns null for invalid input. */
function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '').trim()
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ]
  }
  if (clean.length === 6) {
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
    ]
  }
  return null
}

/** Relative luminance per WCAG 2.1 §1.4.3 */
function relativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

/**
 * Returns '#ffffff' or '#000000' whichever has higher WCAG contrast
 * against the given background hex color.
 */
export function getContrastColor(hex: string): '#ffffff' | '#000000' {
  const rgb = hexToRgb(hex)
  if (!rgb) return '#ffffff'
  return relativeLuminance(...rgb) > 0.179 ? '#000000' : '#ffffff'
}

/**
 * Ensures a string is a valid #RGB or #RRGGBB hex color.
 * Returns `fallback` for null / undefined / malformed input.
 * Does NOT mutate fetched data — only call at render boundaries.
 */
export function normalizeHex(
  hex: string | undefined | null,
  fallback = JERSEY_FALLBACK.primaryColor,
): string {
  if (!hex) return fallback
  const clean = hex.startsWith('#') ? hex : `#${hex}`
  if (/^#[0-9A-Fa-f]{3}$/.test(clean) || /^#[0-9A-Fa-f]{6}$/.test(clean)) {
    return clean
  }
  return fallback
}

/**
 * Normalises a partial / missing jersey config into a complete JerseyConfig.
 * Only call at the render boundary — do not mutate fetched data globally.
 */
export function normalizeJerseyConfig(
  jersey: Partial<JerseyConfig> | null | undefined,
): JerseyConfig {
  return {
    primaryColor: normalizeHex(jersey?.primaryColor, JERSEY_FALLBACK.primaryColor),
    secondaryColor: normalizeHex(jersey?.secondaryColor, JERSEY_FALLBACK.secondaryColor),
    jerseyPattern: jersey?.jerseyPattern ?? JERSEY_FALLBACK.jerseyPattern,
  }
}
