'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { isStandalone } from '@/lib/pwa'
import { useAuthStore } from '@/store/authStore'
import { useAuthListener } from '@/hooks/useAuthListener'
import Link from 'next/link'
import { LayoutDashboard, Trophy, Users } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/tournaments', icon: Trophy, label: 'Tournaments' },
  { href: '/admin/players', icon: Users, label: 'Players' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading } = useAuthStore()
  useAuthListener()

  useEffect(() => {
    if (!isStandalone()) router.replace('/')
  }, [router])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/auth/login')
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gaffer-bg flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gaffer-border border-t-gaffer-orange rounded-full animate-spin" />
      </div>
    )
  }
  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-gaffer-bg flex flex-col">
      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-50">
        <div className="bg-gaffer-surface/95 backdrop-blur-xl border-t border-gaffer-border pb-safe">
          <div className="flex items-center justify-around px-4 py-2">
            {NAV_ITEMS.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
              return (
                <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 px-5 py-2 relative">
                  {isActive && (
                    <motion.div layoutId="admin-tab-pill" className="absolute inset-0 rounded-2xl bg-gaffer-orange/10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />
                  )}
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.6}
                    className={`relative z-10 transition-colors duration-200 ${isActive ? 'text-gaffer-orange' : 'text-gaffer-subtle'}`} />
                  <span className={`relative z-10 text-[10px] font-body font-semibold transition-colors duration-200 ${isActive ? 'text-gaffer-orange' : 'text-gaffer-subtle'}`}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </div>
  )
}
