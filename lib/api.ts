
/**
 * Gaffer API Client
 * JWT Bearer token authentication + HttpOnly refresh cookie rotation
 * Standard error envelope: { error: { code, message, details, requestId } }
 */

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')

// ─── Token storage (in-memory only — never localStorage for access tokens) ───

let _accessToken: string | null = null

// On module load, attempt to restore the access token from the JS-accessible
// cookie written by tokenStore.set(). This prevents an unnecessary /auth/refresh
// round-trip when the PWA is reopened with a still-valid token.
//
// IMPORTANT: only restore the token if it hasn't expired yet. An expired token
// in the cookie is the normal case after 15+ minutes away — useAuthListener will
// call /auth/refresh to get a fresh one. If we restore an expired token and then
// call scheduleAutoLogout, it fires forceEjectAndRedirect immediately (delay <= 0),
// which races ahead of useAuthListener and logs the user out on every hard refresh.
if (typeof document !== 'undefined') {
  const match = document.cookie.match(/(?:^|;\s*)gaffer-auth-token=([^;]+)/)
  if (match?.[1]) {
    const restoredToken = match[1]
    try {
      const base64Url = restoredToken.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const payload = JSON.parse(decodeURIComponent(
        atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      ))
      if (payload.exp && payload.exp * 1000 > Date.now()) {
        // Token is still valid — restore and schedule logout for when it expires
        _accessToken = restoredToken
        setTimeout(() => {
          if (_accessToken) scheduleAutoLogout(_accessToken)
        }, 0)
      }
      // Expired: leave _accessToken = null — useAuthListener will refresh via rt cookie
    } catch {
      // Malformed token — ignore, useAuthListener will handle the session
    }
  }
}

let _logoutTimer: any = null

function scheduleAutoLogout(token: string) {
  if (typeof window === 'undefined') return
  if (_logoutTimer) clearTimeout(_logoutTimer)

  try {
    // Decode JWT payload (middle part)
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    
    const payload = JSON.parse(jsonPayload)
    if (!payload.exp) return

    const exp = payload.exp * 1000 // Convert to milliseconds
    const now = Date.now()
    const delay = exp - now

    if (delay <= 0) {
      forceEjectAndRedirect('Your session has expired.')
    } else {
      _logoutTimer = setTimeout(() => {
        forceEjectAndRedirect('Your session has expired. Please log in again.')
      }, delay)
    }
  } catch (e) {
    console.warn('Failed to parse JWT for auto-logout:', e)
  }
}

export const tokenStore = {
  get: (): string | null => _accessToken,
  set: (token: string | null) => {
    _accessToken = token
    if (typeof document !== 'undefined') {
      if (token) {
        document.cookie = `gaffer-auth-token=${token}; path=/; max-age=31536000; SameSite=Lax`
        scheduleAutoLogout(token)
      } else {
        document.cookie = `gaffer-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
        if (_logoutTimer) {
          clearTimeout(_logoutTimer)
          _logoutTimer = null
        }
      }
    }
  },
  clear: () => {
    _accessToken = null
    if (typeof document !== 'undefined') {
      document.cookie = `gaffer-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
      if (_logoutTimer) {
        clearTimeout(_logoutTimer)
        _logoutTimer = null
      }
    }
  },
}

// ─── Standard API error ───────────────────────────────────────────────────────

export class ApiError extends Error {
  code: string
  details: unknown
  requestId?: string
  status: number

  constructor(status: number, code: string, message: string, details?: unknown, requestId?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details ?? null
    this.requestId = requestId
  }
}

// ─── Response parser ──────────────────────────────────────────────────────────

async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text()
  const contentType = res.headers.get('content-type') ?? ''
  const looksLikeHtml = contentType.includes('text/html') || /^\s*<!DOCTYPE html/i.test(text) || /^\s*<html/i.test(text)
  let body: unknown
  try { body = text ? JSON.parse(text) : null } catch { body = null }

  if (!res.ok) {
    const err = (body as any)?.error ?? {}
    throw new ApiError(
      res.status,
      err.code ?? 'UNKNOWN_ERROR',
      err.message ?? `HTTP ${res.status}`,
      err.details,
      err.requestId,
    )
  }

  // Successful API calls should always return JSON. If we got HTML, we're likely
  // hitting the frontend origin (e.g. NEXT_PUBLIC_API_URL is missing/wrong).
  if (looksLikeHtml) {
    throw new ApiError(
      502,
      'INVALID_API_RESPONSE',
      'Expected JSON from API but received HTML. Check NEXT_PUBLIC_API_URL and backend origin.',
    )
  }

  // Non-empty, non-JSON success response: also treat as an API contract error.
  if (text && body === null) {
    throw new ApiError(
      502,
      'INVALID_API_RESPONSE',
      'Expected JSON from API but received an invalid response body.',
    )
  }

  return body as T
}

// ─── Refresh (called automatically on 401) ────────────────────────────────────

let _refreshPromise: Promise<string> | null = null

async function doRefresh(): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include', // sends the rt HttpOnly cookie
  })
  const data = await parseResponse<{ accessToken: string }>(res)
  tokenStore.set(data.accessToken)

  // Keep authStore in sync so its in-memory accessToken field reflects reality.
  // Without this, authStore.accessToken stays stale (the old expired JWT) for
  // the rest of the session after a silent interceptor refresh.
  if (typeof window !== 'undefined') {
    try {
      const { useAuthStore } = require('@/store/authStore')
      useAuthStore.setState({ accessToken: data.accessToken })
    } catch {
      // Non-critical — tokenStore is the true source of truth for API calls
    }
  }

  return data.accessToken
}

async function refreshOnce(): Promise<string> {
  // Deduplicate concurrent refresh calls
  if (!_refreshPromise) {
    console.log('🔄 Attempting token refresh...')
    _refreshPromise = doRefresh()
      .then((token) => {
        console.log('✅ Token refreshed successfully')
        return token
      })
      .catch((err) => {
        console.error('❌ Token refresh failed:', err)
        throw err
      })
      .finally(() => { 
        _refreshPromise = null 
      })
  }
  return _refreshPromise
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  /** Skip automatic token injection (for public endpoints) */
  public?: boolean
  /** Skip automatic 401 refresh retry */
  skipRefresh?: boolean
}

export async function apiRequest<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const { body, public: isPublic, skipRefresh, ...fetchOpts } = opts

  // FormData must not have Content-Type set manually — browser sets it with boundary
  const isFormData = body instanceof FormData

  const headers: Record<string, string> = isFormData
    ? { ...(fetchOpts.headers as Record<string, string> ?? {}) }
    : {
        'Content-Type': 'application/json',
        ...(fetchOpts.headers as Record<string, string> ?? {}),
      }

  if (!isPublic) {
    const token = tokenStore.get()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOpts,
    credentials: 'include', // always include cookies for rt cookie
    headers,
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  })

  // Automatic token refresh on 401
  if (res.status === 401 && !skipRefresh && !isPublic) {
    try {
      const newToken = await refreshOnce()
      headers['Authorization'] = `Bearer ${newToken}`
      const retryRes = await fetch(`${API_BASE}${path}`, {
        ...fetchOpts,
        credentials: 'include',
        headers,
        body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
      })

      if (retryRes.status === 401) {
        // Even after refresh, the endpoint rejected us. 
        // Boot them out so they don't get stuck.
        forceEjectAndRedirect('Your session has expired. Please log in again.')
      }

      return parseResponse<T>(retryRes)
    } catch {
      forceEjectAndRedirect('Your session has expired. Please log in again.')
    }
  }

  // If a standard response returns 401 (and we didn't intercept it for auth, usually because
  // skipRefresh was true, or some other reason), eject them.
  return parseResponse<T>(res)
}

/**
 * Force clear auth state and redirect to login.
 * IMPORTANT: Only called when a refresh truly fails (session dead).
 */
function forceEjectAndRedirect(message: string): never {
  console.warn('🔴 Ejecting user:', message)
  tokenStore.clear()
  if (typeof document !== 'undefined') {
    // Clear role cookie but NOT the whole local storage yet? 
    // Actually, we must clear the store user state to prevent "App resets to personal"
    document.cookie = 'gaffer-user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'
    const { useAuthStore } = require('@/store/authStore')
    const { useToastStore } = require('@/store/toastStore')

    useAuthStore.getState().setUser(null, undefined)
    useAuthStore.getState().setRole(null) // Reset role to prevent stale admin access

    useToastStore.getState().addToast({
      message,
      type: 'error',
      duration: 5000
    })

    if (window.location.pathname !== '/auth/login') {
      window.location.href = '/auth/login'
    }
  }
  throw new ApiError(401, 'SESSION_EXPIRED', message)
}

// ─── Convenience methods ──────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string, opts?: RequestOptions) =>
    apiRequest<T>(path, { ...opts, method: 'GET' }),

  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiRequest<T>(path, { ...opts, method: 'POST', body }),

  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiRequest<T>(path, { ...opts, method: 'PUT', body }),

  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiRequest<T>(path, { ...opts, method: 'PATCH', body }),

  delete: <T>(path: string, opts?: RequestOptions) =>
    apiRequest<T>(path, { ...opts, method: 'DELETE' }),
}

// ─── Human-readable error helper ─────────────────────────────────────────────

export function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const { translateError } = require('@/lib/errorMessages')

    if (err.details && typeof err.details === 'object') {
      try {
        // Zod format check: { field: { _errors: [] }, _errors: [] }
        const details = err.details as any
        
        // 1. Check root level _errors
        if (Array.isArray(details._errors) && details._errors.length > 0) {
          return details._errors[0]
        }

        // 2. Check field level _errors
        const firstField = Object.values(details).find((v: any) => v && Array.isArray(v._errors) && v._errors.length > 0) as any
        if (firstField) return firstField._errors[0]

        // 3. Fallback: search for any array values (old behavior)
        const fieldErrors = Object.values(details)
          .flat()
          .filter((v) => typeof v === 'string') as string[]
        if (fieldErrors.length > 0) return fieldErrors[0]
      } catch (e) {
        console.error('Error parsing details:', e)
      }
    }

    return translateError(err.code, err.message)
  }
  if (err instanceof Error) return err.message
  return 'An unexpected error occurred'
}

/**
 * Ensures an image URL is absolute, prefixing it with the backend URL if needed.
 */
export function getImageUrl(path: string | undefined): string {
  if (!path) return ''
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path
  
  // Remove leading slash if any
  const cleanPath = path.startsWith('/') ? path.substring(1) : path
  
  // Use the API base URL if available, otherwise default to localhost:4000
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/v1$/, '') || 'http://localhost:4000'
  return `${baseUrl}/${cleanPath}`
}
