'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Zap,
  Shield,
  Layers,
  ArrowRight
} from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const { isAuthenticated, role, isLoading } = useAuthStore()
  useAuthListener()

  const [checking, setChecking] = useState(true)
  const [isInstalling, setIsInstalling] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other')

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase()
    if (/iphone|ipad|ipod/.test(ua)) setPlatform('ios')
    else if (/android/.test(ua)) setPlatform('android')
    else setPlatform('other')

    if (isStandalone()) {
      router.replace('/onboarding/splash')
      return
    }
    setChecking(false)
  }, [router])

  const handleInstall = async () => {
    setIsInstalling(true)
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
    }, 1200)
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/5 border-t-gaffer-orange rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-hidden flex flex-col selection:bg-gaffer-orange/30">
      {/* ── Dynamic Background ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gaffer-orange/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gaffer-red/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }} />
        <div 
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* ── Glass Navbar ── */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-8 max-w-7xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <GafferLogo size="sm" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[10px] font-bold tracking-widest text-white/50 uppercase">
            v2.4.0 • PRODUCTION
          </div>
        </motion.div>
      </nav>

      {/* ── Hero Content ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="max-w-4xl w-full text-center space-y-12">
          
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-xl"
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isInstalling ? 'bg-blue-400' : isDone ? 'bg-green-400' : 'bg-gaffer-orange'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isInstalling ? 'bg-blue-500' : isDone ? 'bg-green-500' : 'bg-gaffer-orange'}`} />
            </span>
            <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-white/70">
              {isInstalling ? 'Syncing core systems...' : isDone ? 'System Synchronized' : 'Ready for Protocol Deployment'}
            </span>
          </motion.div>

          {/* Main Title */}
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-6xl md:text-8xl font-display font-black tracking-tight italic"
            >
              ELITE <span className="text-gaffer-orange">SPORTS</span>
              <br />
              <span className="relative inline-block mt-2">
                MANAGEMENT
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 1, duration: 1 }}
                  className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-gaffer-orange to-transparent opacity-50"
                />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="max-w-xl mx-auto text-lg text-white/40 font-body leading-relaxed"
            >
              Experience the next generation of athletic coordination. 
              Install the GAFFER CORE to unlock the full management suite.
            </motion.p>
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col items-center gap-6"
          >
            <AnimatePresence mode="wait">
              {!isDone ? (
                <motion.button
                  key="install-btn"
                  onClick={handleInstall}
                  disabled={isInstalling}
                  whileTap={{ scale: 0.98 }}
                  className="group relative w-[320px] h-[72px] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(255,107,0,0.2)]"
                >
                  <div className={`absolute inset-0 transition-all duration-700 ${isInstalling ? 'bg-blue-600' : 'bg-gradient-to-r from-[#FF7A00] via-[#FF4D00] to-[#FF2400]'}`} />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity bg-[radial-gradient(circle_at_center,_white_0%,_transparent_70%)]" />
                  
                  <div className="relative h-full w-full flex items-center justify-center gap-3">
                    {isInstalling ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span className="font-display font-black text-lg tracking-widest uppercase">DOWNLOADING...</span>
                      </>
                    ) : (
                      <>
                        <Download size={24} strokeWidth={2.5} className="group-hover:-translate-y-1 group-active:translate-y-0 transition-transform" />
                        <span className="font-display font-black text-lg tracking-widest uppercase">INITIALIZE DOWNLOAD</span>
                      </>
                    )}
                  </div>
                </motion.button>
              ) : (
                <motion.div
                  key="done-btn"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-[320px] h-[72px] rounded-2xl bg-green-500/20 border border-green-500/30 backdrop-blur-xl flex items-center justify-center gap-3 text-green-400"
                >
                  <Check size={24} strokeWidth={3} />
                  <span className="font-display font-black text-lg tracking-widest uppercase">SYSTEM READY</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => {
                if (isStandalone()) router.push('/onboarding/splash')
                else alert("Standalone Mode Required. Please download to proceed.")
              }}
              className="group flex items-center gap-2 text-white/30 hover:text-white/60 text-[11px] font-bold tracking-[0.3em] uppercase transition-all"
            >
              Bypass to Desktop
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </main>

      {/* ── Premium Feature Grid ── */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20 border-t border-white/5 bg-gradient-to-b from-transparent to-white/[0.01]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { icon: Zap, title: 'INSTANT SYNC', desc: 'Real-time telemetry for team coordination.' },
            { icon: Shield, title: 'ENCRYPTED', desc: 'State-of-the-art security for all sensitive data.' },
            { icon: Layers, title: 'MODULAR', desc: 'Powerful architecture designed for elite scale.' }
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group space-y-4"
            >
              <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center transition-all group-hover:bg-gaffer-orange/10 group-hover:border-gaffer-orange/30 group-hover:shadow-[0_0_20px_rgba(255,107,0,0.1)]">
                <item.icon size={20} className="text-white/40 group-hover:text-gaffer-orange transition-colors" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-sm tracking-widest uppercase text-white/80 group-hover:text-white transition-colors">{item.title}</h3>
                <p className="text-xs text-white/30 font-body leading-relaxed max-w-[200px]">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-24 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 opacity-30">
          <div className="flex items-center gap-6">
            <Smartphone size={16} />
            <div className="text-[10px] font-bold tracking-widest uppercase whitespace-nowrap">CROSS-PLATFORM DEPLOYMENT READY</div>
          </div>
          <p className="text-[10px] font-bold tracking-[0.4em] uppercase">
            © 2026 4ORGE CORE SYSTEMS
          </p>
        </div>
      </footer>
    </div>
  )
}
