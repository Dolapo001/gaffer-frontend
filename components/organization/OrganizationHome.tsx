'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { Menu, Share2, Trophy as TrophyIcon, Newspaper as NewsIcon, Bell, User as UserIcon } from 'lucide-react'
import { OrganizationSidebar } from './OrganizationSidebar'
import { getGlobalFeed, type FeedItem } from '@/lib/services/feed.service'
import { listOrgs } from '@/lib/services/org.service'
import { listCompetitions, type Competition } from '@/lib/services/competition.service'

export function OrganizationHome() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [news, setNews] = useState<FeedItem[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [hasOrg, setHasOrg] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [feed, orgs] = await Promise.all([
          getGlobalFeed(1),
          listOrgs()
        ])
        
        setNews((feed.data || feed.items || []).slice(0, 3))
        
        if (orgs && orgs.length > 0) {
           setHasOrg(true)
           const comps = await listCompetitions(orgs[0]._id)
           setCompetitions(comps)
        } else {
           setHasOrg(false)
        }
      } catch (err) {
        console.error('Failed to fetch admin data:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const displayName = user?.email?.split('@')[0] || 'Gaffer'

  return (
    <div className="h-screen flex flex-col bg-[#181928] overflow-hidden">
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <React.Fragment key="sidebar-container">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <OrganizationSidebar onClose={() => setIsSidebarOpen(false)} />
          </React.Fragment>
        )}
      </AnimatePresence>

      <header className="px-6 pt-12 pb-4 flex items-center justify-between flex-shrink-0 z-50">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="w-10 h-10 flex items-center justify-start text-white transition-colors"
        >
          <Menu size={24} />
        </button>
        <div className="flex flex-col items-center">
            <h1 className="font-chakra font-black text-xl bg-gradient-to-r from-[#FF8904] to-[#E7000B] bg-clip-text text-transparent tracking-widest uppercase">GAFFER</h1>
            <p className="text-[9px] font-chakra font-bold text-white/40 uppercase tracking-[2px]">Admin</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/admin/notifications')}
            className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors relative"
          >
            <Bell size={22} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#E7000B] rounded-full border-2 border-[#181928]" />
          </button>
          <button 
            onClick={() => router.push('/admin/profile')}
            className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <UserIcon size={22} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <main className="px-6 space-y-8 pb-32 pt-4">
          <section>
            <h2 className="text-white font-chakra font-bold text-lg mb-4 uppercase tracking-tight">Top News</h2>
            {isLoading ? (
              <div className="h-48 bg-white/5 animate-pulse rounded-[24px]" />
            ) : news.length > 0 ? (
              news.slice(0, 1).map(item => (
                <div key={item._id} className="bg-[#1E2032] rounded-[24px] overflow-hidden border border-white/5 shadow-2xl">
                  <div className="relative h-48 bg-gaffer-dark">
                    {item.media?.[0]?.url && (
                        <img src={item.media[0].url} className="w-full h-full object-cover" alt="" />
                    )}
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                       <div className="w-5 h-5 bg-[#FF4D00] rounded-full flex items-center justify-center font-black text-[8px] text-white">G</div>
                       <span className="text-xs font-chakra font-bold text-white uppercase tracking-wider">GAFFER</span>
                    </div>
                    <h3 className="text-white font-chakra font-black text-lg leading-tight uppercase line-clamp-2">{item.body.substring(0, 40)}...</h3>
                    <div className="flex items-center justify-between pt-2">
                       <div className="flex items-center gap-2">
                         <span className="text-orange-500 text-sm">🔥</span>
                         <span className="text-white font-chakra font-bold text-sm">{item.likesCount || 0}</span>
                       </div>
                       <Share2 size={16} className="text-white/40" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
                <div className="bg-[#1E2032] rounded-[24px] border border-white/5 p-6 flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
                        <NewsIcon className="text-white/20" size={32} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-white font-chakra font-bold">Post Your First News</p>
                        <p className="text-white/40 text-xs font-chakra">Keep your community updated with latest events</p>
                    </div>
                    <button 
                        onClick={() => router.push('/admin/news')}
                        className="w-full py-3 rounded-xl border border-white/10 hover:border-[#FF4D00] hover:text-[#FF4D00] text-white/60 font-chakra font-black text-sm uppercase transition-all duration-300"
                    >
                        Add News
                    </button>
                </div>
            )}
          </section>

          <section>
            <h2 className="text-white font-chakra font-bold text-lg mb-4 uppercase tracking-tight">Tournaments</h2>
            {isLoading ? (
               <div className="h-48 bg-white/5 animate-pulse rounded-[24px]" />
            ) : hasOrg === false ? (
                <div className="bg-[#1E2032] rounded-[24px] border border-white/5 p-8 flex flex-col items-center text-center space-y-6">
                  <div className="w-20 h-20 bg-gaffer-orange/10 rounded-full flex items-center justify-center">
                    <TrophyIcon className="text-gaffer-orange" size={40} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-white font-chakra font-bold text-xl uppercase tracking-tight">Complete Your Setup</p>
                    <p className="text-white/40 text-sm font-chakra max-w-[240px]">You need an organization to create tournaments and manage teams.</p>
                  </div>
                  <button
                    onClick={() => router.push('/auth/signup/organization')}
                    className="w-full py-4 rounded-xl font-chakra font-black text-lg bg-gradient-to-r from-[#FF8904] to-[#E7000B] text-white uppercase tracking-wider shadow-lg shadow-gaffer-orange/20"
                  >
                    Create Organization
                  </button>
                </div>
            ) : competitions.length > 0 ? (
               <div className="grid grid-cols-1 gap-4">
                 {competitions.slice(0, 2).map(comp => (
                    <div key={comp._id} className="bg-[#1E2032] p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                       <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center">
                          <TrophyIcon size={24} className="text-gaffer-orange" />
                       </div>
                       <div>
                          <h4 className="text-white font-chakra font-bold uppercase tracking-tight">{comp.name}</h4>
                          <p className="text-white/40 text-[10px] font-chakra uppercase">{comp.sport} • {comp.status}</p>
                       </div>
                    </div>
                 ))}
               </div>
            ) : (
                <div className="bg-[#1E2032] rounded-[24px] border border-white/5 p-6 flex flex-col items-center text-center space-y-6">
                  <div className="w-full h-40 rounded-2xl overflow-hidden bg-white/5 flex items-center justify-center grayscale">
                     <img src="/images/empty_tournament.png" className="w-full h-full object-cover opacity-60" alt="" />
                  </div>
                  <p className="text-white font-chakra font-bold text-lg">You Don&apos;t have any Tournament</p>
                  <button
                    onClick={() => router.push('/admin/tournaments')}
                    className="w-full py-4 rounded-xl font-chakra font-black text-lg bg-gradient-to-r from-[#FF8904] to-[#E7000B] text-white uppercase tracking-wider"
                  >
                    Create Tournament
                  </button>
                </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
