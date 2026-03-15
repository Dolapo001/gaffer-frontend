'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { isStandalone } from '@/lib/pwa'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { GafferLogo } from '@/components/GafferLogo'
import { IOSInstallModal } from '@/components/IOSInstallModal'
import { Download, Trophy, Users, Calendar, Zap, CheckCircle } from 'lucide-react'

const features = [
  {
    icon: Trophy,
    title: 'Track Performance',
    desc: 'Monitor your stats and progress across every game',
  },
  {
    icon: Users,
    title: 'Team Management',
    desc: 'Build rosters, assign roles, and coordinate your squad',
  },
  {
    icon: Calendar,
    title: 'Match Scheduling',
    desc: 'Schedule fixtures and tournaments with ease',
  },
  {
    icon: Zap,
    title: 'Real-time Updates',
    desc: 'Live scores, notifications and instant match updates',
  },
]

export default function LandingPage() {
  const router = useRouter()
  const {
    canInstall,
    isInstalled,
    isIOSDevice,
    showIOSInstructions,
    install,
    dismissIOSInstructions,
  } = usePWAInstall()

  // If already in standalone mode, redirect to onboarding
  useEffect(() => {
    if (isStandalone()) {
      router.replace('/onboarding/splash')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gaffer-bg text-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col">
        {/* Background gradient */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-gaffer-orange/10 via-gaffer-bg to-gaffer-bg" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-gaffer-orange/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gaffer-red/5 rounded-full blur-3xl" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `linear-gradient(rgba(255,107,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,0,0.3) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        {/* Navbar */}
        <nav className="relative z-10 flex items-center justify-between px-6 pt-8 pb-4 max-w-4xl mx-auto w-full">
          <GafferLogo size="sm" />
          <button
            onClick={() => router.push('/auth/login')}
            className="text-sm font-body font-medium text-gaffer-muted hover:text-white transition-colors border border-gaffer-border rounded-full px-4 py-1.5 hover:border-gaffer-orange"
          >
            Sign In
          </button>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-16 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-gaffer-orange/10 border border-gaffer-orange/30 rounded-full px-4 py-1.5 text-gaffer-orange text-xs font-body font-medium mb-6 tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-gaffer-orange animate-pulse" />
              Sports Management Platform
            </div>

            <h1 className="font-display font-black text-6xl md:text-7xl leading-none tracking-tight mb-4">
              DOMINATE
              <br />
              <span className="text-gradient-orange">THE FIELD</span>
            </h1>

            <p className="font-body text-gaffer-muted text-lg leading-relaxed mb-10 max-w-md mx-auto">
              The all-in-one sports management app for athletes, coaches, and organizations. 
              Manage your game like a true Gaffer.
            </p>

            {/* Install CTA */}
            <div className="space-y-3 max-w-xs mx-auto">
              {(canInstall || isIOSDevice) && !isInstalled && (
                <motion.button
                  onClick={install}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.02 }}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-display font-bold text-base text-white bg-orange-gradient-btn shadow-orange-glow"
                >
                  <Download size={20} />
                  Install GAFFER App
                </motion.button>
              )}

              {isInstalled && (
                <motion.button
                  onClick={() => router.push('/onboarding/splash')}
                  whileTap={{ scale: 0.97 }}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-display font-bold text-base text-white bg-orange-gradient-btn shadow-orange-glow"
                >
                  <CheckCircle size={20} />
                  Open App
                </motion.button>
              )}

              {!canInstall && !isIOSDevice && !isInstalled && (
                <div className="w-full py-4 px-6 rounded-2xl bg-gaffer-card border border-gaffer-border text-center">
                  <p className="text-gaffer-muted text-sm font-body">
                    Open in <strong className="text-white">Chrome on Android</strong> or{' '}
                    <strong className="text-white">Safari on iOS</strong> to install
                  </p>
                </div>
              )}

              <button
                onClick={() => router.push('/auth/login')}
                className="w-full py-3.5 px-6 rounded-2xl font-body font-medium text-sm text-gaffer-muted border border-gaffer-border hover:border-gaffer-orange hover:text-white transition-all"
              >
                Continue in browser (limited)
              </button>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="relative z-10 flex justify-center pb-8 text-gaffer-subtle"
        >
          <span className="text-xs font-body tracking-widest uppercase">Scroll to explore</span>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="font-display font-bold text-3xl text-white mb-3">
            Everything You Need
          </h2>
          <p className="font-body text-gaffer-muted text-base max-w-sm mx-auto">
            Built for the modern athlete and sports organization
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-gaffer-card border border-gaffer-border rounded-2xl p-5 flex gap-4"
            >
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gaffer-orange/10 border border-gaffer-orange/20 flex items-center justify-center">
                <feature.icon size={20} className="text-gaffer-orange" />
              </div>
              <div>
                <h3 className="font-display font-bold text-white text-base mb-1">
                  {feature.title}
                </h3>
                <p className="font-body text-gaffer-muted text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How to Install Section */}
      <section className="px-6 py-16 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gaffer-surface border border-gaffer-border rounded-3xl p-8"
        >
          <h2 className="font-display font-bold text-2xl text-white mb-2">
            How to Install
          </h2>
          <p className="font-body text-gaffer-muted text-sm mb-6">
            GAFFER works as a Progressive Web App. Install it like a native app — no App Store needed.
          </p>

          <div className="space-y-4">
            {[
              { platform: '📱 Android (Chrome)', steps: 'Tap the 3-dot menu → "Add to Home screen" → Install' },
              { platform: '🍎 iOS (Safari)', steps: 'Tap the Share button → "Add to Home Screen" → Add' },
              { platform: '💻 Desktop (Chrome)', steps: 'Click the install icon in the address bar → Install' },
            ].map((item) => (
              <div key={item.platform} className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-gaffer-orange mt-1.5" />
                </div>
                <div>
                  <p className="text-white text-sm font-body font-medium">{item.platform}</p>
                  <p className="text-gaffer-muted text-xs font-body mt-0.5">{item.steps}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gaffer-border px-6 py-8 text-center">
        <GafferLogo size="sm" className="justify-center mb-3" />
        <p className="text-gaffer-subtle text-xs font-body">
          © {new Date().getFullYear()} The GAFFER. All rights reserved.
        </p>
      </footer>

      {/* iOS Install Instructions Modal */}
      <IOSInstallModal
        isOpen={showIOSInstructions}
        onClose={dismissIOSInstructions}
      />
    </div>
  )
}
