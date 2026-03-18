/**
 * Auth bridge — wraps the real REST auth service.
 * The old mock localStorage implementation has been replaced.
 */
export { register as registerWithEmail, login as loginWithEmail, logout as logoutUser } from '@/lib/services/auth.service'

// Google OAuth is NOT supported by the Gaffer backend. Removed.

export type { AuthUser as User } from '@/lib/services/auth.service'
export type Auth = unknown
export const getAuth = (): Auth => ({})

// Kept for compatibility with useAuthListener — calls the refresh endpoint
// on mount to restore the session from the rt cookie.
export { refreshToken as onAuthInit } from '@/lib/services/auth.service'
