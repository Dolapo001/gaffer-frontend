'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

const NAV = [
  { href: '/hq', label: 'Overview' },
  { href: '/hq/organisations', label: 'Organisations' },
  { href: '/hq/users', label: 'Users' },
  { href: '/hq/tournaments', label: 'Tournaments' },
  { href: '/hq/payments', label: 'Payments' },
  { href: '/hq/content', label: 'Moderation' },
  { href: '/hq/news', label: 'News' },
  { href: '/hq/chips', label: 'Chips' },
  { href: '/hq/welcome', label: 'Welcome message' },
  { href: '/hq/audit', label: 'Audit log' },
]

/**
 * Gaffer HQ shell. Only users with the platform admin role get past this layout; the API enforces the same rule,
 * so hiding the pages here is a courtesy, not the security.
 */
export default function HqLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoading, isAuthenticated, logout } = useAuthStore()
  const isLogin = pathname === '/hq/login'
  const isHq = isAuthenticated && user?.platformRole === 'platform_admin'

  useEffect(() => {
    if (!isLogin && !isLoading && !isHq) router.replace('/hq/login')
  }, [isLogin, isLoading, isHq, router])

  if (isLogin) return <>{children}</>

  if (isLoading || !isHq) {
    return (
      <div className="min-h-screen bg-gaffer-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gaffer-border border-t-gaffer-orange rounded-full animate-spin" aria-label="Loading" />
      </div>
    )
  }

  const signOut = async () => {
    await logout()
    router.replace('/hq/login')
  }

  return (
    <div className="min-h-screen bg-gaffer-bg text-white md:flex">
      <aside className="md:w-60 md:min-h-screen md:border-r border-b md:border-b-0 border-gaffer-border bg-gaffer-surface">
        <div className="flex items-center justify-between md:block px-4 py-4">
          <div>
            <p className="font-display font-extrabold text-xl tracking-wide">GAFFER HQ</p>
            <p className="text-xs text-gaffer-muted font-body truncate max-w-[12rem]">{user?.email}</p>
          </div>
          <button onClick={signOut} className="md:mt-4 text-sm font-body text-gaffer-muted hover:text-white">
            Sign out
          </button>
        </div>
        <nav className="flex md:flex-col gap-1 px-2 pb-3 md:pb-0 overflow-x-auto" aria-label="HQ">
          {NAV.map((item) => {
            const active = item.href === '/hq' ? pathname === '/hq' : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`whitespace-nowrap rounded-xl px-3 py-2 font-body font-semibold text-sm ${
                  active ? 'bg-gaffer-orange text-black' : 'text-gaffer-muted hover:text-white hover:bg-gaffer-card'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
      <main className="flex-1 min-w-0 p-4 md:p-8">{children}</main>
    </div>
  )
}
