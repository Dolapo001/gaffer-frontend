'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Link from 'next/link'
import { useUIStore } from '@/store/uiStore'
import { BottomNavbar } from '@/components/BottomNavbar'

// --- Custom Premium Icons ---
const HomeIcon = ({ className, size, fill, strokeWidth }: any) => (
  <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill={fill || 'none'} xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M3 9.5L12 4L21 9.5V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9.5Z" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const TrophyIcon = ({ className, size, fill, strokeWidth }: any) => (
  <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill={fill || 'none'} xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M8 21H16" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 17V21" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 4H17C17 4 19 4 19 9C19 14 12 17 12 17C12 17 5 14 5 9C5 4 7 4 7 4Z" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const NewsIcon = ({ className, size, fill, strokeWidth }: any) => (
  <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill={fill || 'none'} xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4 22H20C21.1046 22 22 21.1046 22 20V6C22 4.89543 21.1046 4 20 4H12L10 2H4C2.89543 2 2 2.89543 2 4V20C2 21.1046 2.89543 22 4 22Z" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 10H8" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 14H8" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 18H8" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const UsersIcon = ({ className, size, fill, strokeWidth }: any) => (
  <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill={fill || 'none'} xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const DEFAULT_NAV = [
  { href: '/app/dashboard', icon: HomeIcon,      label: 'Home'    },
  { href: '/app/league',    icon: TrophyIcon,    label: 'League'  },
  { href: '/app/news',      icon: NewsIcon, label: 'News'    },
]

// Paths that mean the user has intentionally left the competition context
const EXIT_PATHS = ['/app/dashboard', '/app/league']

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isReady } = useAuthGuard('personal')
  const { activeCompetitionId, clearActiveCompetition } = useUIStore()

  // Clear competition context when the user explicitly navigates away
  useEffect(() => {
    const isExiting = EXIT_PATHS.some((p) => pathname === p)
    if (isExiting) clearActiveCompetition()
  }, [pathname])

  const navItems = activeCompetitionId
    ? [
        { href: '/app/dashboard',                                          icon: HomeIcon,      label: 'Home'    },
        { href: `/app/fantasy?competitionId=${activeCompetitionId}`,       icon: UsersIcon,     label: 'Fantasy' },
        { href: `/app/league/${activeCompetitionId}`,                      icon: TrophyIcon,    label: 'League'  },
        { href: '/app/news',                                               icon: NewsIcon, label: 'News'    },
      ]
    : DEFAULT_NAV

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
    <div className="min-h-dvh flex flex-col overflow-x-hidden">
        <ErrorBoundary>
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col relative"
          >
            {children}
          </motion.main>
        </ErrorBoundary>

        <BottomNavbar items={navItems} id="global-nav-bar" />
      </div>
  )
}
