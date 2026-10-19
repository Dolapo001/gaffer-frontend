/**
 * Our own visitor counting. No cookies, no IP address, no third party: a random id lives on the person's own device,
 * and what they do is sent to our own server in small batches. Never throws: tracking must never break a page.
 */
import { tokenStore } from '@/lib/api'

export type TrackedAction =
  | 'cta_get_started'
  | 'signup_completed'
  | 'login'
  | 'league_joined'
  | 'fantasy_team_created'
  | 'captain_set'
  | 'transfer_made'
  | 'match_viewed'
  | 'comment_posted'
  | 'reaction_given'
  | 'repost_made'
  | 'post_shared'
  | 'app_installed'
  | 'notifications_enabled'

interface QueuedEvent {
  type: 'pageview' | 'action'
  name?: TrackedAction
  path: string
  firstVisit?: boolean
}

const VISITOR_KEY = 'gaffer-visitor-id'
const SESSION_KEY = 'gaffer-session-id'
const SOURCE_KEY = 'gaffer-session-source'
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')

let queue: QueuedEvent[] = []
let timer: ReturnType<typeof setTimeout> | null = null
let firstVisitPending = false

const randomId = () => {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
  }
}

function read(store: Storage | undefined, key: string): string | null {
  try { return store?.getItem(key) ?? null } catch { return null }
}
function write(store: Storage | undefined, key: string, value: string) {
  try { store?.setItem(key, value) } catch { /* private mode */ }
}

function visitorId(): string {
  let id = read(typeof localStorage === 'undefined' ? undefined : localStorage, VISITOR_KEY)
  if (!id) {
    id = randomId()
    write(localStorage, VISITOR_KEY, id)
    firstVisitPending = true
  }
  return id
}

function sessionId(): string {
  let id = read(typeof sessionStorage === 'undefined' ? undefined : sessionStorage, SESSION_KEY)
  if (!id) {
    id = randomId()
    write(sessionStorage, SESSION_KEY, id)
    // Where this visit came from is worked out once, when the visit starts
    let utm = ''
    try { utm = new URLSearchParams(window.location.search).get('utm_source') || new URLSearchParams(window.location.search).get('ref') || '' } catch { /* ignore */ }
    write(sessionStorage, SOURCE_KEY, JSON.stringify({ referrer: document.referrer || '', utmSource: utm }))
  }
  return id
}

function disabled(): boolean {
  if (typeof window === 'undefined') return true
  if (navigator.doNotTrack === '1') return true
  // HQ staff browsing HQ are not visitors
  if (window.location.pathname.startsWith('/hq')) return true
  return false
}

async function flush(leaving = false) {
  timer = null
  if (!queue.length) return
  const events = queue.splice(0, 20)
  const source = (() => { try { return JSON.parse(read(sessionStorage, SOURCE_KEY) || '{}') } catch { return {} } })()
  const token = tokenStore.get()
  const payload = { visitorId: visitorId(), sessionId: sessionId(), referrer: source.referrer, utmSource: source.utmSource, events }
  // When the page is going away a normal request is cancelled; a beacon is made for exactly this.
  // It is sent as plain text so the browser does not need a permission check first.
  if (leaving && typeof navigator.sendBeacon === 'function') {
    try { if (navigator.sendBeacon(`${API_BASE}/analytics/collect`, new Blob([JSON.stringify(payload)], { type: 'text/plain' }))) { if (queue.length) schedule(); return } } catch { /* fall through */ }
  }
  try {
    await fetch(`${API_BASE}/analytics/collect`, {
      method: 'POST',
      keepalive: true,
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(payload),
    })
  } catch { /* tracking is best effort */ }
  if (queue.length) schedule()
}

function schedule() {
  if (timer) return
  timer = setTimeout(() => { void flush() }, 1500)
}

// The same thing twice within a moment is one thing (React runs effects twice in development)
const recent = new Map<string, number>()
function isRepeat(e: QueuedEvent): boolean {
  const key = `${e.type}:${e.name ?? ''}:${e.path}`
  const now = Date.now()
  const last = recent.get(key)
  recent.set(key, now)
  return last !== undefined && now - last < 1000
}

function push(e: QueuedEvent) {

  if (disabled() || isRepeat(e)) return
  try {
    visitorId()
    sessionId()
    queue.push(e)
    schedule()
  } catch { /* never break the page */ }
}

/** A page was opened. */
export function trackPageview(path: string) {
  if (typeof window === 'undefined') return
  try { visitorId() } catch { /* ignore */ } // creates the id on the very first visit
  const first = firstVisitPending
  push({ type: 'pageview', path, firstVisit: first || undefined })
  if (first) firstVisitPending = false
}

/** Something a person did: see the list of actions above. */
export function track(name: TrackedAction) {
  if (typeof window === 'undefined') return
  push({ type: 'action', name, path: window.location.pathname })
}

// Send what is waiting when the page is hidden or closed (the landing page buttons load a new page)
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush(true)
  })
  window.addEventListener('pagehide', () => { void flush(true) })
}
