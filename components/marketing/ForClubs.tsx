'use client'

import { motion } from 'framer-motion'
import { Trophy, Users, Calendar, CheckCircle, ArrowRight } from 'lucide-react'
import { usePWAInstall } from '@/hooks/usePWAInstall'

export function ForClubs() {
  const { handleInstall } = usePWAInstall()
  return (
    <section id="clubs" className="py-24 px-6 bg-transparent overflow-hidden border-y border-white/5">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        
        {/* Content */}
        <div className="flex-1 space-y-8 md:space-y-10 px-4">
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 font-chakra font-500 text-orange-gaffer text-[12px] md:text-sm tracking-widest uppercase px-3 py-1 glass rounded-full"
            >
              FOR ORGANIZATIONS
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-3xl sm:text-5xl md:text-7xl font-display font-900 text-white uppercase leading-[1.1]"
            >
              RUN YOUR TOURNAMENTS <br />
              <span className="text-gradient-brand">LIKE A PRO</span>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-base md:text-xl text-text-muted font-body leading-relaxed max-w-xl"
            >
              Whether you manage a Sunday league side or a full sporting 
              organization, Gaffer gives you the tools to schedule fixtures, 
              register players, and communicate with your entire club.
            </motion.p>
          </div>

          <div className="space-y-4 md:space-y-6">
            {[
              { icon: Trophy, text: 'Create unlimited tournaments & seasons' },
              { icon: Users, text: 'Register and manage your full squad roster' },
              { icon: Calendar, text: 'Schedule matches with automated fixture generation' }
            ].map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 md:gap-4 text-white font-body group"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl glass flex items-center justify-center group-hover:bg-orange-gaffer/10 transition-colors">
                  <benefit.icon size={18} className="text-orange-gaffer" />
                </div>
                <span className="text-sm md:text-lg font-500">{benefit.text}</span>
              </motion.div>
            ))}
          </div>

          <motion.button
            onClick={handleInstall}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="w-full sm:w-auto px-10 py-5 rounded-xl bg-brand-gradient font-display font-700 text-lg md:text-xl uppercase tracking-wider text-white shadow-lg shadow-orange-gaffer/20 group active:scale-95 transition-transform flex items-center justify-center"
          >
            Set Up Your Club <ArrowRight size={24} className="inline ml-2 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>

        {/* Floating Cards (Mockup) - Hidden on Mobile */}
        <div className="hidden lg:flex flex-1 relative h-[500px] w-full max-w-[500px]">
           {/* Card 1 */}
           <motion.div
              initial={{ opacity: 0, y: 50, rotate: -5 }}
              whileInView={{ opacity: 1, y: 0, rotate: -5 }}
              animate={{ y: [0, -10, 0] }}
              transition={{ 
                duration: 6, 
                repeat: Infinity, 
                ease: "easeInOut",
                whileInView: { duration: 0.8 } 
              }}
              className="absolute top-10 left-10 w-[240px] glass p-6 rounded-2xl shadow-2xl border-orange-gaffer/20 z-10"
           >
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                    <CheckCircle size={20} />
                 </div>
                 <div className="font-display font-700 text-white tracking-wide uppercase leading-tight">Tournament Created ✓</div>
              </div>
              <div className="text-text-muted text-sm font-body">Org: Elite Sports Lagos</div>
           </motion.div>

           {/* Card 2 */}
           <motion.div
              initial={{ opacity: 0, x: 50, rotate: 5 }}
              whileInView={{ opacity: 1, x: 0, rotate: 5 }}
              animate={{ y: [0, 10, 0] }}
              transition={{ 
                duration: 5, 
                repeat: Infinity, 
                ease: "easeInOut",
                whileInView: { duration: 0.8, delay: 0.2 } 
              }}
              className="absolute top-48 right-10 w-[220px] glass p-6 rounded-2xl shadow-2xl border-orange-gaffer/20 z-20"
           >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-orange-gaffer bg-bg-card" />)}
                </div>
                <div className="font-display font-700 text-white tracking-wide uppercase">12 Players Registered</div>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                 <div className="w-3/4 h-full bg-orange-gaffer" />
              </div>
           </motion.div>

           {/* Card 3 */}
           <motion.div
              initial={{ opacity: 0, y: 50, x: -20 }}
              whileInView={{ opacity: 1, y: 0, x: -20 }}
              animate={{ y: [0, -15, 0] }}
              transition={{ 
                duration: 7, 
                repeat: Infinity, 
                ease: "easeInOut",
                whileInView: { duration: 0.8, delay: 0.4 } 
              }}
              className="absolute bottom-20 left-16 w-[260px] glass p-6 rounded-2xl shadow-2xl border-orange-gaffer/20 z-30"
           >
              <div className="flex items-center gap-3">
                 <Calendar className="text-orange-gaffer" />
                 <div>
                    <div className="font-display font-700 text-white uppercase tracking-wide">Next Match: Saturday 3PM</div>
                    <div className="text-orange-gaffer text-xs font-chakra uppercase tracking-widest mt-1">Lagos State Stadium</div>
                 </div>
              </div>
           </motion.div>

           {/* Decorative elements */}
           <div className="absolute inset-0 bg-orange-gaffer/10 blur-[100px] rounded-full" />
        </div>
      </div>
    </section>
  )
}
