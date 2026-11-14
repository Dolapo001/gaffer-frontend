import { describe, it, expect, beforeEach } from 'vitest'
import { isAlwaysAllowed } from '@/components/BrowserProtection'
import { pendingCoachToken } from '@/lib/services/coach.service'

describe('install gate: pages that open in an ordinary browser', () => {
  beforeEach(() => pendingCoachToken.clear())

  it('keeps sign-in and sign-up behind the install gate normally', () => {
    expect(isAlwaysAllowed('/auth/login')).toBe(false)
    expect(isAlwaysAllowed('/auth/signup')).toBe(false)
  })

  it('lets someone with a coach invite sign in or create an account in the browser', () => {
    pendingCoachToken.set('abc123')
    expect(isAlwaysAllowed('/auth/login')).toBe(true)
    expect(isAlwaysAllowed('/auth/signup')).toBe(true)
    expect(isAlwaysAllowed('/auth/forgot-password')).toBe(true)
    // ...but not the fan app itself
    expect(isAlwaysAllowed('/app/dashboard')).toBe(false)
  })

  it('always allows the coach invite page and coach mode', () => {
    expect(isAlwaysAllowed('/coach/join/abc123')).toBe(true)
    expect(isAlwaysAllowed('/coach')).toBe(true)
  })
})
