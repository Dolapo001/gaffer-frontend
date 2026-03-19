
/**
 * Gaffer API Client
 * JWT Bearer token authentication + HttpOnly refresh cookie rotation
 * Standard error envelope: { error: { code, message, details, requestId } }
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

// ─── Token storage (in-memory only — never localStorage for access tokens) ───

let _accessToken: string | null = null

export const tokenStore = {
  get: (): string | null => _accessToken,
  set: (token: string | null) => {
    _accessToken = token
    if (typeof document !== 'undefined') {
      if (token) {
        document.cookie = `gaffer-auth-token=${token}; path=/; max-age=31536000; SameSite=Lax`
      } else {
        document.cookie = `gaffer-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
      }
    }
  },
  clear: () => {
    _accessToken = null
    if (typeof document !== 'undefined') {
      document.cookie = `gaffer-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
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
  return data.accessToken
}

async function refreshOnce(): Promise<string> {
  // Deduplicate concurrent refresh calls
  if (!_refreshPromise) {
    _refreshPromise = doRefresh().finally(() => { _refreshPromise = null })
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
  if (res.status === 401 && !isPublic) {
    forceEjectAndRedirect('Your session has expired. Please log in again.')
  }

  return parseResponse<T>(res)
}


function forceEjectAndRedirect(message: string): never {
  tokenStore.clear()
  if (typeof document !== 'undefined') {
    document.cookie = 'gaffer-user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'
    const { useAuthStore } = require('@/store/authStore')
    const { useToastStore } = require('@/store/toastStore')

    useAuthStore.getState().setUser(null, undefined)

    useToastStore.getState().addToast({
      message,
      type: 'error',
      duration: 4000
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
    // Import inline to avoid circular deps at module level
    const { translateError } = require('@/lib/errorMessages')

    // Surface field-level validation errors first
    if (err.details && typeof err.details === 'object') {
      const fieldErrors = Object.values(err.details as Record<string, string[]>)
        .flat()
        .filter(Boolean)
      if (fieldErrors.length) return fieldErrors[0]
    }

    return translateError(err.code, err.message)
  }
  if (err instanceof Error) return err.message
  return 'An unexpected error occurred'
}
