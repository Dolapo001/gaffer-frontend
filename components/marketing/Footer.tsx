'use client'

import { motion } from 'framer-motion'
import { Twitter, Instagram, Disc, Send } from 'lucide-react'
import { GafferLogo } from '@/components/GafferLogo'

export function Footer() {
  const currentYear = new Date().getFullYear()

  const FOOTER_LINKS = {
    Product: [
      { name: 'Features', href: '#features' },
      { name: 'Fantasy', href: '#fantasy' },
      { name: 'Leagues', href: '#leagues' },
      { name: 'For Clubs', href: '#clubs' },
      { name: 'Pricing', href: '#pricing' }
    ],
    Company: [
      { name: 'About', href: '#' },
      { name: 'Blog', href: '#' },
      { name: 'Careers', href: '#' },
      { name: 'Press', href: '#' }
    ],
    Legal: [
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Cookie Policy', href: '#' }
    ],
  }

  return (
    <footer className="bg-black/40 backdrop-blur-xl border-t border-white/5 py-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-20">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-20">
          
          {/* Column 1: Logo & Social */}
          <div className="space-y-8 flex flex-col items-start">
             <GafferLogo size="sm" />
             <p className="font-display font-800 text-3xl text-white uppercase italic leading-tight">
               DOMINATE <span className="text-orange-gaffer">THE FIELD.</span>
             </p>
             <div className="flex gap-4">
                {[Twitter, Instagram, Disc, Send].map((Icon, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.1, color: '#FF6B00' }}
                    className="w-10 h-10 rounded-lg glass flex items-center justify-center text-text-muted transition-colors border-white/5 hover:border-orange-gaffer/40 hover:glass ring-1 ring-white/5"
                  >
                    <Icon size={20} />
                  </motion.button>
                ))}
             </div>
          </div>

          {/* Columns 2-4: Links */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title} className="space-y-8">
              <h4 className="font-display font-800 text-lg text-white uppercase tracking-widest italic">{title}</h4>
              <ul className="space-y-4">
                {links.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="font-body text-text-muted hover:text-orange-gaffer transition-colors text-lg"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex flex-col md:flex-row items-center gap-6">
              <p className="font-body text-text-subtle text-sm">
                © {currentYear} 4orge. All rights reserved.
              </p>
           </div>
           
        </div>
      </div>
    </footer>
  )
}
