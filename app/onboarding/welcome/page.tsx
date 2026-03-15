'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { isStandalone } from '@/lib/pwa'
import { GradientButton } from '@/components/GradientButton'

export default function WelcomePage() {
  const router = useRouter()

  useEffect(() => {
    if (!isStandalone()) {
      router.replace('/')
    }
  }, [router])

  return (
    <div className="relative min-h-screen bg-gaffer-bg overflow-hidden flex flex-col">
      {/* Hero background image */}
      <div className="absolute inset-0">
        {/* Using CSS background since we embed the image as data URL equivalent */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/images/hero-bg.jpg')`,
          }}
        />
        {/* Dark overlay gradient — bottom heavy so text is legible */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-gaffer-bg" />
        <div className="absolute inset-0 bg-gradient-to-t from-gaffer-bg via-gaffer-bg/60 to-transparent" style={{ top: '40%' }} />
      </div>

      {/* Top safe area */}
      <div className="relative z-10 pt-safe" />

      {/* Content — bottom section */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-6 pb-10 pt-[55vh]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="space-y-6"
        >
          {/* Headline */}
          <div>
            <h1 className="font-display font-black text-5xl leading-none text-white tracking-tight">
              DOMINATE
            </h1>
            <h1 className="font-display font-black text-5xl leading-none text-gradient-orange tracking-tight">
              THE FIELD
            </h1>
          </div>

          {/* Subtitle */}
          <p className="font-body text-white/70 text-sm leading-relaxed max-w-xs">
            The ultimate sports management platform for athletes, coaches, and organizations ready to dominate.
          </p>

          {/* CTAs */}
          <div className="space-y-3 pt-2">
            <GradientButton
              variant="outline"
              onClick={() => router.push('/onboarding/role-select')}
            >
              Get Started
            </GradientButton>
            <GradientButton
              variant="primary"
              onClick={() => router.push('/auth/login')}
            >
              Login
            </GradientButton>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
