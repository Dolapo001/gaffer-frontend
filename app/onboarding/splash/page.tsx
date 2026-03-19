'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'

export default function SplashPage() {
  const router = useRouter()
  const { isAuthenticated, role, isLoading } = useAuthStore()
  
  useEffect(() => {
    // We want the splash to show for at least 1.5 seconds for branding
    const timer = setTimeout(() => {
      if (!isLoading) {
        if (isAuthenticated) {
          router.replace(role === 'organization' ? '/admin' : '/app/dashboard')
        } else {
          router.replace('/onboarding/welcome')
        }
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [router, isAuthenticated, role, isLoading])

  return (
    <div className="min-h-screen bg-gaffer-bg flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-4"
      >
        {/* Animated logo letter-by-letter */}
        <div className="font-display font-black text-6xl tracking-wider">
          {[
            { char: 'G', color: '#FF6B00' },
            { char: 'A', color: '#FF7A00' },
            { char: 'F', color: '#FF5500' },
            { char: 'F', color: '#EE3A00' },
            { char: 'E', color: '#E02000' },
            { char: 'R', color: '#CC1500' },
          ].map(({ char, color }, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              style={{ color }}
            >
              {char}
            </motion.span>
          ))}
        </div>

        {/* Pulsing dots loader */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex gap-1.5 mt-4"
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
              transition={{
                repeat: Infinity,
                duration: 1.2,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
              className="w-1.5 h-1.5 rounded-full bg-gaffer-orange"
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
