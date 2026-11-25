import { describe, it, expect } from 'vitest'
import { teamCodeOf } from '../teamCode'

describe('teamCodeOf', () => {
  it('prefers the short name', () => {
    expect(teamCodeOf({ shortName: 'ARS', handle: 'arsenal', name: 'Arsenal FC' })).toBe('ARS')
  })
  it('otherwise the first three letters of the handle, upper case', () => {
    expect(teamCodeOf({ handle: '400lv', name: '400 Level' })).toBe('400')
    expect(teamCodeOf({ shortName: ' ', handle: 'chelsea' })).toBe('CHE')
  })
  it('otherwise the first three letters of the name', () => {
    expect(teamCodeOf({ name: 'Medicine' })).toBe('MED')
  })
  it('is empty when nothing is known', () => {
    expect(teamCodeOf(null)).toBe('')
    expect(teamCodeOf({})).toBe('')
  })
})
