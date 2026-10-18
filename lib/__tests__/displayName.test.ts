import { describe, it, expect } from 'vitest'
import { nameOf, isProfileComplete } from '../displayName'

describe('nameOf', () => {
  it('prefers the name the person asked to be called', () => {
    expect(nameOf({ displayName: 'Chrissy', fullName: 'Ademofe Omotolani', username: 'ade' })).toBe('Chrissy')
  })
  it('falls back to full name, then username', () => {
    expect(nameOf({ fullName: 'Ademofe Omotolani', username: 'ade' })).toBe('Ademofe Omotolani')
    expect(nameOf({ username: 'ade' })).toBe('ade')
  })
  it('never returns a blank or "User"', () => {
    expect(nameOf({ displayName: '  ', fullName: '' })).toBe('Fan')
    expect(nameOf(null)).toBe('Fan')
  })
  it('names organisations by their name', () => {
    expect(nameOf({ name: 'Bowen Freshers Cup' })).toBe('Bowen Freshers Cup')
  })
})

describe('isProfileComplete', () => {
  it('needs full name, display name and phone', () => {
    expect(isProfileComplete({ fullName: 'A B', displayName: 'AB', phone: '08030000000' })).toBe(true)
    expect(isProfileComplete({ fullName: 'A B', displayName: '', phone: '08030000000' })).toBe(false)
    expect(isProfileComplete({ fullName: 'A B', displayName: 'AB', phone: null })).toBe(false)
    expect(isProfileComplete(null)).toBe(false)
  })
})
