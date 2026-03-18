'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { Menu, Share2, Flame, Plus } from 'lucide-react'
import { NewsCard } from '@/components/home/NewsCard'
import { GradientButton } from '@/components/GradientButton'
import { OrganizationSidebar } from './OrganizationSidebar'

export function OrganizationHome() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const mockNews = {
    id: 'welcome-news',
    image: '/images/handshake_news.png',
    source: { name: 'GAFFER', verified: true },
    title: 'WELCOME TO GAFFER',
    excerpt: 'Take control of your sporting activities, be the manager of your own club',
    likes: 342,
    timeAgo: '10 mins ago'
  }

  return (
    <div className="min-h-screen bg-[#0F111A] pb-24 relative overflow-x-hidden">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <OrganizationSidebar onClose={() => setIsSidebarOpen(false)} />
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="px-6 pt-12 pb-4 flex items-center justify-between sticky top-0 bg-[#0F111A]/80 backdrop-blur-md z-40">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="w-10 h-10 flex items-center justify-center text-white/90 hover:text-white transition-colors"
        >
          <Menu size={24} />
        </button>
      </header>

      <main className="px-6 space-y-8 mt-2">
        {/* Top News Section */}
        <section className="space-y-4">
          <h2 className="font-chakra font-bold text-xl text-white tracking-tight uppercase">Top News</h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-[#1C1F2D] rounded-[24px] overflow-hidden border border-white/5 shadow-xl group">
              <div className="relative h-[200px] overflow-hidden">
                <img src={mockNews.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
                <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/5">
                  <div className="w-1 h-1 rounded-full bg-orange-500 animate-pulse" />
                  <span className="text-[10px] text-white/80 font-medium">{mockNews.timeAgo}</span>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center shadow-lg shadow-orange-900/20">
                    <UserIcon />
                  </div>
                  <span className="font-chakra font-black text-xs text-white uppercase tracking-wider flex items-center gap-1">
                    GAFFER
                    <div className="w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center">
                      <CheckIcon />
                    </div>
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-chakra font-black text-2xl text-white uppercase leading-[1.1] tracking-tight">
                    {mockNews.title}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed font-medium">
                    {mockNews.excerpt}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <Flame size={18} className="text-orange-500" />
                    <span className="font-chakra font-bold text-orange-500">{mockNews.likes}</span>
                  </div>
                  <button className="p-2 rounded-full hover:bg-white/5 transition-colors">
                    <Share2 size={18} className="text-white/40" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Tournament CTA Section */}
        <section>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-[#1C1F2D] rounded-[28px] overflow-hidden border border-white/5 shadow-2xl relative"
          >
            <div className="relative h-[240px] flex items-center justify-center p-8 bg-[#0F111A]/40">
              <img src="/images/empty_tournament.png" className="absolute inset-0 w-full h-full object-cover opacity-80" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C1F2D] via-transparent to-transparent" />
            </div>
            <div className="p-6 pb-8 space-y-5 text-center flex flex-col items-center relative z-10 -mt-8">
              <h4 className="font-chakra font-bold text-[17px] text-white/90 tracking-tight">
                You Don't have any Tournament
              </h4>
                <div className="w-full px-2">
                  <GradientButton 
                    onClick={() => router.push('/admin/tournaments')}
                    className="h-14 rounded-2xl font-chakra font-black text-base uppercase tracking-wider shadow-2xl shadow-orange-500/20"
                    style={{ background: 'linear-gradient(90deg, #FF8A00 0%, #FF0000 100%)' }}
                  >
                    Create Tournament
                  </GradientButton>
                </div>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  )
}

function UserIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="6" height="6" viewBox="0 0 10 8" fill="none" className="text-white">
      <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
