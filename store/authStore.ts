import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  logoutUser,
  type User,
} from '@/lib/firebase'

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
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      role: null,
      error: null,

      setUser: (user) =>
        set({ user, isAuthenticated: !!user }),

      setRole: (role) =>
        set({ role }),

      setLoading: (isLoading) =>
        set({ isLoading }),

      setError: (error) =>
        set({ error }),

      clearError: () =>
        set({ error: null }),

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const result = await loginWithEmail(email, password)
          set({ user: result.user, isAuthenticated: true })
        } catch (err: unknown) {
          const message = getFirebaseErrorMessage(err)
          set({ error: message })
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      loginWithGoogle: async () => {
        set({ isLoading: true, error: null })
        try {
          const result = await loginWithGoogle()
          set({ user: result.user, isAuthenticated: true })
        } catch (err: unknown) {
          const message = getFirebaseErrorMessage(err)
          set({ error: message })
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const result = await registerWithEmail(email, password)
          set({ user: result.user, isAuthenticated: true })
          return result.user
        } catch (err: unknown) {
          const message = getFirebaseErrorMessage(err)
          set({ error: message })
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      registerWithGoogle: async () => {
        set({ isLoading: true, error: null })
        try {
          const result = await loginWithGoogle()
          set({ user: result.user, isAuthenticated: true })
        } catch (err: unknown) {
          const message = getFirebaseErrorMessage(err)
          set({ error: message })
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
        } catch (err: unknown) {
          const message = getFirebaseErrorMessage(err)
          set({ error: message })
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'gaffer-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        role: state.role,
        // Don't persist user object — Firebase handles session
      }),
    }
  )
)

// Convert Firebase error codes to human-readable messages
function getFirebaseErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: string }).code
    const messages: Record<string, string> = {
      'auth/email-already-in-use': 'This email is already registered.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/weak-password': 'Password must be at least 8 characters.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/popup-closed-by-user': 'Sign-in popup was closed.',
      'auth/cancelled-popup-request': 'Sign-in was cancelled.',
      'auth/network-request-failed': 'Network error. Check your connection.',
      'auth/invalid-credential': 'Invalid credentials. Please try again.',
    }
    return messages[code] || 'An error occurred. Please try again.'
  }
  return 'An unexpected error occurred.'
}
