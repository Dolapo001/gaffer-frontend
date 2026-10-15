import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from '../../middleware'

const req = (url: string) => new NextRequest(url, { headers: { host: new URL(url).host } })

describe('admin address', () => {
  it('serves HQ from the front page of the admin address', () => {
    const res = middleware(req('https://mama4orge.the-gaffer.com.ng/'))
    expect(res.headers.get('x-middleware-rewrite')).toContain('/hq')
  })

  it('keeps HQ pages working on the admin address', () => {
    const res = middleware(req('https://mama4orge.the-gaffer.com.ng/hq/users'))
    expect(res.headers.get('location')).toBeNull()
    expect(res.status).toBe(200)
  })

  it('sends the public site paths on the admin address to HQ', () => {
    const res = middleware(req('https://mama4orge.the-gaffer.com.ng/auth/login'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('https://mama4orge.the-gaffer.com.ng/hq')
  })

  it('hides /hq on the public site', () => {
    for (const path of ['/hq', '/hq/login', '/hq/users']) {
      const res = middleware(req(`https://www.the-gaffer.com.ng${path}`))
      expect(res.status).toBe(404)
    }
  })

  it('leaves local development alone', () => {
    const res = middleware(req('http://localhost:3000/hq/login'))
    expect(res.status).toBe(200)
  })
})
