import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { tokenStore } from '../api'

const jwt = (expInSeconds: number) => {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `${b64({ alg: 'none' })}.${b64({ exp: Math.floor(Date.now() / 1000) + expInSeconds })}.sig`
}

const ok = (token: string) => ({ ok: true, status: 200, json: async () => ({ accessToken: token }), text: async () => JSON.stringify({ accessToken: token }), headers: new Headers({ 'content-type': 'application/json' }) })

describe('keeping people signed in', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal('fetch', vi.fn()) })
  afterEach(() => { tokenStore.clear(); vi.useRealTimers(); vi.unstubAllGlobals() })

  it('renews the sign-in a minute before it expires instead of signing the person out', async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValue(ok(jwt(900)))
    tokenStore.set(jwt(300)) // expires in 5 minutes
    await vi.advanceTimersByTimeAsync(239_000)
    expect(fetchMock).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(2_000)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0][0])).toContain('/auth/refresh')
    // the new token is in use, so the person is still signed in
    expect(tokenStore.get()).not.toBeNull()
  })

  it('a token that is about to expire is renewed straight away', async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValue(ok(jwt(900)))
    tokenStore.set(jwt(30))
    await vi.advanceTimersByTimeAsync(10)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
