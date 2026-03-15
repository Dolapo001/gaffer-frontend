'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useAuthListener } from '@/hooks/useAuthListener'
import { GafferLogo } from '@/components/GafferLogo'
import { IOSInstallModal } from '@/components/IOSInstallModal'
import {
  isStandalone,
  isIOS,
  isAndroid,
  getDeferredPrompt,
  triggerInstallPrompt,
  setDeferredPrompt,
} from '@/lib/pwa'
import {
  Download,
  Trophy,
  Users,
  Calendar,
  Zap,
  Share2,
  Plus,
  Smartphone,
  CheckCircle,
} from 'lucide-react'

const features = [
  { icon: Trophy, title: 'Track Performance', desc: 'Monitor your stats and progress across every game' },
  { icon: Users, title: 'Team Management', desc: 'Build rosters, assign roles, and coordinate your squad' },
  { icon: Calendar, title: 'Match Scheduling', desc: 'Schedule fixtures and tournaments with ease' },
  { icon: Zap, title: 'Real-time Updates', desc: 'Live scores, notifications and instant match updates' },
]

const IOS_STEPS = [
  { icon: Share2, color: 'bg-blue-500/20 border-blue-500/30 text-blue-400', label: 'Tap the Share button', hint: 'Bottom toolbar in Safari' },
  { icon: Plus, color: 'bg-gaffer-orange/20 border-gaffer-orange/30 text-gaffer-orange', label: 'Add to Home Screen', hint: 'Scroll down in the share sheet' },
  { icon: CheckCircle, color: 'bg-green-500/20 border-green-500/30 text-green-400', label: 'Open GAFFER', hint: 'Launch from your home screen' },
]

const ANDROID_STEPS = [
  { icon: Download, color: 'bg-gaffer-orange/20 border-gaffer-orange/30 text-gaffer-orange', label: 'Tap Install App below', hint: 'We\'ll trigger the native install prompt' },
  { icon: CheckCircle, color: 'bg-green-500/20 border-green-500/30 text-green-400', label: 'Confirm installation', hint: 'Tap Install in the system dialog' },
  { icon: Smartphone, color: 'bg-blue-500/20 border-blue-500/30 text-blue-400', label: 'Open GAFFER', hint: 'Launch from your home screen' },
]

export default function LandingPage() {
  const router = useRouter()
  const { isAuthenticated, role, isLoading } = useAuthStore()
  useAuthListener()

  const [checking, setChecking] = useState(true)
  const [showIOSModal, setShowIOSModal] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other')

  useEffect(() => {
    // Already running as installed PWA — route into the app
    if (isStandalone()) {
      if (!isLoading && isAuthenticated) {
        router.replace(role === 'organization' ? '/admin' : '/app/dashboard')
      } else {
        router.replace('/onboarding/splash')
      }
      return
    }

    // Detect platform for install instructions
    if (isIOS()) {
      setPlatform('ios')
    } else if (isAndroid()) {
      setPlatform('android')
    } else {
      setPlatform('other')
    }

    // Check if Chrome/Android install prompt already captured
    if (getDeferredPrompt()) setIsInstallable(true)

    // Also listen in case it fires after mount
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    // Redirect into app after successful install
    const handleAppInstalled = () => {
      setTimeout(() => router.replace('/onboarding/splash'), 800)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)
    setChecking(false)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isAuthenticated, isLoading, role, router])

  const handleInstall = async () => {
    if (platform === 'ios') {
      setShowIOSModal(true)
      return
    }
    if (getDeferredPrompt()) {
      await triggerInstallPrompt()
      // Whether accepted or dismissed, proceed into the app
      router.replace('/onboarding/splash')
      return
    }
    // No native prompt available — proceed directly into the app
    router.replace('/onboarding/splash')
  }

  // Show spinner while detecting standalone mode to prevent content flash
  if (checking) {
    return (
      <div className="min-h-screen bg-gaffer-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gaffer-border border-t-gaffer-orange rounded-full animate-spin" />
      </div>
    )
  }

  const installSteps = platform === 'ios' ? IOS_STEPS : ANDROID_STEPS

  return (
    <div className="min-h-screen bg-gaffer-bg text-white overflow-x-hidden">
      <IOSInstallModal isOpen={showIOSModal} onClose={() => setShowIOSModal(false)} />

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-gaffer-orange/10 via-gaffer-bg to-gaffer-bg" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-gaffer-orange/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-0 w-96 h-96 bg-gaffer-red/5 rounded-full blur-3xl" />
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
        <nav className="relative z-10 flex items-center justify-between px-6 pt-10 pb-4 max-w-lg mx-auto w-full">
          <GafferLogo size="sm" />
        </nav>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-12 max-w-lg mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="w-full"
          >
            {/* PWA badge */}
            <div className="inline-flex items-center gap-2 bg-gaffer-orange/10 border border-gaffer-orange/30 rounded-full px-4 py-1.5 text-gaffer-orange text-xs font-body font-semibold mb-6 tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-gaffer-orange animate-pulse" />
              Install Required to Access
            </div>

            <h1 className="font-display font-black text-[clamp(3.5rem,14vw,5rem)] leading-none tracking-tight mb-4">
              DOMINATE
              <br />
              <span className="text-gradient-orange">THE FIELD</span>
            </h1>

            <p className="font-body text-gaffer-muted text-base leading-relaxed mb-8 max-w-sm mx-auto">
              The all-in-one sports management platform for athletes, coaches, and organizations.
              Install the app to get started.
            </p>

            {/* Install CTA */}
            <div className="space-y-3 max-w-xs mx-auto">
              <motion.button
                onClick={handleInstall}
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.02 }}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-display font-bold text-base text-white bg-orange-gradient-btn shadow-orange-glow"
              >
                <Download size={20} />
                {platform === 'ios' ? 'Add to Home Screen' : isInstallable ? 'Install App' : 'Install GAFFER'}
              </motion.button>

              <button
                onClick={() => router.push('/onboarding/splash')}
                className="w-full py-3 px-6 rounded-2xl font-body text-sm text-gaffer-subtle border border-gaffer-border/50 hover:border-gaffer-border hover:text-gaffer-muted transition-all"
              >
                Already installed? Open GAFFER →
              </button>
            </div>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="relative z-10 flex justify-center pb-8"
        >
          <span className="text-gaffer-subtle text-[10px] font-body tracking-[0.2em] uppercase">
            Scroll to learn more
          </span>
        </motion.div>
      </section>

      {/* ── How to Install ── */}
      <section className="px-6 py-16 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Smartphone size={16} className="text-gaffer-orange" />
            <span className="text-gaffer-orange text-xs font-body font-semibold tracking-widest uppercase">
              {platform === 'ios' ? 'iOS — Safari' : 'Android / Chrome'}
            </span>
          </div>
          <h2 className="font-display font-bold text-2xl text-white mb-6">
            How to Install
          </h2>

          <div className="space-y-4">
            {installSteps.map((step, i) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.09 }}
                className="flex items-center gap-4 bg-gaffer-card border border-gaffer-border rounded-2xl p-4"
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center ${step.color}`}>
                  <step.icon size={18} />
                </div>
                <div>
                  <p className="text-white font-body font-semibold text-sm">{step.label}</p>
                  <p className="text-gaffer-muted text-xs font-body mt-0.5">{step.hint}</p>
                </div>
                <div className="ml-auto flex-shrink-0 w-6 h-6 rounded-full bg-gaffer-surface border border-gaffer-border flex items-center justify-center">
                  <span className="text-gaffer-muted text-[10px] font-display font-bold">{i + 1}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {platform === 'ios' && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowIOSModal(true)}
              className="mt-4 w-full py-3 rounded-xl border border-gaffer-orange/40 text-gaffer-orange font-body text-sm font-medium hover:bg-gaffer-orange/5 transition-all"
            >
              Show me step-by-step
            </motion.button>
          )}
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section className="px-6 py-12 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="font-display font-bold text-2xl text-white mb-2">
            Everything You Need
          </h2>
          <p className="font-body text-gaffer-muted text-sm">
            Built for the modern athlete and sports organization
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
              className="bg-gaffer-card border border-gaffer-border rounded-2xl p-4 flex gap-4"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gaffer-orange/10 border border-gaffer-orange/20 flex items-center justify-center">
                <feature.icon size={18} className="text-gaffer-orange" />
              </div>
              <div>
                <h3 className="font-display font-bold text-white text-sm mb-0.5">{feature.title}</h3>
                <p className="font-body text-gaffer-muted text-xs leading-relaxed">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="px-6 py-10 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gaffer-card border border-gaffer-orange/20 rounded-3xl p-6 text-center"
        >
          <GafferLogo size="sm" className="justify-center mb-3" />
          <p className="font-body text-gaffer-muted text-sm mb-5">
            Install the app to unlock the full GAFFER experience.
          </p>
          <motion.button
            onClick={handleInstall}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl font-display font-bold text-base text-white bg-orange-gradient-btn shadow-orange-glow flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Install GAFFER
          </motion.button>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gaffer-border px-6 py-6 text-center">
        <p className="text-gaffer-subtle text-xs font-body">
          © {new Date().getFullYear()} The GAFFER. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
