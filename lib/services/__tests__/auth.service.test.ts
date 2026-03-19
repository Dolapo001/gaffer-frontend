/**
 * Unit tests for lib/services/auth.service.ts
 *
 * Verifies correct endpoint paths, request bodies, and token store interactions.
 * The `api` client and `tokenStore` are both mocked.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  tokenStore: {
    set: vi.fn(),
    clear: vi.fn(),
    get: vi.fn(),
  },
}))

import { api, tokenStore } from '@/lib/api'
import {
  register,
  login,
  refreshToken,
  resetPassword,
  confirmPasswordReset,
  logout,
} from '@/lib/services/auth.service'

const mockApi = api as unknown as Record<string, ReturnType<typeof vi.fn>>
const mockTokenStore = tokenStore as unknown as Record<string, ReturnType<typeof vi.fn>>

const ACCESS_TOKEN = 'test-access-token'

function makeAuthResponse() {
  return {
    message: 'Success',
    user: {
      id: 'user-001',
      email: 'test@example.com',
      status: 'active' as const,
      fullName: 'Test User',
    },
    accessToken: ACCESS_TOKEN,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ── register ──────────────────────────────────────────────────────────────────

describe('register()', () => {
  it('calls POST /auth/register and stores the access token', async () => {
    const response = makeAuthResponse()
    mockApi.post.mockResolvedValue(response)

    const result = await register('test@example.com', 'password123')

    expect(mockApi.post).toHaveBeenCalledWith(
      '/auth/register',
      { email: 'test@example.com', password: 'password123' },
      expect.objectContaining({ public: true })
    )
    expect(mockTokenStore.set).toHaveBeenCalledWith(ACCESS_TOKEN)
    expect(result.user.email).toBe('test@example.com')
  })
})

// ── login ─────────────────────────────────────────────────────────────────────

describe('login()', () => {
  it('calls POST /auth/login and stores the access token', async () => {
    const response = makeAuthResponse()
    mockApi.post.mockResolvedValue(response)

    const result = await login('test@example.com', 'password123')

    expect(mockApi.post).toHaveBeenCalledWith(
      '/auth/login',
      { email: 'test@example.com', password: 'password123' },
      expect.objectContaining({ public: true })
    )
    expect(mockTokenStore.set).toHaveBeenCalledWith(ACCESS_TOKEN)
    expect(result.accessToken).toBe(ACCESS_TOKEN)
  })
})

// ── refreshToken ──────────────────────────────────────────────────────────────

describe('refreshToken()', () => {
  it('calls POST /auth/refresh and stores the new access token', async () => {
    const response = makeAuthResponse()
    mockApi.post.mockResolvedValue(response)

    const result = await refreshToken()

    expect(mockApi.post).toHaveBeenCalledWith(
      '/auth/refresh',
      undefined,
      expect.objectContaining({ public: true, skipRefresh: true })
    )
    expect(mockTokenStore.set).toHaveBeenCalledWith(ACCESS_TOKEN)
    expect(result.accessToken).toBe(ACCESS_TOKEN)
  })
})

// ── resetPassword ─────────────────────────────────────────────────────────────

describe('resetPassword()', () => {
  it('calls POST /auth/forgot-password with email', async () => {
    mockApi.post.mockResolvedValue({ message: 'Email sent' })

    await resetPassword('test@example.com')

    expect(mockApi.post).toHaveBeenCalledWith(
      '/auth/forgot-password',
      { email: 'test@example.com' },
      expect.objectContaining({ public: true })
    )
  })
})

// ── confirmPasswordReset ──────────────────────────────────────────────────────

describe('confirmPasswordReset()', () => {
  it('calls POST /auth/reset-password with token and new password', async () => {
    mockApi.post.mockResolvedValue({ message: 'Password reset' })

    await confirmPasswordReset('reset-token-xyz', 'newPassword123')

    expect(mockApi.post).toHaveBeenCalledWith(
      '/auth/reset-password',
      { token: 'reset-token-xyz', password: 'newPassword123' },
      expect.objectContaining({ public: true })
    )
  })
})

// ── logout ────────────────────────────────────────────────────────────────────

describe('logout()', () => {
  it('calls POST /auth/logout and clears the token store', async () => {
    mockApi.post.mockResolvedValue({ message: 'Logged out' })

    await logout()

    expect(mockApi.post).toHaveBeenCalledWith('/auth/logout')
    expect(mockTokenStore.clear).toHaveBeenCalled()
  })

  it('clears the token store even if the API call fails', async () => {
    mockApi.post.mockRejectedValue(new Error('Network error'))

    await logout().catch(() => {})

    expect(mockTokenStore.clear).toHaveBeenCalled()
  })
})
