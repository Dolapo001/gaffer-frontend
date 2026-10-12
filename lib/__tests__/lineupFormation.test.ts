import { describe, it, expect } from 'vitest'
import { parseFormation, defaultFormation, slotLayout, zoneOfSlot, moveSlot, growZone, shrinkZone, applyFormation, formationString } from '../lineupFormation'

const lineup = { 0: 'gk', 1: 'd1', 2: 'd2', 3: 'm1', 4: 'f1' }

describe('lineupFormation', () => {
  it('reads any split, including a zero area', () => {
    expect(parseFormation('2-2-0', 5)).toEqual({ DEF: 2, MID: 2, FWD: 0 })
    expect(parseFormation('4-4-2', 11)).toEqual({ DEF: 4, MID: 4, FWD: 2 })
  })
  it('falls back to the default when the numbers do not add up', () => {
    expect(formationString(parseFormation('4-3-3', 7))).toBe(defaultFormation(7))
    expect(formationString(parseFormation('junk', 5))).toBe('2-1-1')
  })
  it('lays out one slot per player with the goalkeeper first', () => {
    for (let n = 5; n <= 11; n++) expect(slotLayout(parseFormation(defaultFormation(n), n))).toHaveLength(n)
    expect(slotLayout({ DEF: 2, MID: 1, FWD: 1 })[0]).toEqual({ t: 88, l: 50 })
  })
  it('names the area of a slot', () => {
    const z = { DEF: 2, MID: 1, FWD: 1 }
    expect([0, 1, 2, 3, 4].map((i) => zoneOfSlot(z, i))).toEqual([null, 'DEF', 'DEF', 'MID', 'FWD'])
  })
  it('moves a player with his slot into another area', () => {
    const r = moveSlot(lineup, { DEF: 2, MID: 1, FWD: 1 }, 1, 'FWD')
    expect(r.zones).toEqual({ DEF: 1, MID: 1, FWD: 2 })
    expect(r.lineup).toEqual({ 0: 'gk', 1: 'd2', 2: 'm1', 3: 'f1', 4: 'd1' })
  })
  it('never moves the goalkeeper', () => {
    const z = { DEF: 2, MID: 1, FWD: 1 }
    expect(moveSlot(lineup, z, 0, 'FWD').zones).toEqual(z)
  })
  it('grows and shrinks an area, keeping everyone on the pitch', () => {
    const z = { DEF: 2, MID: 1, FWD: 1 }
    const g = growZone(lineup, z, 'MID')
    expect(formationString(g.zones)).toBe('1-2-1')
    expect(Object.keys(g.lineup)).toHaveLength(5)
    const s = shrinkZone(lineup, z, 'DEF')
    expect(s.zones.DEF).toBe(1)
    expect(Object.keys(s.lineup)).toHaveLength(5)
  })
  it('switches formation without losing players', () => {
    const r = applyFormation(lineup, { DEF: 2, MID: 1, FWD: 1 }, { DEF: 1, MID: 2, FWD: 1 })
    expect(r.zones).toEqual({ DEF: 1, MID: 2, FWD: 1 })
    expect(Object.values(r.lineup).sort()).toEqual(['d1', 'd2', 'f1', 'gk', 'm1'])
  })
})
