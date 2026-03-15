'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { isStandalone } from '@/lib/pwa'
import { useAuthStore } from '@/store/authStore'

export default function SplashPage() {
  const router = useRouter()
  const { isAuthenticated, role } = useAuthStore()

  useEffect(() => {
    // If not in standalone mode, redirect to landing
    if (!isStandalone()) {
      router.replace('/')
      return
    }

    const timer = setTimeout(() => {
      if (isAuthenticated) {
        // Already logged in — go to correct dashboard
        router.replace(role === 'organization' ? '/admin' : '/app/dashboard')
      } else {
        router.replace('/onboarding/welcome')
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [router, isAuthenticated, role])

  return (
    <div className="min-h-screen bg-gaffer-bg flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-4"
      >
        {/* Logo */}
        <div className="font-display font-black text-6xl tracking-wider">
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            style={{ color: '#FF6B00' }}
          >G</motion.span>
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18 }}
            style={{ color: '#FF7A00' }}
          >A</motion.span>
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.26 }}
            style={{ color: '#FF5500' }}
          >F</motion.span>
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.34 }}
            style={{ color: '#EE3A00' }}
          >F</motion.span>
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.42 }}
            style={{ color: '#E02000' }}
          >E</motion.span>
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.50 }}
            style={{ color: '#CC1500' }}
          >R</motion.span>
        </div>

        {/* Loading dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
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
