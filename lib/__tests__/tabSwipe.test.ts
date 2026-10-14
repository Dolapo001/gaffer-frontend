import { describe, it, expect } from 'vitest'
import { swipeDirection, adjacentTab } from '../tabSwipe'

describe('swipeDirection', () => {
  it('a quick flick to the left goes to the next tab', () => {
    expect(swipeDirection({ dx: -120, dy: 10, ms: 200 })).toBe(1)
  })
  it('a quick flick to the right goes to the previous tab', () => {
    expect(swipeDirection({ dx: 120, dy: -10, ms: 200 })).toBe(-1)
  })
  it('a short movement is ignored', () => {
    expect(swipeDirection({ dx: -40, dy: 0, ms: 100 })).toBe(0)
  })
  it('scrolling mostly up or down is ignored', () => {
    expect(swipeDirection({ dx: -90, dy: 120, ms: 200 })).toBe(0)
  })
  it('a slow drag is ignored', () => {
    expect(swipeDirection({ dx: -150, dy: 5, ms: 900 })).toBe(0)
  })
})

describe('adjacentTab', () => {
  const tabs = ['/app/dashboard', '/app/fantasy', '/app/league', '/app/news']
  it('moves along the tabs', () => {
    expect(adjacentTab(tabs, '/app/fantasy', 1)).toBe('/app/league')
    expect(adjacentTab(tabs, '/app/fantasy', -1)).toBe('/app/dashboard')
  })
  it('stops at the ends', () => {
    expect(adjacentTab(tabs, '/app/dashboard', -1)).toBeNull()
    expect(adjacentTab(tabs, '/app/news', 1)).toBeNull()
  })
  it('does nothing on a page that is not a tab', () => {
    expect(adjacentTab(tabs, '/app/match/123', 1)).toBeNull()
  })
})
