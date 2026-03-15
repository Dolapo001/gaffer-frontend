'use client'

import { useAuthListener } from '@/hooks/useAuthListener'

/**
 * Mounts the Firebase onAuthStateChanged listener for the entire app.
 * Place this near the root so auth state is always up-to-date.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useAuthListener()
  return <>{children}</>
}
