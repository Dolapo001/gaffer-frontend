'use client'

import { motion } from 'framer-motion'
import { Check, ShieldCheck, Zap } from 'lucide-react'
import { usePWAInstall } from '@/hooks/usePWAInstall'

export function Pricing() {
  const { handleInstall } = usePWAInstall()
  return (
    <section id="pricing" className="py-24 px-6 relative overflow-hidden bg-transparent border-t border-white/5">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-orange-gaffer/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-20 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-6xl md:text-8xl font-display font-900 text-white uppercase italic leading-tight"
          >
            START FREE. <br />
            <span className="text-gradient-brand">WIN EVERYTHING.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="max-w-2xl mx-auto text-xl text-text-muted font-body leading-relaxed"
          >
            No credit card required. Get your squad ready in under 2 minutes.
          </motion.p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* Card 1: Player (Free) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="group glass p-10 rounded-[16px] space-y-10 border-white/5 transition-all duration-300 hover:border-white/10"
          >
             <div className="space-y-4">
               <h3 className="font-display font-800 text-4xl text-white uppercase tracking-widest italic">PLAYER</h3>
               <div className="flex items-end gap-2">
                 <span className="font-display font-900 text-6xl text-white uppercase italic">FREE</span>
               </div>
             </div>

             <div className="space-y-6">
                {[
                  '1 Fantasy League',
                  'League tracking (3 leagues)',
                  'News & match alerts',
                  'PWA install'
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-4 text-text-muted font-body text-lg">
                    <Check size={20} className="text-orange-gaffer" />
                    {f}
                  </div>
                ))}
             </div>

             <button 
               className="w-full py-5 rounded-xl border border-orange-gaffer/20 glass-hover transition-all font-display font-700 text-lg uppercase tracking-wider text-white"
               onClick={handleInstall}
             >
                Get Started Free
             </button>
          </motion.div>

          {/* Card 2: Manager (Pro) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="group glass p-10 rounded-[16px] space-y-10 border-orange-gaffer/30 relative overflow-hidden transition-all duration-300 ring-1 ring-orange-gaffer/10 shadow-[0_0_50px_rgba(255,107,0,0.1)]"
          >
             {/* Badge */}
             <div className="absolute top-6 right-6 font-chakra font-500 text-orange-gaffer text-[12px] tracking-[0.2em] uppercase px-4 py-2 glass rounded-full ring-2 ring-orange-gaffer/40">
                MOST POPULAR
             </div>

             <div className="space-y-4">
               <h3 className="font-display font-800 text-4xl text-white uppercase tracking-widest italic flex items-center gap-4">
                  MANAGER
                  <Zap size={24} className="text-orange-gaffer fill-orange-gaffer" />
               </h3>
               <div className="flex items-baseline gap-2">
                 <span className="font-display font-900 text-6xl text-white uppercase italic">₦2,500</span>
                 <span className="text-text-muted font-body text-xl">/mo</span>
               </div>
               <div className="text-text-subtle font-chakra text-sm uppercase tracking-widest">or $5 / month</div>
             </div>

             <div className="space-y-6 relative z-10">
                {[
                  'Unlimited Fantasy Leagues',
                  'All leagues + live updates',
                  'Club & tournament tools',
                  'Advanced stats & insights',
                  'Priority support'
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-4 text-white font-body text-lg">
                    <Check size={20} className="text-orange-gaffer" />
                    {f}
                  </div>
                ))}
             </div>

             <button 
                className="relative w-full py-5 rounded-xl bg-brand-gradient font-display font-700 text-lg uppercase tracking-wider text-white shadow-lg shadow-orange-gaffer/40 overflow-hidden group"
                onClick={handleInstall}
             >
                <span className="relative z-10">Upgrade to Manager</span>
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
             </button>

             {/* Background pulse for pro card */}
             <div className="absolute inset-x-0 bottom-0 h-1/2 bg-orange-gaffer/5 blur-3xl rounded-full translate-y-1/2 -z-10" />
          </motion.div>
        </div>

        {/* Footer Info */}
        <div className="text-center pt-8">
           <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="font-chakra text-sm text-text-subtle tracking-[0.2em] uppercase space-x-6"
           >
              <span>Cancel anytime</span>
              <span>•</span>
              <span>No hidden fees</span>
              <span>•</span>
              <span>Works offline</span>
           </motion.p>
        </div>
      </div>
    </section>
  )
}
