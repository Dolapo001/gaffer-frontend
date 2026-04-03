/**
 * Base API client for Gaffer backend.
 *
 * All requests attach the auth token from the `gaffer-auth-token` cookie.
 * In production, swap `BASE_URL` to your actual backend URL and ensure
 * the token is a valid Firebase ID token verified server-side.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.gaffer.app/v1'

/** Read a cookie value by name (client-side only). */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export interface ApiError {
  status: number
  message: string
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getCookie('gaffer-auth-token')

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      message = body?.message ?? body?.detail ?? message
    } catch {
      // ignore JSON parse errors
    }
    const err: ApiError = { status: res.status, message }
    throw err
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

export const apiClient = {
  get: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { method: 'GET', ...options }),

  post: <T>(path: string, body: unknown, options?: RequestInit) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body), ...options }),

  put: <T>(path: string, body: unknown, options?: RequestInit) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body), ...options }),

  patch: <T>(path: string, body: unknown, options?: RequestInit) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body), ...options }),

  delete: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { method: 'DELETE', ...options }),
}
