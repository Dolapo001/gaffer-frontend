import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  logoutUser,
  type User,
} from '@/lib/auth'

export type UserRole = 'personal' | 'organization' | null

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  role: UserRole
  error: string | null

  // Actions
  setUser: (user: User | null) => void
  setRole: (role: UserRole) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  register: (email: string, password: string) => Promise<User>
  registerWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      role: null,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setRole: (role) => set({ role }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { user } = await loginWithEmail(email, password)
          set({ user: user as User, isAuthenticated: true })
        } catch (err: any) {
          set({ error: err.message || 'Login failed' })
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      loginWithGoogle: async () => {
        set({ isLoading: true, error: null })
        try {
          const { user } = await loginWithGoogle()
          set({ user: user as User, isAuthenticated: true })
        } catch (err: any) {
          set({ error: err.message || 'Google login failed' })
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { user } = await registerWithEmail(email, password)
          set({ user: user as User, isAuthenticated: true })
          return user as User
        } catch (err: any) {
          set({ error: err.message || 'Registration failed' })
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      registerWithGoogle: async () => {
        set({ isLoading: true, error: null })
        try {
          const { user } = await loginWithGoogle()
          set({ user: user as User, isAuthenticated: true })
        } catch (err: any) {
          set({ error: err.message || 'Google registration failed' })
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null })
        try {
          await logoutUser()
          set({ user: null, isAuthenticated: false, role: null })
        } catch (err: any) {
          set({ error: err.message || 'Logout failed' })
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'gaffer-auth',
      storage: createJSONStorage(() => localStorage),
      // Persist role and basic auth flag; Firebase SDK handles the actual session token
      partialize: (state) => ({
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

