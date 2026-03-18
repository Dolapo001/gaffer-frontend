'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useAuthListener } from '@/hooks/useAuthListener'
import Link from 'next/link'
import { useStandaloneGuard } from '@/hooks/useStandaloneGuard'
import { Home, Trophy, Newspaper, Calendar, ShieldCheck } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin', icon: Home, label: 'Home', exact: true },
  { href: '/admin/tournaments', icon: Trophy, label: 'League' },
  { href: '/admin/schedule', icon: Calendar, label: 'Schedule' },
  { href: '/admin/organise', icon: ShieldCheck, label: 'Organise' },
  { href: '/admin/news', icon: Newspaper, label: 'News' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading } = useAuthStore()
  const isReady = useStandaloneGuard()
  useAuthListener()

  useEffect(() => {
    if (isReady && !isLoading && !isAuthenticated) router.replace('/auth/login')
  }, [isReady, isAuthenticated, isLoading, router])

  if (!isReady || isLoading) {
    return (
      <div className="min-h-screen bg-gaffer-bg flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gaffer-border border-t-gaffer-orange rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-[#0F111A] flex flex-col">
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 pb-40"
      >
        {children}
      </motion.main>

      {/* Bottom navigation (Premium Pill Design) */}
      <div id="admin-nav-bar" className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-opacity duration-300">
        <nav 
          className="flex items-center justify-between px-8 backdrop-blur-2xl pointer-events-auto"
          style={{ 
            width: 'min(400px, calc(100vw - 32px))',
            height: '89px',
            borderRadius: '104.45px',
            backgroundColor: 'rgba(15, 23, 43, 0.2)',
            border: '1.23px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0px 20px 40px rgba(0, 0, 0, 0.4)'
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 transition-all"
              >
                <div className="w-10 h-10 flex items-center justify-center relative">
                  <item.icon 
                    size={24} 
                    strokeWidth={isActive ? 2.5 : 2} 
                    className={isActive ? 'text-[#FF4D00]' : 'text-white/40'} 
                  />
                  {isActive && (
                    <div className="absolute -top-1 w-1 h-1 bg-[#FF4D00] rounded-full shadow-[0_0_8px_#FF4D00]" />
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium tracking-wide uppercase ${
                    isActive ? 'text-[#FF4D00]' : 'text-white/40'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
