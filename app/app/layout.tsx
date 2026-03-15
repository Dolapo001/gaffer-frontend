'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useAuthListener } from '@/hooks/useAuthListener'
import { useStandaloneGuard } from '@/hooks/useStandaloneGuard'
import { Home, Trophy, Newspaper } from 'lucide-react'
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
    { href: '/app/league', icon: Trophy, label: 'League' },
    { href: '/app/news', icon: Newspaper, label: 'News' },
  ]

  return (
    <QueryProvider>
      <div className="min-h-screen bg-gaffer-bg flex flex-col pb-safe">
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 pb-20"
        >
          {children}
        </motion.main>

        {/* Bottom navigation */}
        <nav className="fixed bottom-0 inset-x-0 bg-gaffer-surface/95 backdrop-blur-xl border-t border-gaffer-border pb-safe z-50">
          <div className="flex items-center justify-around px-2 py-2">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all"
                >
                  {isActive ? (
                    <div className="w-10 h-10 rounded-xl bg-orange-gradient-btn flex items-center justify-center shadow-orange-glow">
                      <item.icon size={20} strokeWidth={2} className="text-white" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center">
                      <item.icon size={22} strokeWidth={1.5} className="text-gaffer-muted" />
                    </div>
                  )}
                  <span
                    className={`text-[10px] font-body font-medium ${
                      isActive ? 'text-gaffer-orange' : 'text-gaffer-muted'
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </QueryProvider>
  )
}
