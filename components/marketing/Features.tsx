'use client'

import { motion } from 'framer-motion'
import { Users, Activity, Trophy, Repeat, Newspaper, Zap } from 'lucide-react'

const FEATURES = [
  {
    icon: Users,
    title: 'Fantasy Squad Builder',
    desc: 'Draft your 11. Set your captain. Earn points from real match performances.'
  },
  {
    icon: Activity,
    title: 'Live League Tracker',
    desc: 'Real-time standings, fixtures, and live match cards — always in sync.'
  },
  {
    icon: Trophy,
    title: 'Club & Tournament Tools',
    desc: 'Create and manage tournaments for your organization. Schedule matches, track results.'
  },
  {
    icon: Repeat,
    title: 'Transfer Market',
    desc: 'Smart transfer suggestions. Manage your squad budget. Beat the deadline.'
  },
  {
    icon: Newspaper,
    title: 'News & Insights Hub',
    desc: 'Curated sports news and trending posts relevant to your leagues.'
  },
  {
    icon: Zap,
    title: 'Offline-Ready PWA',
    desc: 'Install on any device. Works offline. Feels native. No app store needed.'
  }
]

export function Features() {
  return (
    <section id="features" className="py-24 px-6 bg-transparent overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-20">
        
        {/* Header */}
        <div className="text-center space-y-4 px-4">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl sm:text-5xl md:text-7xl font-display font-900 text-white uppercase tracking-tight italic leading-tight"
          >
            EVERYTHING YOU NEED TO WIN
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="max-w-2xl mx-auto text-base md:text-lg text-text-muted font-body px-2"
          >
            Built for the modern football manager. Powerful tools to dominate your league.
          </motion.p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              className="group glass p-8 rounded-[16px] space-y-6 relative overflow-hidden transition-all duration-300"
            >
              {/* Icon Container */}
              <div className="w-12 h-12 rounded-full bg-brand-gradient flex items-center justify-center relative z-10">
                <feature.icon size={22} className="text-white" />
              </div>

              {/* Title & Description */}
              <div className="space-y-3 relative z-10">
                <h3 className="text-2xl font-display font-700 text-white uppercase tracking-wider group-hover:text-orange-gaffer transition-colors">
                  {feature.title}
                </h3>
                <p className="text-text-muted font-body leading-relaxed transition-colors group-hover:text-text-primary">
                  {feature.desc}
                </p>
              </div>

              {/* Subtle background glow on hover */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-orange-gaffer/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Top border glow on hover */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-gaffer/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
