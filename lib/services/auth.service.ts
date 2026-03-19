import { api, tokenStore } from '@/lib/api'

export interface AuthUser {
  id: string
  email: string
  status: 'active' | 'pending' | 'suspended' | 'deleted'
  fullName?: string
  isPersonalActive?: boolean
  isOrgActive?: boolean
  lastRole?: 'personal' | 'organization'
}

export interface AuthResponse {
  message: string
  user: AuthUser
  accessToken: string
}

export interface RefreshResponse {
  message: string
  user: AuthUser
  accessToken: string
}

// POST /auth/register
export async function register(email: string, password: string): Promise<AuthResponse> {
  const data = await api.post<AuthResponse>('/auth/register', { email, password }, { public: true })
  tokenStore.set(data.accessToken)
  return data
}

// POST /auth/login
export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await api.post<AuthResponse>('/auth/login', { email, password }, { public: true })
  tokenStore.set(data.accessToken)
  return data
}

// POST /auth/refresh — reads rt cookie, no body
export async function refreshToken(): Promise<RefreshResponse> {
  const data = await api.post<RefreshResponse>('/auth/refresh', undefined, {
    public: true,
    skipRefresh: true,
    credentials: 'include',
  } as any)
  tokenStore.set(data.accessToken)
  return data
}

// POST /auth/forgot-password
export async function resetPassword(email: string): Promise<void> {
  await api.post<{ message: string }>('/auth/forgot-password', { email }, { public: true })
}

// POST /auth/reset-password — consumes the one-time token from the email link
export async function confirmPasswordReset(token: string, password: string): Promise<void> {
  await api.post<{ message: string }>('/auth/reset-password', { token, password }, { public: true })
}

// POST /auth/logout
export async function logout(): Promise<void> {
  try {
    await api.post<{ message: string }>('/auth/logout')
  } finally {
    tokenStore.clear()
  }
}

// Google OAuth — redirects to backend which handles the full OAuth flow
export function startGoogleOAuth(): void {
  window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/google`
}
