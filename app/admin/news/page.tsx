'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Flame, Share2, Clock } from 'lucide-react'
import { GradientButton } from '@/components/GradientButton'

export default function AdminNewsPage() {
  const [newsContent, setNewsContent] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setSelectedImage(url)
    }
  }

  const mockNews = [
    {
      id: '1',
      title: 'Barcelona 3-3 Manchester City: Omoba and Pascal on the Scoresheet',
      source: 'BOWN FANS LEAGUE',
      timeAgo: '10 mins ago',
      likes: 342,
      image: '/images/premier_league_news.png',
      sourceIcon: '/images/bown_fans_logo.png'
    },
    {
      id: '2',
      title: 'Barcelona 3-3 Manchester City:',
      source: 'BOWN FANS LEAGUE',
      timeAgo: '10 mins ago',
      likes: 342,
      image: '/images/premier_league_news.png',
      sourceIcon: '/images/bown_fans_logo.png'
    }
  ]

  return (
    <div className="min-h-screen bg-[#0F111A] pb-32 pt-8">
      <div className="px-6 space-y-8">
        {/* Posting Interface */}
        <div className="space-y-4">
          <div className="relative group">
            <div className="flex flex-col bg-[#1C1F2D] border border-white/5 rounded-[24px] overflow-hidden shadow-xl focus-within:border-white/10 transition-all">
              {selectedImage && (
                <div className="relative h-40 w-full bg-black/40">
                  <img src={selectedImage} className="w-full h-full object-cover" alt="Preview" />
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
                  >
                    <Plus size={14} className="rotate-45" />
                  </button>
                </div>
              )}
              <textarea
                value={newsContent}
                onChange={(e) => setNewsContent(e.target.value)}
                placeholder="What's News are we posting today"
                className="w-full h-32 bg-transparent p-6 text-white text-sm focus:outline-none resize-none placeholder:text-white/30"
              />
            </div>
            
            <label className="absolute bottom-6 left-6 w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageChange}
              />
              <Plus size={20} />
            </label>
          </div>
          <GradientButton 
            className="h-14 rounded-2xl font-chakra font-black text-base uppercase tracking-wider shadow-2xl shadow-orange-500/20"
            style={{ background: 'linear-gradient(90deg, #FF8A00 0%, #FF0000 100%)' }}
          >
            Post
          </GradientButton>
        </div>

        {/* Top News Section */}
        <div className="space-y-6">
          <h2 className="font-chakra font-bold text-lg text-white tracking-tight">Top News</h2>
          
          <div className="space-y-6">
            {mockNews.map((news, i) => (
              <motion.div
                key={news.id + i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#1C1F2D] rounded-[28px] overflow-hidden border border-white/5 shadow-2zl group"
              >
                {/* Image Section */}
                <div className="relative h-[210px] overflow-hidden">
                  <img src={news.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/5">
                    <Clock size={12} className="text-white/60" />
                    <span className="text-[10px] text-white/80 font-medium">{news.timeAgo}</span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10 bg-black/20">
                      <img src={news.sourceIcon} className="w-full h-full object-cover" alt="" />
                    </div>
                    <span className="font-chakra font-black text-[11px] text-white uppercase tracking-wider flex items-center gap-1.5 pt-0.5">
                      {news.source}
                      <div className="w-3.5 h-3.5 bg-orange-500 rounded-full flex items-center justify-center">
                        <svg width="8" height="6" viewBox="0 0 10 8" fill="none" className="text-white">
                          <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </span>
                  </div>
                  
                  <h3 className="font-chakra font-black text-xl text-white uppercase leading-snug tracking-tight">
                    {news.title}
                  </h3>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <Flame size={18} className="text-orange-500" />
                      <span className="font-chakra font-bold text-orange-500 text-sm">{news.likes}</span>
                    </div>
                    <button className="p-2 rounded-full hover:bg-white/5 transition-colors">
                      <Share2 size={18} className="text-white/40 hover:text-white" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
