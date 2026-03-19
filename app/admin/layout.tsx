'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'
import { useStandaloneGuard } from '@/hooks/useStandaloneGuard'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Home, Trophy, CalendarClock, Award, FileText } from 'lucide-react'

import { BottomNavbar } from '@/components/BottomNavbar'

const NAV_ITEMS = [
  { href: '/admin', icon: Home, label: 'Home' },
  { href: '/admin/tournaments', icon: Trophy, label: 'League' },
  { href: '/admin/schedule', icon: CalendarClock, label: 'Schedule' },
  { href: '/admin/organise', icon: Award, label: 'Organise' },
  { href: '/admin/news', icon: FileText, label: 'News' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading, role } = useAuthStore()
  const isReady = useStandaloneGuard()

  useEffect(() => {
    if (!isReady || isLoading) return
    if (!isAuthenticated) {
      router.replace('/auth/login')
    } else if (role !== 'organization') {
      // Personal users have no business on admin routes
      router.replace('/app/dashboard')
    }
  }, [isReady, isAuthenticated, isLoading, role, router])

  if (!isReady || isLoading) {
    return (
      <div className="min-h-screen bg-gaffer-bg flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gaffer-border border-t-gaffer-orange rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated || role !== 'organization') return null

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

      <BottomNavbar items={NAV_ITEMS} id="admin-nav-bar" />
    </div>
  )
}
