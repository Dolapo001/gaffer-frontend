'use client'

import { motion } from 'framer-motion'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'

const TESTIMONIALS = [
  {
    quote: "Gaffer completely changed how I approach fantasy football. The live points updates are addictive.",
    author: "Marcus O.",
    role: "Fantasy League Champion",
  },
  {
    quote: "We use it to run the entire club league. Fixtures, standings, player stats — everything in one place.",
    author: "Coach Daniel A.",
    role: "FC United Lagos",
  },
  {
    quote: "The transfer deadline feature saved me so many times. No more scrambling at midnight.",
    author: "Temi S.",
    role: "Premier Fantasy Manager",
  },
  {
    quote: "Clean, fast, works on my phone like an app. My whole squad is on it now.",
    author: "Emeka R.",
    role: "Team Captain",
  },
]

export function Testimonials() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollX, setScrollX] = useState(0)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        setScrollX(scrollRef.current.scrollLeft)
      }
    }
    scrollRef.current?.addEventListener('scroll', handleScroll)
    return () => scrollRef.current?.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section id="testimonials" className="py-24 px-6 bg-transparent overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-20">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-end justify-between gap-10">
          <div className="space-y-4">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-7xl font-display font-900 text-white uppercase leading-tight italic"
            >
              WHAT PLAYERS <br />
              ARE SAYING
            </motion.h2>
          </div>
          <div className="flex gap-4">
             <button 
                onClick={() => scroll('left')}
                className="w-14 h-14 rounded-full glass flex items-center justify-center hover:bg-orange-gaffer/10 transition-colors border-orange-gaffer/20"
             >
                <ChevronLeft size={24} className="text-white" />
             </button>
             <button 
                onClick={() => scroll('right')}
                className="w-14 h-14 rounded-full glass flex items-center justify-center hover:bg-orange-gaffer/10 transition-colors border-orange-gaffer/20"
             >
                <ChevronRight size={24} className="text-white" />
             </button>
          </div>
        </div>

        {/* Carousel */}
        <div 
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-10 no-scrollbar snap-x snap-mandatory"
        >
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              className="flex-shrink-0 w-[350px] md:w-[450px] glass p-10 rounded-2xl space-y-6 snap-center border-orange-gaffer/10"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                   <Star key={star} size={18} fill="#FF6B00" className="text-orange-gaffer" />
                ))}
              </div>
              
              <blockquote className="text-lg md:text-xl text-text-muted font-body italic leading-relaxed">
                &quot;{t.quote}&quot;
              </blockquote>

              <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                 <div className="w-12 h-12 rounded-full bg-brand-gradient flex items-center justify-center font-display font-800 text-white italic">
                    {t.author[0]}
                 </div>
                 <div>
                    <div className="font-display font-700 text-white uppercase tracking-wider">{t.author}</div>
                    <div className="text-text-muted font-body text-sm lowercase">{t.role}</div>
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
