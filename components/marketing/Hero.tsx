'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Play, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { IOSInstallModal } from '@/components/IOSInstallModal'

export function Hero() {
  const { isInstallable, isInstalled, isInstalling, handleInstall, showIOSModal, closeIOSModal } = usePWAInstall()

  return (
    <section className="relative min-h-[100dvh] flex flex-col items-center justify-center pt-28 pb-20 px-6 overflow-hidden bg-transparent">
      
      {/* ── Background Layers ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Layer 2: Grid */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Layer 3: Animated Radial Glows */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.08, 0.12, 0.08],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-gaffer rounded-full blur-[120px] mix-blend-screen"
        />
        <motion.div
           animate={{
            scale: [1, 1.3, 1],
            opacity: [0.05, 0.08, 0.05],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-accent rounded-full blur-[120px] mix-blend-screen"
        />

        {/* Layer 4: Noise overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8 md:space-y-10">
        
        {/* Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-gaffer opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-gaffer"></span>
          </span>
          <span className="font-chakra font-500 text-[10px] md:text-[12px] tracking-[0.2em] uppercase text-orange-gaffer">
            LIVE • SEASON 2025
          </span>
        </motion.div>

        {/* Headline */}
        <div className="relative space-y-1 md:space-y-2">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-5xl sm:text-7xl md:text-9xl font-display font-900 tracking-[0.05em] uppercase leading-[0.9] text-white"
          >
            DOMINATE
          </motion.h1>
          
          <div className="relative inline-block">
            <motion.h1
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
              className="text-5xl sm:text-7xl md:text-9xl font-display font-900 tracking-[0.05em] uppercase leading-[0.9] text-gradient-brand pb-2"
            >
              THE FIELD
            </motion.h1>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
              className="absolute -bottom-1 left-0 right-0 h-1 md:h-2 bg-orange-gaffer origin-left"
            />
          </div>
        </div>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-xl mx-auto text-base md:text-xl text-text-muted font-body leading-relaxed px-4"
        >
          The all-in-one sports platform — manage your fantasy squad,
          track live leagues, and run your club like a pro.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 px-6"
        >
          <button 
            onClick={handleInstall}
            disabled={isInstalling}
            className="group relative w-full sm:w-auto px-10 py-5 rounded-xl bg-brand-gradient font-display font-700 text-lg uppercase tracking-wider text-white shadow-lg shadow-orange-gaffer/20 overflow-hidden active:scale-95 transition-transform"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isInstalling ? 'DOWNLOADING...' : isInstalled ? 'GO TO DASHBOARD' : 'DOWNLOAD APP'}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </button>
          
          <button className="w-full sm:w-auto px-10 py-5 rounded-xl border border-orange-gaffer/30 glass-hover transition-all font-body font-500 text-white flex items-center justify-center gap-2"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Watch Demo <Play size={18} fill="currentColor" />
          </button>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="flex flex-col items-center gap-4 pt-10"
        >
           <div className="flex -space-x-3">
              {['cooper.png', 'jakob.png', 'dahood.png', 'omoba.png'].map((img, i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-orange-gaffer bg-bg-surface overflow-hidden relative">
                   <Image 
                     src={`/images/${img}`} 
                     alt="Social Proof" 
                     fill 
                     className="object-cover"
                   />
                </div>
              ))}
            </div>
          <p className="font-body text-sm text-text-muted">
            Trusted by <span className="text-white font-600">10,000+ players</span> across 500+ leagues
          </p>
        </motion.div>
      </div>

      <IOSInstallModal isOpen={showIOSModal} onClose={closeIOSModal} />

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-text-subtle flex flex-col items-center gap-2"
      >
        <span className="font-chakra text-[10px] tracking-widest uppercase">Scroll</span>
        <ChevronDown size={20} />
      </motion.div>
    </section>
  )
}
