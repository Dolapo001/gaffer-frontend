import { describe, it, expect } from 'vitest'
import { deltaE, coloursLookAlike, isHexColour } from '../colorDifference'

describe('colour difference', () => {
  it('is 0 for the same colour, large for black against white, and reads #RGB', () => {
    expect(deltaE('#123456', '#123456')).toBeCloseTo(0, 5)
    expect(deltaE('#000', '#fff')).toBeGreaterThan(95)
  })
  it('sees two greens as look-alikes and red against white as different', () => {
    expect(coloursLookAlike('#006400', '#2E8B57')).toBe(true)
    expect(coloursLookAlike('#FF0000', '#FFFFFF')).toBe(false)
  })
  it('does not judge invalid colours', () => {
    expect(coloursLookAlike('red', '#fff')).toBe(false)
    expect(isHexColour('#12')).toBe(false)
    expect(isHexColour(' #1D4ED8 ')).toBe(true)
  })
})
