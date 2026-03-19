'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useStandaloneGuard } from '@/hooks/useStandaloneGuard'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Home, Trophy, Newspaper, Gamepad2 } from 'lucide-react'
import Link from 'next/link'

// useAuthListener is called once at the root via AuthProvider — not here.

import { BottomNavbar } from '@/components/BottomNavbar'

const NAV_ITEMS = [
  { href: '/app/dashboard', icon: Home, label: 'Home' },
  { href: '/app/fantasy', icon: Gamepad2, label: 'Fantasy' },
  { href: '/app/league', icon: Trophy, label: 'League' },
  { href: '/app/news', icon: Newspaper, label: 'News' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading } = useAuthStore()
  const isReady = useStandaloneGuard()

  useEffect(() => {
    if (isReady && !isLoading && !isAuthenticated) {
      router.replace('/auth/login')
    }
  }, [isReady, isAuthenticated, isLoading, router])

  if (!isReady || isLoading) {
    return (
      <div className="min-h-screen bg-gaffer-bg flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-10 h-10 border-2 border-gaffer-border border-t-gaffer-orange rounded-full animate-spin mx-auto" />
          <p className="text-gaffer-muted text-sm font-body">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-[#181928] flex flex-col overflow-x-hidden">
        <ErrorBoundary>
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 pb-32"
          >
            {children}
          </motion.main>
        </ErrorBoundary>

        <BottomNavbar items={NAV_ITEMS} id="global-nav-bar" />
      </div>
  )
}
