'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useAuthListener } from '@/hooks/useAuthListener'
import { useStandaloneGuard } from '@/hooks/useStandaloneGuard'
import { Home, Trophy, Newspaper, Gamepad2 } from 'lucide-react'
import Link from 'next/link'
import { QueryProvider } from '@/components/QueryProvider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading } = useAuthStore()
  const isReady = useStandaloneGuard()

  useAuthListener()

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

  const navItems = [
    { href: '/app/dashboard', icon: Home, label: 'Home' },
    { href: '/app/fantasy', icon: Gamepad2, label: 'Fantasy' },
    { href: '/app/league', icon: Trophy, label: 'League' },
    { href: '/app/news', icon: Newspaper, label: 'News' },
  ]

  return (
    <QueryProvider>
      <div className="min-h-screen bg-[#181928] flex flex-col overflow-x-hidden">
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 pb-32"
        >
          {children}
        </motion.main>

        {/* Bottom navigation (Premium Pill Design) */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <nav 
            className="flex items-center justify-around px-6 backdrop-blur-2xl pointer-events-auto"
            style={{ 
              width: '352px', 
              height: '89px',
              borderRadius: '104.45px',
              backgroundColor: 'rgba(15, 23, 43, 0.2)',
              border: '1.23px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0px 20px 40px rgba(0, 0, 0, 0.4)'
            }}
          >
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
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
                    className={`text-[10px] font-medium tracking-wide ${
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
    </QueryProvider>
  )
}
