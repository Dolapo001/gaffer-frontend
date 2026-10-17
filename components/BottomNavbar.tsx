'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Trophy, Newspaper, Gamepad2, Calendar, ShieldCheck } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'

interface NavItem {
  href: string
  icon: any
  label: string
}

interface BottomNavbarProps {
  items: NavItem[]
  id?: string
}

export function BottomNavbar({ items, id }: BottomNavbarProps) {
  const pathname = usePathname()
  const { isNavbarHidden } = useUIStore()

  return (
    <AnimatePresence>
      {!isNavbarHidden && (
        <motion.nav
          id={id}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="flex items-center justify-around px-2"
          style={{
            position: 'fixed',
            // A floating glass pill, inset from the screen edges
            bottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
            left: 12,
            right: 12,
            zIndex: 100,
            height: 72,
            // Frosted glass with a gently arched top: what scrolls underneath shows through, blurred
            background: 'linear-gradient(180deg, rgba(48,52,74,0.55) 0%, rgba(24,25,40,0.72) 100%)',
            backdropFilter: 'blur(22px) saturate(170%)',
            WebkitBackdropFilter: 'blur(22px) saturate(170%)',
            borderRadius: '50% 50% 34px 34px / 20px 20px 34px 34px',
            border: '1px solid rgba(255,255,255,0.14)',
            boxShadow: '0 14px 34px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
        {items.map((item) => {
          // Compute active state inline — no hook inside a loop
          const itemPath = item.href.split('?')[0]
          let isActive: boolean
          if (itemPath === '/app/dashboard' || itemPath === '/admin') {
            isActive = pathname === itemPath
          } else if (pathname === itemPath) {
            isActive = true
          } else if (!pathname.startsWith(itemPath)) {
            isActive = false
          } else {
            // nested route: only active if no more-specific sibling matches
            const hasMoreSpecificMatch = items.some((other) => {
              const otherPath = other.href.split('?')[0]
              return otherPath.length > itemPath.length && pathname.startsWith(otherPath)
            })
            isActive = !hasMoreSpecificMatch
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 min-w-0 px-1 flex flex-col items-center justify-center gap-1 transition-all h-full relative"
            >
              <div className="flex items-center justify-center">
                <item.icon
                  size={24}
                  strokeWidth={isActive ? 2 : 1.5}
                  fill={isActive ? 'currentColor' : 'none'}
                  className={`transition-colors duration-200 ${isActive ? 'text-[#ff6b00]' : 'text-[#7A8293] hover:text-[#9EA5B4]'}`}
                />
              </div>

              <span
                className={`text-[10px] sm:text-[11px] font-medium tracking-tight truncate max-w-full px-0.5 transition-colors duration-200 ${
                  isActive ? 'text-[#ff6b00]' : 'text-[#7A8293] hover:text-[#9EA5B4]'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </motion.nav>
      )}
    </AnimatePresence>
  )
}
