'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useNotificationSocket } from '@/hooks/useNotificationSocket'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Home, Trophy, Newspaper, Users } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'

// useAuthListener is called once at the root via AuthProvider — not here.

import { BottomNavbar } from '@/components/BottomNavbar'
import { CompleteAccountPrompt } from '@/components/CompleteAccountPrompt'
import { PushPrompt } from '@/components/notifications/PushPrompt'
import { adjacentTab, startsInsideSideScroller, swipeDirection } from '@/lib/tabSwipe'

// Exact paths that mean the user has intentionally left the competition context.
// Note: '/app/league/:id' is the league home and must NOT clear the context.
// '/app/fantasy' (the bare picker) is included so browsing it after visiting a
// league/competition correctly resets nav highlighting instead of leaving a
// stale activeCompetitionId pinned to whatever was last visited.
const EXIT_PATHS = ['/app/dashboard', '/app/league', '/app/fantasy']

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isReady } = useAuthGuard('personal')
  const touch = useRef<{ x: number; y: number; t: number; ignore: boolean } | null>(null)
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

  // Swipe left or right on a main page to move between Home, Fantasy, League and News
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    touch.current = { x: t.clientX, y: t.clientY, t: Date.now(), ignore: e.touches.length > 1 || startsInsideSideScroller(e.target) }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touch.current
    touch.current = null
    if (!start || start.ignore) return
    const t = e.changedTouches[0]
    const direction = swipeDirection({ dx: t.clientX - start.x, dy: t.clientY - start.y, ms: Date.now() - start.t })
    const target = adjacentTab(navItems.map((i) => i.href), pathname, direction)
    if (target) router.push(target)
  }

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
    <div className="min-h-screen bg-[#181928] flex flex-col overflow-x-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <ErrorBoundary>
          <motion.main
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
            style={{ paddingBottom: 'calc(128px + env(safe-area-inset-bottom, 0px))' }}
          >
            {children}
          </motion.main>
        </ErrorBoundary>

        <PushPrompt />
        <CompleteAccountPrompt />
      <BottomNavbar items={navItems} id="global-nav-bar" />
      </div>
  )
}
