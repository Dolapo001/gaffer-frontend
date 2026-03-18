'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ArrowDown } from 'lucide-react'
import { GafferLogo } from '@/components/GafferLogo'
import { usePWAInstall } from '@/hooks/usePWAInstall'

const NAV_LINKS = [
  { name: 'Features', href: '#features' },
  { name: 'Fantasy', href: '#fantasy' },
  { name: 'For Clubs', href: '#clubs' },
  { name: 'Pricing', href: '#pricing' },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { isInstalled, isInstalling, handleInstall } = usePWAInstall()

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-[100] bg-black/20 backdrop-blur-xl border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center">
          <GafferLogo size="sm" />
        </div>

        {/* Center Links (Desktop) */}
        <div className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="font-body font-500 text-text-muted hover:text-white transition-colors relative group py-2 text-sm tracking-widest uppercase"
            >
              {link.name}
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-orange-gaffer transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </div>

        {/* Right Buttons (Desktop) */}
        <div className="hidden lg:flex items-center gap-4">
          <button 
            onClick={handleInstall}
            disabled={isInstalling}
            className="px-6 py-2.5 rounded-xl bg-brand-gradient font-display font-700 text-white uppercase tracking-wider shimmer-sweep text-sm active:scale-95 transition-transform"
          >
            {isInstalling ? 'DOWNLOADING...' : isInstalled ? 'GO TO DASHBOARD' : 'DOWNLOAD'}
          </button>
        </div>

        {/* Mobile Toggle */}
        <button
          className="lg:hidden text-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: '100vh' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden fixed inset-0 top-20 bg-black/60 backdrop-blur-3xl z-[90] flex flex-col items-center pt-20 gap-8 px-6"
          >
            {NAV_LINKS.map((link, idx) => (
              <motion.a
                key={link.name}
                href={link.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setIsOpen(false)}
                className="font-display font-800 text-3xl text-white uppercase tracking-wider"
              >
                {link.name}
              </motion.a>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: NAV_LINKS.length * 0.1 }}
              className="flex flex-col w-full gap-4 mt-8"
            >
              <button 
                onClick={() => {
                  handleInstall()
                  setIsOpen(false)
                }}
                className="w-full py-4 bg-brand-gradient rounded-xl font-display font-700 text-white uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {isInstalling ? 'DOWNLOADING...' : isInstalled ? 'GO TO DASHBOARD' : 'DOWNLOAD APP'}
                <ArrowDown size={20} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
