'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'

interface StatProps {
  number: string
  label: string
  suffix?: string
}

function Stat({ number, label, suffix = '' }: StatProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (isInView) {
      const target = parseFloat(number.replace(/,/g, ''))
      const duration = 2000 // 2 seconds
      const interval = 20
      const steps = duration / interval
      const stepValue = target / steps
      
      let current = 0
      const timer = setInterval(() => {
        current += stepValue
        if (current >= target) {
          setCount(target)
          clearInterval(timer)
        } else {
          setCount(Math.floor(current))
        }
      }, interval)

      return () => clearInterval(timer)
    }
  }, [isInView, number])

  const formattedCount = count.toLocaleString()

  return (
    <div ref={ref} className="flex flex-col items-center justify-center py-6 md:py-12 w-full group overflow-hidden relative border-orange-gaffer/10 md:border-x">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative"
      >
        <span className="text-3xl sm:text-4xl md:text-5xl font-display font-900 text-gradient-brand tracking-tight italic">
          {formattedCount}{suffix}
        </span>
        {/* Subtle background glow on hover */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1/2 bg-orange-gaffer/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.div>
      <motion.span
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="font-chakra text-[10px] md:text-[14px] text-text-muted tracking-[0.2em] uppercase mt-2 text-center px-2"
      >
        {label}
      </motion.span>
    </div>
  )
}

const STATS = [
  { number: '10,000', label: 'Active Players', suffix: '+' },
  { number: '500', label: 'Leagues Tracked', suffix: '+' },
  { number: '98', label: 'Uptime', suffix: '%' },
  { number: '50', label: 'Supported Sports', suffix: '+' },
]

export function StatsBar() {
  return (
    <section className="bg-transparent border-y border-white/5 w-full overflow-hidden">
      <div className="grid grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto divide-x divide-white/5">
        {STATS.map((stat, i) => (
          <Stat 
            key={i} 
            number={stat.number} 
            label={stat.label} 
            suffix={stat.suffix} 
          />
        ))}
      </div>
    </section>
  )
}
