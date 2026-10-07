import { api, tokenStore } from '@/lib/api'

export interface AuthUser {
  id: string
  email: string
  status: 'active' | 'pending' | 'suspended' | 'deleted'
  fullName?: string
  avatarUrl?: string
  isPersonalActive?: boolean
  isOrgActive?: boolean
  lastRole?: 'personal' | 'organization'
  /** Set only for Gaffer HQ staff. */
  platformRole?: 'platform_admin' | null
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

type UnknownRecord = Record<string, unknown>

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? (value as UnknownRecord) : {}
}

function getTokenFromPayload(payload: UnknownRecord): string | undefined {
  const directToken = payload.accessToken
  if (typeof directToken === 'string' && directToken.length > 0) return directToken

  const tokenAlias = payload.token
  if (typeof tokenAlias === 'string' && tokenAlias.length > 0) return tokenAlias

  const tokens = asRecord(payload.tokens)
  const nestedToken = tokens.accessToken
  if (typeof nestedToken === 'string' && nestedToken.length > 0) return nestedToken

  return undefined
}

function normalizeAuthResponse(raw: unknown): AuthResponse | null {
  const root = asRecord(raw)
  const nested = asRecord(root.data)

  const userCandidate = root.user ?? nested.user
  const tokenCandidate = getTokenFromPayload(root) ?? getTokenFromPayload(nested)
  const messageCandidate = root.message ?? nested.message
  const message = typeof messageCandidate === 'string' ? messageCandidate : 'Success'

  if (!userCandidate || typeof userCandidate !== 'object') {
    return null
  }

  if (!tokenCandidate) {
    return null
  }

  return {
    message,
    user: userCandidate as AuthUser,
    accessToken: tokenCandidate,
  }
}

// POST /auth/register
export async function register(
  email: string,
  password: string,
  lastRole?: 'personal' | 'organization',
  isOrgActive?: boolean,
): Promise<AuthResponse> {
  const raw = await api.post<unknown>('/auth/register', { email, password, lastRole, isOrgActive }, { public: true })
  const normalized = normalizeAuthResponse(raw)

  if (normalized) {
    tokenStore.set(normalized.accessToken)
    return normalized
  }

  // Some backends return 200 for register with only a success message.
  // Fallback to login so the client still gets a full auth payload.
  return login(email, password)
}

// POST /auth/login
export async function login(email: string, password: string): Promise<AuthResponse> {
  const raw = await api.post<unknown>('/auth/login', { email, password }, { public: true })
  const normalized = normalizeAuthResponse(raw)
  if (!normalized) {
    throw new Error('Login succeeded but returned an invalid auth payload.')
  }

  tokenStore.set(normalized.accessToken)
  return normalized
}

// POST /auth/refresh — reads rt cookie, no body needed
//
// Deduplicated: concurrent callers (React Strict Mode fires useEffect twice,
// PWAProvider may call this too) share the same in-flight Promise so the
// backend only receives ONE request. Token rotation means a second request
// with the already-rotated cookie would get a 401 INVALID_REFRESH.
let _refreshInFlight: Promise<RefreshResponse> | null = null

export async function refreshToken(): Promise<RefreshResponse> {
  if (_refreshInFlight) return _refreshInFlight

  _refreshInFlight = api
    .post<unknown>('/auth/refresh', undefined, {
      public: true,      // skip Authorization header (no access token yet)
      skipRefresh: true, // prevent recursive refresh loop on 401
    })
    .then((raw) => {
      const normalized = normalizeAuthResponse(raw)
      if (!normalized) {
        throw new Error('Refresh succeeded but returned an invalid auth payload.')
      }
      tokenStore.set(normalized.accessToken)
      return normalized
    })
    .finally(() => {
      _refreshInFlight = null
    })

  return _refreshInFlight
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

// Google OAuth — POST idToken to backend
export async function googleAuth(idToken: string): Promise<AuthResponse> {
  const raw = await api.post<unknown>('/auth/google', { idToken }, { public: true })
  const normalized = normalizeAuthResponse(raw)
  if (!normalized) {
    throw new Error('Google auth succeeded but returned an invalid auth payload.')
  }
  tokenStore.set(normalized.accessToken)
  return normalized
}
