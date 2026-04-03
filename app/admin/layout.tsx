'use client'

import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import Link from 'next/link'
import { ErrorBoundary } from '@/components/ErrorBoundary'
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

const CalendarClockIcon = ({ className, size, fill, strokeWidth }: any) => (
  <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill={fill || 'none'} xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M21 10.5V6C21 4.89543 20.1046 4 19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H11.5" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 2V6" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 2V6" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 10H21" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="18" cy="18" r="5" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18 15V18L20 19" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round"/>
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

const OrganiseIcon = ({ className, size, fill, strokeWidth }: any) => (
  <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill={fill || 'none'} xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="8" y="2" width="8" height="4" rx="1" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 11h4" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 16h4" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="8" cy="11" r="1.5" stroke="currentColor" strokeWidth={strokeWidth ? strokeWidth / 2 : 1} strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="8" cy="16" r="1.5" stroke="currentColor" strokeWidth={strokeWidth ? strokeWidth / 2 : 1} strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const NAV_ITEMS = [
  { href: '/admin', icon: HomeIcon, label: 'Home' },
  { href: '/admin/tournaments', icon: TrophyIcon, label: 'League' },
  { href: '/admin/schedule', icon: CalendarClockIcon, label: 'Schedule' },
  { href: '/admin/organise', icon: OrganiseIcon, label: 'Organise' },
  { href: '/admin/news', icon: NewsIcon, label: 'News' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isReady } = useAuthGuard('organization')

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gaffer-bg flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gaffer-border border-t-gaffer-orange rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
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

      <BottomNavbar items={NAV_ITEMS} id="admin-nav-bar" />
    </div>
  )
}
