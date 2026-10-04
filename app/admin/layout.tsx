'use client'

import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useNotificationSocket } from '@/hooks/useNotificationSocket'
import Link from 'next/link'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Home, Trophy, CalendarClock, Award, FileText, Users } from 'lucide-react'

import { BottomNavbar } from '@/components/BottomNavbar'

const NAV_ITEMS = [
  { href: '/admin', icon: Home, label: 'Home' },
  { href: '/admin/tournaments', icon: Trophy, label: 'League' },
  { href: '/admin/schedule', icon: CalendarClock, label: 'Schedule' },
  { href: '/admin/organise', icon: Award, label: 'Organize' },
  { href: '/admin/collaborators', icon: Users, label: 'Staff' },
  { href: '/admin/news', icon: FileText, label: 'News' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isReady } = useAuthGuard('organization')
  // Realtime socket for every page in this area (live scores, notifications),
  // not only pages that happen to render the NotificationBell
  useNotificationSocket()

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gaffer-bg flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gaffer-border border-t-gaffer-orange rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#181928] flex flex-col overflow-x-hidden">
      <ErrorBoundary>
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1"
          style={{ paddingBottom: 'calc(88px + env(safe-area-inset-bottom, 16px))' }}
        >
          {children}
        </motion.main>
      </ErrorBoundary>

      <BottomNavbar items={NAV_ITEMS} id="admin-nav-bar" />
    </div>
  )
}
