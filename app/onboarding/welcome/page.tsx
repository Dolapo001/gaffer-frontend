'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { GradientButton } from '@/components/GradientButton'

export default function WelcomePage() {
  const router = useRouter()

  return (
    <div className="relative min-h-screen bg-gaffer-bg overflow-hidden flex flex-col">
      {/* Hero background image */}
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero-bg.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Single gradient overlay — dark at bottom for text, semi-transparent top to show image */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-gaffer-bg" />
      </div>

      {/* Safe area spacer */}
      <div className="relative z-10 pt-safe" />

      {/* Bottom content */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-6 pb-10 pt-[52vh]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="space-y-5"
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
            lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua.
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
