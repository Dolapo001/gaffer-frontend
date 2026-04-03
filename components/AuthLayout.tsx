'use client'

import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

interface AuthLayoutProps {
  children: ReactNode
  showBack?: boolean
  backHref?: string
  title?: string
  subtitle?: string
  className?: string
}

export function AuthLayout({
  children,
  showBack = false,
  backHref,
  title,
  subtitle,
  className = '',
}: AuthLayoutProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gaffer-bg flex flex-col">
      {/* Safe area top */}
      <div className="h-safe-top" />

      {/* Header */}
      {(showBack || title) && (
        <div className="flex items-center gap-3 px-6 pt-4 pb-2">
          {showBack && (
            <button
              onClick={() => backHref ? router.push(backHref) : router.back()}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-gaffer-card border border-gaffer-border text-white hover:bg-gaffer-border transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          {title && (
            <div className="text-xs text-gaffer-muted font-body">
              {title}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className={`flex-1 flex flex-col px-6 pb-8 ${className}`}
      >
        {subtitle && (
          <p className="text-gaffer-muted font-body text-sm mb-6">
            {subtitle}
          </p>
        )}
        {children}
      </motion.main>
    </div>
  )
}
