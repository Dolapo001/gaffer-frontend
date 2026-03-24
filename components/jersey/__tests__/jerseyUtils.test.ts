import { describe, it, expect } from 'vitest'
import {
  getContrastColor,
  normalizeHex,
  normalizeJerseyConfig,
  JERSEY_FALLBACK,
} from '../jerseyUtils'

// ─── getContrastColor ─────────────────────────────────────────────────────────

describe('getContrastColor()', () => {
  it('returns white text for dark primary colors', () => {
    expect(getContrastColor('#000000')).toBe('#ffffff')
    expect(getContrastColor('#1D4ED8')).toBe('#ffffff') // deep blue  (lum ≈ 0.097)
    expect(getContrastColor('#DC2626')).toBe('#ffffff') // red        (lum ≈ 0.101)
    expect(getContrastColor('#111827')).toBe('#ffffff') // near-black (lum ≈ 0.007)
    expect(getContrastColor('#9333EA')).toBe('#ffffff') // purple     (lum ≈ 0.085)
  })

  it('returns black text for light or mid-tone primary colors', () => {
    expect(getContrastColor('#ffffff')).toBe('#000000')
    expect(getContrastColor('#f9fafb')).toBe('#000000') // near-white  (lum ≈ 0.955)
    expect(getContrastColor('#fbbf24')).toBe('#000000') // amber       (lum ≈ 0.483)
    expect(getContrastColor('#86efac')).toBe('#000000') // light green (lum ≈ 0.560)
    expect(getContrastColor('#16A34A')).toBe('#000000') // mid green   (lum ≈ 0.268 > 0.179)
  })

  it('falls back to white when color is invalid', () => {
    expect(getContrastColor('not-a-color')).toBe('#ffffff')
    expect(getContrastColor('')).toBe('#ffffff')
  })

  it('handles 3-digit shorthand hex', () => {
    // #fff expands to #ffffff — should be light → black text
    expect(getContrastColor('#fff')).toBe('#000000')
    // #000 expands to #000000 — should be dark → white text
    expect(getContrastColor('#000')).toBe('#ffffff')
  })
})

// ─── normalizeHex ─────────────────────────────────────────────────────────────

describe('normalizeHex()', () => {
  it('passes through valid 6-digit hex unchanged', () => {
    expect(normalizeHex('#1D4ED8')).toBe('#1D4ED8')
    expect(normalizeHex('#ffffff')).toBe('#ffffff')
    expect(normalizeHex('#000000')).toBe('#000000')
  })

  it('passes through valid 3-digit hex unchanged', () => {
    expect(normalizeHex('#fff')).toBe('#fff')
    expect(normalizeHex('#abc')).toBe('#abc')
  })

  it('prepends # when missing', () => {
    expect(normalizeHex('1D4ED8')).toBe('#1D4ED8')
  })

  it('returns the fallback for null / undefined', () => {
    expect(normalizeHex(null)).toBe(JERSEY_FALLBACK.primaryColor)
    expect(normalizeHex(undefined)).toBe(JERSEY_FALLBACK.primaryColor)
  })

  it('returns the fallback for invalid strings', () => {
    expect(normalizeHex('not-hex')).toBe(JERSEY_FALLBACK.primaryColor)
    expect(normalizeHex('#ZZZZZZ')).toBe(JERSEY_FALLBACK.primaryColor)
    expect(normalizeHex('#12345')).toBe(JERSEY_FALLBACK.primaryColor) // 5 digits invalid
  })

  it('accepts a custom fallback', () => {
    expect(normalizeHex(null, '#ff0000')).toBe('#ff0000')
  })
})

// ─── normalizeJerseyConfig ────────────────────────────────────────────────────

describe('normalizeJerseyConfig()', () => {
  it('returns the JERSEY_FALLBACK when called with null', () => {
    expect(normalizeJerseyConfig(null)).toEqual(JERSEY_FALLBACK)
  })

  it('returns the JERSEY_FALLBACK when called with undefined', () => {
    expect(normalizeJerseyConfig(undefined)).toEqual(JERSEY_FALLBACK)
  })

  it('returns the JERSEY_FALLBACK when called with an empty object', () => {
    expect(normalizeJerseyConfig({})).toEqual(JERSEY_FALLBACK)
  })

  it('uses provided valid colors and pattern', () => {
    const result = normalizeJerseyConfig({
      primaryColor: '#DC2626',
      secondaryColor: '#fbbf24',
      jerseyPattern: 'stripes',
    })
    expect(result.primaryColor).toBe('#DC2626')
    expect(result.secondaryColor).toBe('#fbbf24')
    expect(result.jerseyPattern).toBe('stripes')
  })

  it('replaces only invalid fields with fallbacks', () => {
    const result = normalizeJerseyConfig({
      primaryColor: 'not-a-hex',
      secondaryColor: '#ffffff',
      jerseyPattern: 'gradient',
    })
    expect(result.primaryColor).toBe(JERSEY_FALLBACK.primaryColor) // invalid → fallback
    expect(result.secondaryColor).toBe('#ffffff')                  // valid → kept
    expect(result.jerseyPattern).toBe('gradient')                  // valid → kept
  })

  it('normalises all four pattern values without error', () => {
    for (const p of ['solid', 'stripes', 'split', 'gradient'] as const) {
      const result = normalizeJerseyConfig({ primaryColor: '#111', secondaryColor: '#eee', jerseyPattern: p })
      expect(result.jerseyPattern).toBe(p)
    }
  })
})
