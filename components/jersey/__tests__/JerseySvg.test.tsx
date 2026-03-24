import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { JerseySvg } from '../JerseySvg'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderJersey(overrides: Partial<React.ComponentProps<typeof JerseySvg>> = {}) {
  const defaults = {
    primaryColor: '#1D4ED8',
    secondaryColor: '#ffffff',
    jerseyPattern: 'solid' as const,
  }
  return render(<JerseySvg {...defaults} {...overrides} />)
}

// ─── Solid pattern ────────────────────────────────────────────────────────────

describe('JerseySvg — solid pattern', () => {
  it('renders an SVG element', () => {
    const { container } = renderJersey({ jerseyPattern: 'solid' })
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('applies primaryColor as fill', () => {
    const { container } = renderJersey({ jerseyPattern: 'solid', primaryColor: '#DC2626' })
    // The solid fill path should have the primary color
    const paths = container.querySelectorAll('path')
    const filled = Array.from(paths).some((p) => p.getAttribute('fill') === '#DC2626')
    expect(filled).toBe(true)
  })
})

// ─── Stripes pattern ──────────────────────────────────────────────────────────

describe('JerseySvg — stripes pattern', () => {
  it('renders a <pattern> defs element for stripes', () => {
    const { container } = renderJersey({ jerseyPattern: 'stripes' })
    expect(container.querySelector('pattern')).toBeTruthy()
  })

  it('fills the jersey path with a url() reference', () => {
    const { container } = renderJersey({ jerseyPattern: 'stripes' })
    const paths = container.querySelectorAll('path')
    const hasUrl = Array.from(paths).some((p) =>
      p.getAttribute('fill')?.startsWith('url(#'),
    )
    expect(hasUrl).toBe(true)
  })
})

// ─── Split pattern ────────────────────────────────────────────────────────────

describe('JerseySvg — split pattern', () => {
  it('renders two clipPath defs for split', () => {
    const { container } = renderJersey({ jerseyPattern: 'split' })
    const clips = container.querySelectorAll('clipPath')
    expect(clips.length).toBe(2)
  })

  it('applies primaryColor to the left clip and secondaryColor to the right clip', () => {
    const { container } = renderJersey({
      jerseyPattern: 'split',
      primaryColor: '#1D4ED8',
      secondaryColor: '#DC2626',
    })
    const paths = container.querySelectorAll('path')
    const hasPrimary   = Array.from(paths).some((p) => p.getAttribute('fill') === '#1D4ED8')
    const hasSecondary = Array.from(paths).some((p) => p.getAttribute('fill') === '#DC2626')
    expect(hasPrimary).toBe(true)
    expect(hasSecondary).toBe(true)
  })
})

// ─── Gradient pattern ─────────────────────────────────────────────────────────

describe('JerseySvg — gradient pattern', () => {
  it('renders a <linearGradient> defs element', () => {
    const { container } = renderJersey({ jerseyPattern: 'gradient' })
    expect(container.querySelector('linearGradient')).toBeTruthy()
  })

  it('fills the jersey path with a url() gradient reference', () => {
    const { container } = renderJersey({ jerseyPattern: 'gradient' })
    const paths = container.querySelectorAll('path')
    const hasUrl = Array.from(paths).some((p) =>
      p.getAttribute('fill')?.startsWith('url(#'),
    )
    expect(hasUrl).toBe(true)
  })
})

// ─── Branding text ────────────────────────────────────────────────────────────

describe('JerseySvg — branding', () => {
  it('displays "GAFFER" by default', () => {
    const { container } = renderJersey()
    const texts = container.querySelectorAll('text')
    const hasGaffer = Array.from(texts).some((t) => t.textContent === 'GAFFER')
    expect(hasGaffer).toBe(true)
  })

  it('displays a custom brandingText when provided', () => {
    const { container } = renderJersey({ brandingText: 'TEST' })
    const texts = container.querySelectorAll('text')
    const hasText = Array.from(texts).some((t) => t.textContent === 'TEST')
    expect(hasText).toBe(true)
  })
})

// ─── Team code ────────────────────────────────────────────────────────────────

describe('JerseySvg — teamCode', () => {
  it('does not render a team code text element by default', () => {
    const { container } = renderJersey()
    const texts = container.querySelectorAll('text')
    // Only the branding text should be present
    expect(texts.length).toBe(1)
  })

  it('renders team code text when teamCode is provided', () => {
    const { container } = renderJersey({ teamCode: 'ENG' })
    const texts = container.querySelectorAll('text')
    const hasCode = Array.from(texts).some((t) => t.textContent === 'ENG')
    expect(hasCode).toBe(true)
    expect(texts.length).toBe(2) // branding + code
  })
})

// ─── SVG ID safety (no collisions) ───────────────────────────────────────────

describe('JerseySvg — SVG id safety', () => {
  it('renders multiple stripes jerseys without duplicate def IDs', () => {
    const { container } = render(
      <>
        <JerseySvg primaryColor="#1D4ED8" secondaryColor="#ffffff" jerseyPattern="stripes" />
        <JerseySvg primaryColor="#DC2626" secondaryColor="#fbbf24" jerseyPattern="stripes" />
      </>,
    )
    const patterns = container.querySelectorAll('pattern')
    expect(patterns.length).toBe(2)

    const ids = Array.from(patterns).map((p) => p.getAttribute('id'))
    expect(ids[0]).not.toBe(ids[1]) // IDs must differ
  })

  it('renders multiple split jerseys without duplicate clipPath IDs', () => {
    const { container } = render(
      <>
        <JerseySvg primaryColor="#1D4ED8" secondaryColor="#ffffff" jerseyPattern="split" />
        <JerseySvg primaryColor="#DC2626" secondaryColor="#fbbf24" jerseyPattern="split" />
      </>,
    )
    const clips = container.querySelectorAll('clipPath')
    expect(clips.length).toBe(4) // 2 per jersey × 2 jerseys

    const ids = Array.from(clips).map((c) => c.getAttribute('id'))
    const unique = new Set(ids)
    expect(unique.size).toBe(4) // all IDs unique
  })

  it('renders multiple gradient jerseys without duplicate linearGradient IDs', () => {
    const { container } = render(
      <>
        <JerseySvg primaryColor="#9333EA" secondaryColor="#c084fc" jerseyPattern="gradient" />
        <JerseySvg primaryColor="#16A34A" secondaryColor="#86efac" jerseyPattern="gradient" />
      </>,
    )
    const grads = container.querySelectorAll('linearGradient')
    expect(grads.length).toBe(2)

    const ids = Array.from(grads).map((g) => g.getAttribute('id'))
    expect(ids[0]).not.toBe(ids[1])
  })
})

// ─── Fallback handling ────────────────────────────────────────────────────────

describe('JerseySvg — fallback / invalid colors', () => {
  it('renders without crashing when given an invalid primaryColor', () => {
    expect(() =>
      renderJersey({ primaryColor: 'not-a-color', jerseyPattern: 'solid' }),
    ).not.toThrow()
  })

  it('renders an SVG even with empty string colors', () => {
    const { container } = renderJersey({ primaryColor: '', secondaryColor: '' })
    expect(container.querySelector('svg')).toBeTruthy()
  })
})

// ─── Fantasy integration contract ─────────────────────────────────────────────

describe('JerseySvg — fantasy integration', () => {
  it('renders with home kit colors (no resolvedKits logic needed)', () => {
    // Fantasy always uses team.jersey directly — no clash detection
    const { container } = renderJersey({
      primaryColor: '#1D4ED8',
      secondaryColor: '#ffffff',
      jerseyPattern: 'stripes',
      teamCode: 'ENG',
    })
    const texts = Array.from(container.querySelectorAll('text'))
    expect(texts.some((t) => t.textContent === 'ENG')).toBe(true)
    expect(texts.some((t) => t.textContent === 'GAFFER')).toBe(true)
  })
})

// ─── Fixture integration contract ─────────────────────────────────────────────

describe('JerseySvg — fixture integration', () => {
  it('renders homeKit colors correctly', () => {
    const homeKit = { primaryColor: '#1D4ED8', secondaryColor: '#ffffff', jerseyPattern: 'solid' as const }
    const { container } = renderJersey(homeKit)
    const paths = container.querySelectorAll('path')
    const hasPrimary = Array.from(paths).some((p) => p.getAttribute('fill') === '#1D4ED8')
    expect(hasPrimary).toBe(true)
  })

  it('renders awayKit colors correctly', () => {
    const awayKit = { primaryColor: '#DC2626', secondaryColor: '#fbbf24', jerseyPattern: 'gradient' as const }
    const { container } = renderJersey(awayKit)
    expect(container.querySelector('linearGradient')).toBeTruthy()
  })
})
