'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

function GradientBorderButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative w-full p-[2px] rounded-xl bg-gradient-to-r from-[#FF8904] to-[#E7000B]"
    >
      <div className="w-full h-full bg-[#181928] rounded-[10px] py-4 text-center font-chakra font-bold text-lg tracking-wide text-white">
        {children}
      </div>
    </button>
  )
}

export default function WelcomePage() {
  const router = useRouter()

  return (
    <div className="relative min-h-screen bg-[#181928] overflow-hidden flex flex-col">
      
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="/images/hero-bg.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-[#181928]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-6 pb-14 pt-[52vh]">
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          
          {/* Heading */}
          <div className="space-y-1">
            <h1 className="font-chakra font-bold text-[48px] leading-[44px] text-white tracking-[2px] uppercase">
              DOMINATE
            </h1>

            <h1 className="font-chakra font-bold text-[48px] leading-[44px] tracking-[2px] uppercase bg-gradient-to-r from-[#FF8904] to-[#E7000B] bg-clip-text text-transparent">
              THE FIELD
            </h1>
          </div>

          {/* Subtitle */}
          <p className="font-chakra text-white/80 text-sm leading-relaxed max-w-xs font-medium">
            Build your team, dominate your fantasy league, track every match, and stay ahead of the competition.
          </p>

          {/* CTA */}
          <div className="space-y-4 pt-4">
            
            {/* Primary */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/onboarding/role-select')}
              className="w-full bg-white text-black py-4 rounded-xl font-chakra font-bold text-lg tracking-wide shadow-lg"
            >
              GET STARTED
            </motion.button>

            {/* Gradient Border (matches your screenshot spec) */}
            <motion.div whileTap={{ scale: 0.97 }}>
              <GradientBorderButton onClick={() => router.push('/auth/login')}>
                LOGIN
              </GradientBorderButton>
            </motion.div>

          </div>
        </motion.div>
      </div>
    </div>
  )
}