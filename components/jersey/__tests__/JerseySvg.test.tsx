import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { JerseySvg } from '../JerseySvg'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderJersey(overrides: Partial<React.ComponentProps<typeof JerseySvg>> = {}) {
  return render(
    <JerseySvg primaryColor="#1D4ED8" secondaryColor="#ffffff" {...overrides} />,
  )
}

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('JerseySvg — rendering', () => {
  it('renders an SVG element', () => {
    const { container } = renderJersey()
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('applies primaryColor as fill on the body path', () => {
    const { container } = renderJersey({ primaryColor: '#DC2626' })
    const paths = container.querySelectorAll('path')
    const filled = Array.from(paths).some((p) => p.getAttribute('fill') === '#DC2626')
    expect(filled).toBe(true)
  })

  it('applies secondaryColor to sleeve panel paths', () => {
    const { container } = renderJersey({
      primaryColor: '#1D4ED8',
      secondaryColor: '#FF0000',
    })
    const paths = container.querySelectorAll('path')
    const hasSecondary = Array.from(paths).some((p) => p.getAttribute('fill') === '#FF0000')
    expect(hasSecondary).toBe(true)
  })

  it('falls back to primaryColor for sleeves when secondaryColor is omitted', () => {
    const { container } = renderJersey({ primaryColor: '#16A34A', secondaryColor: undefined })
    const paths = container.querySelectorAll('path')
    // All filled paths should use the primary color (monochrome jersey)
    const coloredPaths = Array.from(paths).filter(
      (p) => p.getAttribute('fill') && p.getAttribute('fill') !== 'none' && !p.getAttribute('fill')?.startsWith('rgba'),
    )
    coloredPaths.forEach((p) => expect(p.getAttribute('fill')).toBe('#16A34A'))
  })
})

// ─── Sizing ───────────────────────────────────────────────────────────────────

describe('JerseySvg — sizing', () => {
  it('defaults to width=64', () => {
    const { container } = renderJersey()
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('64')
  })

  it('scales via the size prop', () => {
    const { container } = renderJersey({ size: 128 })
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('128')
    expect(svg.getAttribute('height')).toBe('138') // Math.round(128 × 1.08)
  })

  it('accepts explicit width/height overrides', () => {
    const { container } = renderJersey({ width: 80, height: 90 })
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('80')
    expect(svg.getAttribute('height')).toBe('90')
  })

  it('always sets viewBox to "0 0 100 108"', () => {
    const { container } = renderJersey({ size: 200 })
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('viewBox')).toBe('0 0 100 108')
  })
})

// ─── Text / branding ──────────────────────────────────────────────────────────

describe('JerseySvg — text', () => {
  it('displays "GAFFER" by default', () => {
    const { container } = renderJersey()
    const texts = container.querySelectorAll('text')
    const hasGaffer = Array.from(texts).some((t) => t.textContent === 'GAFFER')
    expect(hasGaffer).toBe(true)
  })

  it('displays a custom text when provided', () => {
    const { container } = renderJersey({ text: 'UNITED' })
    const texts = container.querySelectorAll('text')
    const has = Array.from(texts).some((t) => t.textContent === 'UNITED')
    expect(has).toBe(true)
  })

  it('falls back to brandingText when text is not provided', () => {
    const { container } = renderJersey({ brandingText: 'CITY' })
    const texts = container.querySelectorAll('text')
    const has = Array.from(texts).some((t) => t.textContent === 'CITY')
    expect(has).toBe(true)
  })

  it('prefers text over brandingText when both are provided', () => {
    const { container } = renderJersey({ text: 'FIRST', brandingText: 'SECOND' })
    const texts = container.querySelectorAll('text')
    const hasFirst  = Array.from(texts).some((t) => t.textContent === 'FIRST')
    const hasSecond = Array.from(texts).some((t) => t.textContent === 'SECOND')
    expect(hasFirst).toBe(true)
    expect(hasSecond).toBe(false)
  })

  it('renders exactly one text element', () => {
    const { container } = renderJersey()
    expect(container.querySelectorAll('text').length).toBe(1)
  })

  it('applies explicit textColor to the text element', () => {
    const { container } = renderJersey({ primaryColor: '#ffffff', textColor: '#FF0000' })
    const texts = container.querySelectorAll('text')
    const hasColor = Array.from(texts).some((t) => t.getAttribute('fill') === '#FF0000')
    expect(hasColor).toBe(true)
  })
})

// ─── Fallback / invalid colors ────────────────────────────────────────────────

describe('JerseySvg — fallback / invalid colors', () => {
  it('renders without crashing when given an invalid primaryColor', () => {
    expect(() => renderJersey({ primaryColor: 'not-a-color' })).not.toThrow()
  })

  it('renders an SVG even with empty string colors', () => {
    const { container } = renderJersey({ primaryColor: '', secondaryColor: '' })
    expect(container.querySelector('svg')).toBeTruthy()
  })
})

// ─── Backward-compat props ────────────────────────────────────────────────────

describe('JerseySvg — backward-compat props', () => {
  it('accepts jerseyPattern without crashing', () => {
    expect(() =>
      renderJersey({ jerseyPattern: 'stripes' } as React.ComponentProps<typeof JerseySvg>),
    ).not.toThrow()
  })

  it('accepts teamCode without crashing', () => {
    expect(() => renderJersey({ teamCode: 'ENG' })).not.toThrow()
  })
})

// ─── Fantasy integration contract ─────────────────────────────────────────────

describe('JerseySvg — fantasy integration', () => {
  it('renders with home kit colors', () => {
    const { container } = renderJersey({
      primaryColor: '#1D4ED8',
      secondaryColor: '#ffffff',
    })
    const paths = container.querySelectorAll('path')
    const hasPrimary = Array.from(paths).some((p) => p.getAttribute('fill') === '#1D4ED8')
    expect(hasPrimary).toBe(true)
  })
})

// ─── Fixture integration contract ─────────────────────────────────────────────

describe('JerseySvg — fixture integration', () => {
  it('renders homeKit colors correctly', () => {
    const { container } = renderJersey({
      primaryColor: '#1D4ED8',
      secondaryColor: '#ffffff',
    })
    const paths = container.querySelectorAll('path')
    const hasPrimary = Array.from(paths).some((p) => p.getAttribute('fill') === '#1D4ED8')
    expect(hasPrimary).toBe(true)
  })

  it('renders awayKit colors correctly', () => {
    const { container } = renderJersey({
      primaryColor: '#DC2626',
      secondaryColor: '#fbbf24',
    })
    const paths = container.querySelectorAll('path')
    const hasPrimary = Array.from(paths).some((p) => p.getAttribute('fill') === '#DC2626')
    expect(hasPrimary).toBe(true)
  })
})
