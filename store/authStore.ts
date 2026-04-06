import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { register, login, logout } from '@/lib/services/auth.service'
import { tokenStore, ApiError } from '@/lib/api'
import { translateError } from '@/lib/errorMessages'
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
  accessToken: string | null           // Kept in memory via tokenStore only — NOT persisted to localStorage
  isAuthenticated: boolean
  isLoading: boolean
  role: UserRole                       // 'personal' | 'organization' — set during onboarding
  error: string | null

  // Actions
  setUser: (user: AuthUser | null, token?: string) => void
  updateUser: (user: Partial<AuthUser>) => void
  setProfile: (profile: UserProfile | null) => void
  setRole: (role: UserRole) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void

  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, role?: UserRole, isOrgActive?: boolean) => Promise<AuthUser>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      role: null,
      error: null,

      setUser: (user, accessToken) => {
        const currentUser = get().user
        
        // If we are logging out, or switching to an entirely different user account,
        // we MUST clear the React Query cache so the old user's data doesn't persist.
        if (user === null || (user && currentUser && user.id !== currentUser.id)) {
          if (typeof window !== 'undefined') {
            const { queryClient } = require('@/lib/queryClient')
            queryClient.clear()
          }
        }

        if (accessToken) tokenStore.set(accessToken)
        
        // Auto-sync role based on user's flags if they are logged in
        if (user) {
          const currentRole = get().role
          // If the database says they are an organization user, upgrade them if they are still 'personal' or null
          if (user.isOrgActive && currentRole !== 'organization') {
             get().setRole('organization')
          }
        }

        set({
          user,
          accessToken: accessToken ?? null,
          isAuthenticated: !!user,
        })
      },

      updateUser: (newData) => {
          set((state) => ({
              user: state.user ? { ...state.user, ...newData } : null
          }))
      },

      setProfile: (profile) => set({ profile }),

      setRole: (role) => {
        // Mirror role into cookie so middleware can gate routes server-side.
        if (typeof document !== 'undefined') {
          if (role) {
            document.cookie = `gaffer-user-role=${role}; path=/; max-age=31536000; SameSite=Lax`
          } else {
            document.cookie = `gaffer-user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
          }
        }
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
          
          // Auto-sync the UI role to whatever the user last used on the backend
          // Defaults to personal if completely missing
          const syncedRole: UserRole = res.user?.lastRole === 'organization' ? 'organization' : 'personal'
          
          if (typeof document !== 'undefined') {
            document.cookie = `gaffer-user-role=${syncedRole}; path=/; max-age=31536000; SameSite=Lax`
          }

          set({
            user: res.user,
            role: syncedRole,
            accessToken: res.accessToken,
            isAuthenticated: true,
            error: null,
          })
        } catch (err: unknown) {
          const msg = err instanceof ApiError
            ? translateError(err.code, err.message)
            : 'Login failed. Please try again.'
          set({ error: msg })
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (email, password, role, isOrgActive) => {
        set({ isLoading: true, error: null })
        try {
          const apiRole = (role === 'personal' || role === 'organization') ? role : undefined
          const res = await register(email, password, apiRole, isOrgActive)
          if (!res.user) {
            throw new Error('Registration succeeded but user payload was missing.')
          }
          tokenStore.set(res.accessToken)

          if (typeof window !== 'undefined') {
            const { queryClient } = require('@/lib/queryClient')
            queryClient.clear()
          }

          set({
            user: res.user,
            role: res.user?.lastRole || null,
            accessToken: res.accessToken,
            isAuthenticated: true,
            error: null,
          })
          return res.user
        } catch (err: unknown) {
          const msg = err instanceof ApiError
            ? translateError(err.code, err.message)
            : 'Registration failed. Please try again.'
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
          if (typeof document !== 'undefined') {
            document.cookie = 'gaffer-user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'
          }
          if (typeof window !== 'undefined') {
            const { queryClient } = require('@/lib/queryClient')
            queryClient.clear()
          }
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
      // Persist just enough for instant UI hydration while the startup refresh is
      // in-flight. The access token is intentionally excluded:
      //   1. It is a short-lived JWT — it will be expired by the next app open.
      //   2. Persisting it created a false "we already have a token" signal that
      //      caused useAuthListener to skip /auth/refresh on startup, which is
      //      the root cause of users being logged out on every reopen.
      //   3. Storing JWTs in localStorage is an XSS risk — keep them in memory only.
      // The authoritative token is always obtained from /auth/refresh on mount.
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        role: state.role,
      }),
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
