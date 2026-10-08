import { describe, it, expect } from 'vitest'
import { asArray } from '../asArray'

describe('asArray', () => {
  it('keeps a list as it is', () => {
    const list = [1, 2]
    expect(asArray(list)).toBe(list)
  })

  it('turns anything else into an empty list, so .slice() and .map() never crash a screen', () => {
    expect(asArray(undefined)).toEqual([])
    expect(asArray(null)).toEqual([])
    expect(asArray({ items: [1] })).toEqual([])
    expect(asArray('text')).toEqual([])
    expect(asArray(5)).toEqual([])
  })
})
