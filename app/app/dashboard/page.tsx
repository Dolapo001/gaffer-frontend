'use client'

import React, { useState, useLayoutEffect, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { Menu, Share2, Bell, Newspaper as NewsIcon, User as UserIcon, ShoppingBag } from 'lucide-react'
import { OrganizationSidebar } from '@/components/organization/OrganizationSidebar'
import { AccountUpgradeModal } from '@/components/AccountUpgradeModal'
import { getGlobalFeed, type FeedItem } from '@/lib/services/feed.service'
import { getWallet } from '@/lib/services/payment.service'
import { getImageUrl } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { listOrgs } from '@/lib/services/org.service'

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile, updateUser, setRole } = useAuthStore()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [news, setNews] = useState<FeedItem[]>([])
  const [isLoadingNews, setIsLoadingNews] = useState(true)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)

  const { data: orgs } = useQuery({ queryKey: ['orgs'], queryFn: listOrgs, enabled: !!user })
  const hasOrg = (orgs && orgs.length > 0) || user?.isOrgActive

  useLayoutEffect(() => {
    const handleUpgrade = () => setUpgradeModalOpen(true)
    window.addEventListener('gaffer:upgrade-org', handleUpgrade)
    return () => window.removeEventListener('gaffer:upgrade-org', handleUpgrade)
  }, [])

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const feed = await getGlobalFeed(1)
        setNews((feed.data || feed.items || []).slice(0, 3))
      } catch (err) {
        console.error('Failed to fetch news:', err)
      } finally {
        setIsLoadingNews(false)
      }
    }
    const fetchWallet = async () => {
      try {
        const wallet = await getWallet()
        setWalletBalance(wallet.balance)
      } catch (err) {
        console.error('Failed to fetch wallet:', err)
      }
    }
    fetchNews()
    fetchWallet()
  }, [])

  const displayName = profile?.fullName || profile?.username || user?.email?.split('@')[0] || 'Gaffer'

  return (
    <div className="h-screen flex flex-col bg-[#181928] overflow-hidden relative">
      {/* ... Sidebar & Modal ... */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <React.Fragment key="sidebar-overlay">
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

      <AccountUpgradeModal 
          isOpen={upgradeModalOpen} 
          onClose={() => setUpgradeModalOpen(false)} 
          targetRole="organization" 
      />

      {/* Header */}
      <header className="px-6 pt-12 pb-4 flex items-center justify-between flex-shrink-0 z-50">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="w-10 h-10 flex items-center justify-start text-white hover:text-orange-gaffer transition-colors"
        >
          <Menu size={24} />
        </button>
        <div className="flex flex-col items-center">
            <h1 className="font-chakra font-black text-xl bg-gradient-to-r from-[#FF8904] to-[#E7000B] bg-clip-text text-transparent tracking-widest uppercase">GAFFER</h1>
            <p className="text-[9px] font-chakra font-bold text-white/40 uppercase tracking-[2px]">Personal</p>
        </div>
        <div className="flex items-center gap-2">
          {walletBalance !== null && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => router.push('/app/shop')}
              className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full cursor-pointer hover:bg-white/10 transition-all mr-1"
            >
              <span className="text-orange-500 text-sm">💰</span>
              <span className="text-[11px] font-chakra font-black text-white">{walletBalance}</span>
            </motion.div>
          )}
          <button 
            onClick={() => router.push('/app/notifications')}
            className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <Bell size={22} />
          </button>
          <button 
            onClick={() => router.push('/app/profile')}
            className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <UserIcon size={22} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6">
        <main className="space-y-8 pb-32 pt-4">
          <div>
             <p className="font-chakra text-white/40 text-xs font-bold uppercase tracking-wider">Good Day,</p>
             <h2 className="font-chakra font-black text-2xl text-white uppercase tracking-tight -mt-1">{displayName}</h2>
          </div>

          {/* Top News Section */}
          <section>
            <h2 className="text-white font-chakra font-bold text-lg mb-4 uppercase tracking-tight">Top News</h2>
            
            {isLoadingNews ? (
              <div className="h-48 bg-white/5 animate-pulse rounded-[24px]" />
            ) : news.length > 0 ? (
              news.slice(0, 1).map(item => (
                <div key={item._id} className="bg-[#1E2032] rounded-[24px] overflow-hidden border border-white/5 shadow-2xl">
                  <div className="relative h-48 bg-gaffer-dark">
                    {item.media?.[0]?.url && (
                        <img src={getImageUrl(item.media[0].url)} className="w-full h-full object-cover" alt="" />
                    )}
                    <div className="absolute bottom-3 left-4 bg-black/40 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white/80 font-chakra">
                       {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-[#FF4D00] rounded-full flex items-center justify-center font-black text-[8px] text-white">G</div>
                      <span className="text-xs font-chakra font-bold text-white uppercase">GAFFER</span>
                    </div>
                    <h3 className="text-white font-chakra font-black text-lg leading-tight uppercase line-clamp-2">{item.body.substring(0, 50)}...</h3>
                    <p className="text-white/60 text-xs font-chakra line-clamp-2">{item.body}</p>
                    <div className="flex items-center justify-between pt-2">
                       <div className="flex items-center gap-2">
                         <span className="text-orange-500 text-sm">🔥</span>
                         <span className="text-white font-chakra font-bold text-sm tracking-tight">{item.likesCount || 0}</span>
                       </div>
                       <Share2 size={16} className="text-white/40" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
                <div className="bg-white/5 rounded-[24px] p-12 text-center border border-dashed border-white/10">
                    <NewsIcon className="mx-auto text-white/10 mb-2" />
                    <p className="text-white/40 font-chakra text-sm">No news available</p>
                </div>
            )}
          </section>

          {/* Tournament Section */}
          <section>
            <div className="bg-[#1E2032] rounded-[24px] overflow-hidden border border-white/5 p-6 flex flex-col items-center text-center space-y-6">
              <div className="w-full h-40 rounded-2xl overflow-hidden bg-white/5 flex items-center justify-center">
                 <img src="/images/empty_tournament.png" className="w-full h-full object-cover opacity-60" alt="" />
              </div>
              {hasOrg ? (
                <>
                  <p className="text-white font-chakra font-bold text-lg">Switch to Manager Account</p>
                  <p className="text-white/40 text-xs font-chakra -mt-4">You have an active organization waiting for you in the admin area.</p>
                  <button
                    onClick={() => {
                      updateUser({ isOrgActive: true, lastRole: 'organization' })
                      setRole('organization')
                      router.push('/admin')
                    }}
                    className="w-full py-4 rounded-xl font-chakra font-black text-lg bg-gradient-to-r from-[#FF8904] to-[#E7000B] text-white uppercase tracking-wider"
                  >
                    Go to Admin
                  </button>
                </>
              ) : (
                <>
                  <p className="text-white font-chakra font-bold text-lg">Start a New Tournament</p>
                  <button
                    onClick={() => setUpgradeModalOpen(true)}
                    className="w-full py-4 rounded-xl font-chakra font-black text-lg bg-gradient-to-r from-[#FF8904] to-[#E7000B] text-white uppercase tracking-wider"
                  >
                    Upgrade to Org
                  </button>
                </>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
