import { describe, it, expect } from 'vitest'
import { inviteNextPath, authUrlForInvite } from '../afterAuth'

describe('inviteNextPath', () => {
  it('accepts coach and staff invite pages', () => {
    expect(inviteNextPath('/coach/join/db0229c4bf43')).toBe('/coach/join/db0229c4bf43')
    expect(inviteNextPath('/join/AbC-123_x')).toBe('/join/AbC-123_x')
  })
  it('rejects anything else, so ?next can never send someone to another page or site', () => {
    for (const bad of [null, undefined, '', '/app/dashboard', '//evil.com', 'https://evil.com', '/coach/join/', '/coach/join/a/b', '/coach/join/a?x=1', '/join/../admin']) {
      expect(inviteNextPath(bad as string | null)).toBeNull()
    }
  })
})

describe('authUrlForInvite', () => {
  it('names the invite page in the address', () => {
    expect(authUrlForInvite('/auth/login', '/coach/join/abc')).toBe('/auth/login?next=%2Fcoach%2Fjoin%2Fabc')
  })
})
