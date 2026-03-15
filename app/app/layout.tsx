'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useAuthListener } from '@/hooks/useAuthListener'
import { Home, User, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading, logout } = useAuthStore()

  useAuthListener()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
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
    { href: '/app/profile', icon: User, label: 'Profile' },
    { href: '/app/settings', icon: Settings, label: 'Settings' },
  ]

  return (
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
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                  isActive ? 'text-gaffer-orange' : 'text-gaffer-muted hover:text-white'
                }`}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                <span
                  className={`text-[10px] font-body font-medium ${isActive ? 'text-gaffer-orange' : ''}`}
                >
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-1 w-1 h-1 rounded-full bg-gaffer-orange"
                  />
                )}
              </Link>
            )
          })}
          <button
            onClick={() => logout().then(() => router.replace('/onboarding/welcome'))}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-gaffer-muted hover:text-red-400 transition-all"
          >
            <LogOut size={22} strokeWidth={1.5} />
            <span className="text-[10px] font-body font-medium">Logout</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
