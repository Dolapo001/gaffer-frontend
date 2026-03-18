'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Trophy, Smartphone, Activity } from 'lucide-react'
import { usePWAInstall } from '@/hooks/usePWAInstall'

export function ProductShowcase() {
  const { handleInstall } = usePWAInstall()
  return (
    <section id="fantasy" className="py-24 px-6 bg-transparent overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-32">
        
        {/* Fantasy Dashboard Showcase */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="flex-1 space-y-6 md:space-y-8 px-4"
          >
            <div className="inline-flex items-center gap-2 font-chakra font-500 text-orange-gaffer text-[12px] md:text-sm tracking-widest uppercase px-3 py-1 glass rounded-full ring-1 ring-orange-gaffer/20">
               <Trophy size={14} /> FANTASY MODE
            </div>
            
            <h2 className="text-3xl sm:text-5xl md:text-7xl font-display font-800 text-white uppercase leading-[1.1]">
              Your Squad. <br />
              <span className="text-gradient-brand">Your Strategy.</span>
            </h2>
            
            <p className="text-base md:text-xl text-text-muted font-body leading-relaxed max-w-xl">
              Pick your 11 from thousands of real players. Set your captain, 
              manage your bench, apply boosts, and watch the points 
              roll in on matchday.
            </p>

            <ul className="space-y-3 md:space-y-4">
              {[
                'Live points updates during matches',
                'Transfer chips: Wildcard, Bench Boost',
                'Head-to-head leagues with friends'
              ].map((bullet, i) => (
                <li key={i} className="flex items-center gap-3 text-white font-body text-sm md:text-base">
                  <span className="text-orange-gaffer text-lg md:text-xl">✦</span>
                  {bullet}
                </li>
              ))}
            </ul>

            <button 
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-brand-gradient font-display font-700 text-lg uppercase tracking-wider text-white shadow-lg shadow-orange-gaffer/20 group active:scale-95 transition-transform"
              onClick={handleInstall}
            >
              Build Your Team <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {/* Desktop Mockup Frame */}
          <motion.div
            initial={{ opacity: 0, x: 50, rotate: -2 }}
            whileInView={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="flex-1 relative aspect-[4/3] w-full max-w-[600px] glass rounded-2xl p-4 md:p-6 shadow-2xl border-orange-gaffer/10"
          >
            {/* Fake Pitch Layout Grid */}
            <div className="relative w-full h-full bg-[#1A331A] rounded-xl overflow-hidden border border-white/5 p-4 flex flex-col items-center justify-center">
              {/* Pitch lines */}
              <div className="absolute inset-0 border-[2px] border-white/10 m-4 rounded-sm" />
              <div className="absolute inset-x-0 top-1/2 h-[2px] bg-white/10 m-4" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-full border-[2px] border-white/10" />
              </div>
              
              {/* Player dots (4-3-3) */}
              <div className="relative z-10 w-full h-full grid grid-rows-5 gap-2 md:gap-4">
                {/* Forwards */}
                <div className="flex justify-center gap-6 md:gap-12 pt-4">
                  {[1, 2, 3].map(i => <div key={i} className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-orange-gaffer/40 border border-orange-gaffer ring-4 ring-orange-gaffer/10 shadow-[0_0_15px_rgba(255,107,0,0.5)]" />)}
                </div>
                {/* Midfield */}
                <div className="flex justify-center gap-8 md:gap-16">
                  {[1, 2, 3].map(i => <div key={i} className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-white/10 border border-white/20" />)}
                </div>
                <div></div>
                {/* Defenders */}
                <div className="flex justify-center gap-6 md:gap-10">
                  {[1, 2, 3, 4].map(i => <div key={i} className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-white/10 border border-white/20" />)}
                </div>
                {/* GK */}
                <div className="flex justify-center pb-4">
                  <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-white/10 border border-white/20" />
                </div>
              </div>

              {/* Stats Overlay */}
              <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 glass px-4 py-2 md:px-6 md:py-4 rounded-xl border-orange-gaffer/20 text-center animate-pulse">
                <div className="font-chakra text-[8px] md:text-[10px] text-orange-gaffer uppercase tracking-widest">Points</div>
                <div className="font-display font-800 text-xl md:text-3xl text-white">82</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* League Management Showcase */}
        <div id="leagues" className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20 scroll-mt-20">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="flex-1 space-y-6 md:space-y-8 px-4"
          >
            <div className="inline-flex items-center gap-2 font-chakra font-500 text-orange-gaffer text-[12px] md:text-sm tracking-widest uppercase px-3 py-1 glass rounded-full ring-1 ring-orange-gaffer/20">
               <Activity size={14} /> LEAGUE HUB
            </div>
            
            <h2 className="text-3xl sm:text-5xl md:text-7xl font-display font-800 text-white uppercase leading-[1.1]">
              Every Match. <br />
              <span className="text-gradient-brand">Every Table.</span>
            </h2>
            
            <p className="text-base md:text-xl text-text-muted font-body leading-relaxed max-w-xl">
              Track fixtures, standings, and live match scores across multiple 
              leagues simultaneously. From grassroots to elite.
            </p>

            <ul className="space-y-3 md:space-y-4">
              {[
                'Live scoreboard with match events',
                'Full league tables & form guides',
                'Top scorers leaderboard'
              ].map((bullet, i) => (
                <li key={i} className="flex items-center gap-3 text-white font-body text-sm md:text-base">
                  <span className="text-orange-gaffer text-lg md:text-xl">✦</span>
                  {bullet}
                </li>
              ))}
            </ul>

            <button 
              className="w-full sm:w-auto flex items-center justify-center px-8 py-4 rounded-xl border border-orange-gaffer/30 glass-hover transition-all font-body font-500 text-white gap-2 group active:scale-95"
              onClick={handleInstall}
            >
              Explore Leagues <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {/* Desktop Mockup (League Table Card) */}
          <motion.div
            initial={{ opacity: 0, x: -50, rotate: 2 }}
            whileInView={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="flex-1 relative w-full lg:max-w-[600px] glass rounded-2xl p-4 md:p-6 shadow-2xl border-orange-gaffer/10"
          >
             <div className="bg-bg-card rounded-xl border border-white/5 overflow-hidden">
                <div className="p-4 md:p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                  <span className="font-display font-800 text-[10px] md:text-sm uppercase tracking-widest text-text-muted">Table Standings</span>
                  <div className="flex gap-2">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-accent" />
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-orange-gaffer opacity-50" />
                  </div>
                </div>
                <div className="divide-y divide-white/5">
                  {[
                    { rank: 1, team: 'Arsenal', mp: 28, pts: 64, form: ['W','W','W','W','W'] },
                    { rank: 2, team: 'Liverpool', mp: 28, pts: 64, form: ['W','W','W','D','W'] },
                    { rank: 3, team: 'Man City', mp: 28, pts: 63, form: ['W','W','W','D','W'] },
                    { rank: 4, team: 'Aston Villa', mp: 28, pts: 55, form: ['W','W','W','W','L'] },
                    { rank: 5, team: 'Tottenham', mp: 27, pts: 53, form: ['W','L','W','W','W'] },
                  ].map((row, i) => (
                    <div key={i} className={`p-3 md:p-4 flex items-center justify-between font-body ${row.rank === 1 ? 'bg-orange-gaffer/5' : ''}`}>
                      <div className="flex items-center gap-3 md:gap-4 min-w-0">
                        <span className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${row.rank <= 4 ? 'bg-orange-gaffer/20 text-orange-gaffer' : 'bg-white/5 text-text-muted'}`}>
                          {row.rank}
                        </span>
                        <span className="font-600 text-white truncate text-sm md:text-base">{row.team}</span>
                      </div>
                      <div className="flex items-center gap-4 md:gap-8 flex-shrink-0">
                         <div className="hidden sm:flex gap-1">
                           {row.form.map((f, idx) => (
                             <div key={idx} className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${f === 'W' ? 'bg-green-500' : f === 'D' ? 'bg-gray-500' : 'bg-red-500'}`} />
                           ))}
                         </div>
                         <div className="flex gap-4 md:gap-10 text-[12px] md:text-base">
                            <span className="text-text-muted">{row.mp}</span>
                            <span className="font-800 text-white w-6 md:w-8 text-right">{row.pts}</span>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
