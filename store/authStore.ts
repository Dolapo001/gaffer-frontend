import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { register, login, logout } from '@/lib/services/auth.service'
import { tokenStore } from '@/lib/api'
import type { AuthUser } from '@/lib/services/auth.service'
import type { UserProfile } from '@/lib/services/user.service'

// RBAC role hierarchy (from backend docs)
export type OrgRole = 'viewer' | 'staff' | 'manager' | 'admin' | 'owner'

// UI role: personal user vs org admin
export type UserRole = 'personal' | 'organization' | null

interface AuthState {
  // Core auth
  user: AuthUser | null
  profile: UserProfile | null          // Full profile from GET /users
  accessToken: string | null           // Kept in memory via tokenStore; also here for hydration
  isAuthenticated: boolean
  isLoading: boolean
  role: UserRole                       // 'personal' | 'organization' — set during onboarding
  error: string | null

  // Actions
  setUser: (user: AuthUser | null, token?: string) => void
  setProfile: (profile: UserProfile | null) => void
  setRole: (role: UserRole) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void

  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<AuthUser>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      role: null,
      error: null,

      setUser: (user, token) => {
        if (token) tokenStore.set(token)
        set({ user, isAuthenticated: !!user, accessToken: token ?? null })
      },

      setProfile: (profile) => set({ profile }),

      setRole: (role) => {
        // Mirror role into cookie so middleware can gate routes server-side.
        // In production this should be set by the server (HttpOnly cookie from
        // a /api/session endpoint that verifies the Firebase ID token).
        set({ role })
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const res = await login(email, password)
          tokenStore.set(res.accessToken)
          set({
            user: res.user,
            accessToken: res.accessToken,
            isAuthenticated: true,
            error: null,
          })
        } catch (err: any) {
          const msg = err?.message ?? 'Login failed'
          set({ error: msg })
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const res = await register(email, password)
          tokenStore.set(res.accessToken)
          set({
            user: res.user,
            accessToken: res.accessToken,
            isAuthenticated: true,
            error: null,
          })
          return res.user
        } catch (err: any) {
          const msg = err?.message ?? 'Registration failed'
          set({ error: msg })
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null })
        try {
          await logout()
        } catch {
          // Ignore logout errors — clear state regardless
        } finally {
          tokenStore.clear()
          set({
            user: null,
            profile: null,
            accessToken: null,
            isAuthenticated: false,
            role: null,
            isLoading: false,
          })
        }
      },
    }),
    {
      name: 'gaffer-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist isAuthenticated as a hydration hint.
      // Role is intentionally excluded — it is re-hydrated from the auth cookie
      // by middleware and re-set via setRole() after login/onboarding.
      // This prevents a malicious localStorage edit from granting admin access.
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        accessToken: state.accessToken,
      }),
      // On rehydration, restore the token to the in-memory store
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          tokenStore.set(state.accessToken)
        }
      },
    },
  ),
)

// Helper: check if user has at least the given org role
const ROLE_RANK: Record<OrgRole, number> = {
  viewer: 1,
  staff: 2,
  manager: 3,
  admin: 4,
  owner: 5,
}

export function hasMinRole(userRole: OrgRole | undefined, minRole: OrgRole): boolean {
  if (!userRole) return false
  return ROLE_RANK[userRole] >= ROLE_RANK[minRole]
}
