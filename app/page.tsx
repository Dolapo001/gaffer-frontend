'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useAuthListener } from '@/hooks/useAuthListener'
import { GafferLogo } from '@/components/GafferLogo'
import {
  isStandalone,
  getDeferredPrompt,
  triggerInstallPrompt,
} from '@/lib/pwa'
import {
  Download,
  Smartphone,
  Check,
} from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const { isAuthenticated, role, isLoading } = useAuthStore()
  useAuthListener()

  const [checking, setChecking] = useState(true)
  const [isInstalling, setIsInstalling] = useState(false)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other')

  useEffect(() => {
    // Detect platform
    const ua = navigator.userAgent.toLowerCase()
    if (/iphone|ipad|ipod/.test(ua)) setPlatform('ios')
    else if (/android/.test(ua)) setPlatform('android')
    else setPlatform('other')

    // Already running as installed PWA — route into the app
    if (isStandalone()) {
      if (!isLoading && isAuthenticated) {
        router.replace(role === 'organization' ? '/admin' : '/app/dashboard')
      } else {
        router.replace('/onboarding/splash')
      }
      return
    }
    setChecking(false)
  }, [isAuthenticated, isLoading, role, router])

  const [isDone, setIsDone] = useState(false)

  const handleInstall = async () => {
    setIsInstalling(true)
    
    // Mimic "Automatic" download feel for premium experience
    await new Promise(resolve => setTimeout(resolve, 3000))

    if (platform === 'android') {
      const nativePrompt = getDeferredPrompt()
      if (nativePrompt) {
        await triggerInstallPrompt()
      }
    }
    
    setIsInstalling(false)
    setIsDone(true)
    setTimeout(() => {
      router.push('/onboarding/splash')
    }, 800)
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gaffer-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gaffer-border border-t-gaffer-orange rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gaffer-bg text-white overflow-hidden flex flex-col">
      {/* ── Hero ── */}
      <section className="relative flex-1 flex flex-col">
        {/* Background Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-gaffer-orange/10 via-gaffer-bg to-gaffer-bg" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-gaffer-orange/5 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-20 left-0 w-96 h-96 bg-gaffer-red/5 rounded-full blur-3xl opacity-50" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,107,0,0.5) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,107,0,0.5) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        {/* Navbar */}
        <nav className="relative z-10 flex items-center justify-between px-6 pt-12 pb-4 max-w-lg mx-auto w-full flex-shrink-0">
          <GafferLogo size="sm" />
        </nav>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-8 py-12 max-w-lg mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            {/* PWA status */}
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-gaffer-orange text-[10px] font-bold tracking-[0.2em] mb-10 uppercase">
              <span className={`w-2 h-2 rounded-full ${isInstalling ? 'bg-blue-400 animate-ping' : isDone ? 'bg-green-400 shadow-[0_0_10px_#22c55e]' : 'bg-gaffer-orange animate-pulse'}`} />
              {isInstalling ? 'DOWNLOADING CORE FILES...' : isDone ? 'DOWNLOAD COMPLETE' : 'PWA Ready'}
            </div>

            <h1 className="font-display font-black text-[clamp(2.5rem,12vw,4rem)] leading-[0.9] tracking-tighter mb-8 italic">
              UNLEASH
              <br />
              <span className="text-gaffer-orange">POWER.</span>
            </h1>

            <p className="font-body text-gaffer-muted text-[15px] leading-relaxed mb-12 max-w-[280px] mx-auto opacity-80">
              Transform your sports management experience. Download official CORE files to gaining access.
            </p>

            {/* Main Action */}
            <div className="space-y-4 max-w-[280px] mx-auto">
              <motion.button
                onClick={handleInstall}
                disabled={isInstalling || isDone}
                whileTap={{ scale: 0.96 }}
                className="group relative w-full overflow-hidden"
              >
                <div className={`absolute inset-0 transition-transform duration-500 group-hover:scale-105 ${
                  isDone ? 'bg-green-500' : 'bg-gradient-to-r from-[#FF7A00] to-[#FF0000]'
                }`} />
                <div className="relative py-5 px-6 rounded-2xl font-display font-black text-lg text-white flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(255,92,0,0.4)]">
                  {isInstalling ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>DOWNLOADING...</span>
                    </>
                  ) : isDone ? (
                    <>
                      <Check size={22} strokeWidth={3} />
                      <span>INSTALLED!</span>
                    </>
                  ) : (
                    <>
                      <Download size={22} strokeWidth={2.5} />
                      <span>DOWNLOAD APP</span>
                    </>
                  )}
                </div>
              </motion.button>

              <button
                onClick={() => {
                  if (isStandalone()) router.push('/onboarding/splash')
                  else alert("Application restricted to PWA mode. Please download to continue.")
                }}
                className="w-full py-4 rounded-xl font-bold text-[13px] text-white/40 tracking-widest uppercase hover:text-white/60 transition-colors"
              >
                Already Downloaded? Open →
              </button>
            </div>
          </motion.div>
        </div>

        {/* Brand Footer */}
        <div className="relative z-10 px-6 py-10 flex flex-col items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-1.5 opacity-30">
            <Smartphone size={14} />
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase">iOS • Android • Desktop</span>
          </div>
          <p className="text-white/20 text-[10px] font-medium tracking-widest uppercase">
            © {new Date().getFullYear()} GAFFER CORE
          </p>
        </div>
      </section>
    </div>
  )
}
