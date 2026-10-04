/**
 * Shared test fixture:
 *  - aborts every request to a non-local host and records it (third-party
 *    scripts like Google sign-in simply don't load; a request to any API host
 *    other than the local backend fails the test)
 *  - collects console errors and failed API calls per test
 *  - helpers: state(), login(), api() (seeded data + direct backend calls)
 */
import { test as base, expect, type Page } from '@playwright/test'
import fs from 'fs'
import { STATE_FILE, API } from './global-setup'

const LOCAL = new Set(['127.0.0.1', 'localhost'])

export type Account = { email: string; password: string; token: string; userId: string }
export type State = {
  run: string; api: string
  owner: Account; viewer: Account; fan: Account
  org: { id: string; name: string; handle: string }
  comp: { id: string; name: string; slug: string; code: string }
  teams: { id: string; name: string; handle: string; players: { id: string; name: string; position: string }[] }[]
  liveFixtureId: string
}

export function state(): State {
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
}

export async function api(method: string, p: string, token?: string | null, body?: unknown) {
  const res = await fetch(`${API}${p}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let json: any = null
  try { json = text ? JSON.parse(text) : null } catch { json = text }
  return { status: res.status, body: json }
}

type Guard = { blocked: string[]; consoleErrors: string[]; apiErrors: string[] }

export const test = base.extend<{ guard: Guard }>({
  guard: [async ({ context, page }, use, testInfo) => {
    const guard: Guard = { blocked: [], consoleErrors: [], apiErrors: [] }
    await context.route('**/*', (route) => {
      const url = new URL(route.request().url())
      if (url.protocol === 'data:' || url.protocol === 'blob:' || LOCAL.has(url.hostname)) return route.continue()
      guard.blocked.push(`${route.request().method()} ${url.hostname}${url.pathname}`)
      return route.abort('blockedbyclient')
    })
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return
      const text = msg.text()
      // Aborted third-party requests surface as console noise — not app errors
      if (/ERR_BLOCKED_BY_CLIENT|net::ERR_FAILED|accounts\.google\.com|Failed to load resource/i.test(text)) return
      guard.consoleErrors.push(text)
    })
    page.on('response', (res) => {
      const url = new URL(res.url())
      if (url.port === '4100' && res.status() >= 500) guard.apiErrors.push(`${res.status()} ${res.request().method()} ${url.pathname}`)
    })
    await use(guard)
    // Only the local backend may ever be called as the API
    const apiLeaks = guard.blocked.filter((b) => /the-gaffer/i.test(b))
    testInfo.annotations.push({ type: 'blocked-third-party', description: [...new Set(guard.blocked)].join(', ') || 'none' })
    expect(apiLeaks, 'requests to a non-local API').toEqual([])
    expect(guard.apiErrors, 'backend 5xx during the test').toEqual([])
  }, { auto: true }],
})

export { expect }

/** Log in through the real login page and wait for the landing route. */
export async function login(page: Page, account: Account, landing: RegExp) {
  await page.goto('/auth/login')
  await page.getByPlaceholder('Charlie Westervelt').fill(account.email)
  await page.getByPlaceholder('************').fill(account.password)
  await page.getByRole('button', { name: /^login$/i }).click()
  await page.waitForURL(landing, { timeout: 60_000 })
}
