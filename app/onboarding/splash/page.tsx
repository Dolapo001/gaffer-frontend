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
    <div className="min-h-screen bg-[#181928] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-6"
      >
        {/* Brand Logo */}
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8 }}
           className="relative w-72 h-32"
        >
          <img 
            src="/images/gaffer-logo.png" 
            alt="GAFFER Logo" 
            className="w-full h-full object-contain"
          />
        </motion.div>

        {/* Pulsing dots loader */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex gap-1.5"
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
