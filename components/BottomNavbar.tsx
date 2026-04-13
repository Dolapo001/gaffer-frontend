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
        <motion.div
          id={id}
          initial={{ y: 100, opacity: 0, x: '-50%' }}
          animate={{ y: 0, opacity: 1, x: '-50%' }}
          exit={{ y: 100, opacity: 0, x: '-50%' }}
          className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-[100] pointer-events-none flex justify-center w-[calc(100%-32px)] md:w-[460px] max-w-[460px]"
        >
          <nav
            className="flex items-center justify-around h-[72px] w-full pointer-events-auto bg-[#1d1f2e] border border-white/5 shadow-2xl rounded-full px-2 transition-all"
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
      </nav>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
