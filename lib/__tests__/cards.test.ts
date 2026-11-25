import { describe, it, expect } from 'vitest'
import { cardCounts, hasCards } from '../cards'

describe('cardCounts', () => {
  it('keeps yellow and red apart, flat or under stats', () => {
    expect(cardCounts({ yellowCards: 2, redCards: 1 })).toEqual({ yellow: 2, red: 1 })
    expect(cardCounts({ stats: { yellowCards: 0, redCards: 1 } })).toEqual({ yellow: 0, red: 1 })
  })
  it('treats missing values as zero', () => {
    expect(cardCounts(null)).toEqual({ yellow: 0, red: 0 })
    expect(hasCards({})).toBe(false)
    expect(hasCards({ redCards: 1 })).toBe(true)
  })
})
