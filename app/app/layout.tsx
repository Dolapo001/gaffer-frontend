'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useNotificationSocket } from '@/hooks/useNotificationSocket'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Home, Trophy, Newspaper, Users } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'

// useAuthListener is called once at the root via AuthProvider — not here.

import { BottomNavbar } from '@/components/BottomNavbar'

// Exact paths that mean the user has intentionally left the competition context.
// Note: '/app/league/:id' is the league home and must NOT clear the context.
// '/app/fantasy' (the bare picker) is included so browsing it after visiting a
// league/competition correctly resets nav highlighting instead of leaving a
// stale activeCompetitionId pinned to whatever was last visited.
const EXIT_PATHS = ['/app/dashboard', '/app/league', '/app/fantasy']

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isReady } = useAuthGuard('personal')
  // Realtime socket for every page in this area (live scores, notifications),
  // not only pages that happen to render the NotificationBell
  useNotificationSocket()
  const { activeCompetitionId, clearActiveCompetition } = useUIStore()

  // Clear competition context when the user explicitly navigates away
  useEffect(() => {
    const isExiting = EXIT_PATHS.some((p) => pathname === p)
    if (isExiting) clearActiveCompetition()
  }, [pathname])

  // Fantasy is always a primary destination: the picker when no competition
  // is active, or straight into that competition's fantasy tabs when one is.
  const navItems = activeCompetitionId
    ? [
        // Home → league Overview tab
        { href: `/app/league/${activeCompetitionId}`,           icon: Home,      label: 'Home'    },
        { href: `/app/fantasy/${activeCompetitionId}`,          icon: Users,     label: 'Fantasy' },
        // League → league Standings tab (closest match to the old "details" destination)
        { href: `/app/league/${activeCompetitionId}/standings`, icon: Trophy,    label: 'League'  },
        { href: '/app/news',                                    icon: Newspaper, label: 'News'    },
      ]
    : [
        { href: '/app/dashboard', icon: Home,      label: 'Home'    },
        { href: '/app/fantasy',   icon: Users,     label: 'Fantasy' },
        { href: '/app/league',    icon: Trophy,    label: 'League'  },
        { href: '/app/news',      icon: Newspaper, label: 'News'    },
      ]

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gaffer-bg flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-10 h-10 border-2 border-gaffer-border border-t-gaffer-orange rounded-full animate-spin mx-auto" />
          <p className="text-gaffer-muted text-sm font-body">Loading...</p>
        </div>
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
            style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}
          >
            {children}
          </motion.main>
        </ErrorBoundary>

        <BottomNavbar items={navItems} id="global-nav-bar" />
      </div>
  )
}
