'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Smartphone } from 'lucide-react'
import Image from 'next/image'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { IOSInstallModal } from '@/components/IOSInstallModal'

export function FinalCTA() {
  const { isInstalled, isInstalling, handleInstall, showIOSModal, closeIOSModal } = usePWAInstall()
  const sentence = "READY TO DOMINATE THE FIELD?"
  const words = sentence.split(" ")

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.04 * i },
    }),
  }

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  }

  return (
    <>
    <section className="py-24 px-6 overflow-hidden">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto relative rounded-[32px] overflow-hidden bg-brand-gradient py-20 px-6 md:px-20 text-center"
      >
        {/* Animated background image */}
        <motion.div
          className="absolute inset-0 z-0"
          animate={{ scale: [1.15, 1.0, 1.15] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Image
            src="/images/stadium_bg.png"
            alt=""
            fill
            className="object-cover opacity-20"
            priority
          />
        </motion.div>

        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-white/10 blur-[100px] pointer-events-none z-[1]" />
        <div className="absolute bottom-0 left-0 w-1/3 h-full bg-black/10 blur-[100px] pointer-events-none z-[1]" />

        <div className="relative z-10 space-y-8" style={{ isolation: 'isolate' }}>
           <motion.h2
              variants={container}
              initial="hidden"
              whileInView="visible"
              className="text-4xl sm:text-6xl md:text-8xl font-display font-900 text-white uppercase italic leading-tight flex flex-wrap justify-center gap-x-3 md:gap-x-4"
           >
              {words.map((word, index) => (
                <motion.span
                  variants={child}
                  key={index}
                  className="inline-block"
                >
                  {word}
                </motion.span>
              ))}
           </motion.h2>
           
           <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="max-w-xl mx-auto text-base md:text-xl text-white/80 font-body px-4"
           >
              Join thousands of players who&apos;ve already made the move. 
              The future of sports management is here.
           </motion.p>

           <motion.button
              onClick={handleInstall}
              disabled={isInstalling}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 md:px-12 py-5 bg-orange-gaffer rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.3)] group overflow-hidden active:scale-95 transition-transform"
           >
              <span className="relative z-10 flex items-center justify-center gap-3 font-display font-800 text-lg md:text-xl text-white uppercase tracking-widest leading-none">
                 {isInstalling ? 'DOWNLOADING...' : isInstalled ? 'GO TO DASHBOARD' : 'DOWNLOAD THE APP'}
                 <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
           </motion.button>

           <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.6 }}
              transition={{ delay: 1.4 }}
              className="flex items-center justify-center gap-4 text-white text-[10px] md:text-[12px] font-chakra uppercase tracking-widest pt-8 px-4 text-center"
           >
              <Smartphone size={16} className="shrink-0" />
              <span>Available for iOS, Android, and Web</span>
           </motion.div>
        </div>
      </motion.div>
    </section>

    <IOSInstallModal isOpen={showIOSModal} onClose={closeIOSModal} />
    </>
  )
}
