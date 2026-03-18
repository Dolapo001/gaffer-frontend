'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useAuthListener } from '@/hooks/useAuthListener'
import { isStandalone } from '@/lib/pwa'

import { usePWAInstall } from '@/hooks/usePWAInstall'

/* --- Marketing Components --- */
import { Navbar } from '@/components/marketing/Navbar'
import { Hero } from '@/components/marketing/Hero'
import { StatsBar } from '@/components/marketing/StatsBar'
import { Features } from '@/components/marketing/Features'
import { ProductShowcase } from '@/components/marketing/ProductShowcase'
import { ForClubs } from '@/components/marketing/ForClubs'
import { Testimonials } from '@/components/marketing/Testimonials'
import { Pricing } from '@/components/marketing/Pricing'
import { FinalCTA } from '@/components/marketing/FinalCTA'
import { Footer } from '@/components/marketing/Footer'

export default function LandingPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  
  // Initialize PWA hook to capture install prompt event early
  usePWAInstall()

  useEffect(() => {
    // Redirect if already in PWA/Standalone mode
    if (isStandalone()) {
      router.replace('/onboarding/splash')
      return
    }
    setChecking(false)
  }, [router])

  if (checking) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-orange-gaffer/20 border-t-orange-gaffer rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#222232] text-white antialiased selection:bg-orange-gaffer/30 overflow-x-hidden pt-20 relative">
      
      {/* ── Main Gaffer Background ── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-[0.45] mix-blend-luminosity"
          style={{ backgroundImage: 'url("/images/fantasy_bg.png")' }}
        />
        {/* Deep vignette and gradient system */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0C10] via-transparent to-[#0A0C10] opacity-80" />
        <div className="absolute inset-0 bg-[#222232]/40 mix-blend-multiply" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0A0C10] to-transparent" />
      </div>

      {/* ── Global Animated Background Noise ── */}
      <div className="fixed inset-0 pointer-events-none z-[1] opacity-20">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      </div>

      <Navbar />

      <div className="relative z-10 w-full overflow-hidden">
        {/* Sections */}
        <Hero />
        
        <StatsBar />
        
        <Features />
        
        <ProductShowcase />
        
        <ForClubs />
        
        <Testimonials />
        
        <Pricing />
        
        <FinalCTA />
        
        <Footer />
      </div>

    </main>
  )
}
