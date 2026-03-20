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
          initial={{ y: 40, opacity: 0, x: '-50%' }}
          animate={{ y: 0, opacity: 1, x: '-50%' }}
          exit={{ y: 40, opacity: 0, x: '-50%' }}
          className="fixed bottom-8 left-1/2 z-[100] pointer-events-none flex justify-center"
        >
          <nav 
            className="flex items-center justify-around h-[82px] backdrop-blur-3xl pointer-events-auto border border-white/10 bg-[#181928]/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all"
            style={{ 
              width: 'min(500px, calc(100vw - 32px))',
              borderRadius: '80px',
            }}
          >
        {items.map((item) => {
          const isActive = item.href === '/admin' || item.href === '/app/dashboard' 
            ? pathname === item.href 
            : pathname.startsWith(item.href)
            
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center gap-1.5 transition-all py-2"
            >
              <div className="w-10 h-10 flex items-center justify-center relative">
                <item.icon 
                  size={22} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  fill={isActive ? 'currentColor' : 'none'}
                  className={isActive ? 'text-[#FF6B00]' : 'text-white/20'} 
                />
                {isActive && (
                  <motion.div 
                    layoutId="activeDot"
                    className="absolute -top-1 w-1.5 h-1.5 bg-[#FF6B00] rounded-full shadow-[0_0_12px_#FF6B00]" 
                  />
                )}
              </div>
              <span
                className={`${items.length > 5 ? 'text-[8px]' : 'text-[9px]'} font-chakra font-black tracking-widest uppercase transition-colors ${
                  isActive ? 'text-[#FF6B00]' : 'text-white/20'
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
