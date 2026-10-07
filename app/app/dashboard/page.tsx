'use client'

import React, { useState, useLayoutEffect, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { Menu, Share2, Newspaper as NewsIcon, User as UserIcon, ShoppingBag } from 'lucide-react'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { OrganizationSidebar } from '@/components/organization/OrganizationSidebar'
import { getGlobalFeed, getOrgFeed, type FeedItem } from '@/lib/services/feed.service'
import { listJoinedCompetitions } from '@/lib/services/competition.service'
import { getPublisherName, getInitials } from '@/components/fantasy/NewsFeedWidget'
import { rankTopNews, resolveOrgId, isGafferNews } from '@/lib/newsRanking'
import { getImageUrl } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { listOrgs } from '@/lib/services/org.service'
import { useWallet } from '@/hooks/useWallet'

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile, updateUser, setRole } = useAuthStore()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [news, setNews] = useState<FeedItem[]>([])
  const [isLoadingNews, setIsLoadingNews] = useState(true)

  const { data: orgs } = useQuery({ queryKey: ['orgs'], queryFn: listOrgs, enabled: !!user })
  const hasOrg = (orgs && orgs.length > 0) || user?.isOrgActive
  const { data: wallet } = useWallet()
  const walletBalance = wallet?.balance ?? null

  useLayoutEffect(() => {
    const handleUpgrade = () => router.push('/onboarding/organization')
    window.addEventListener('gaffer:upgrade-org', handleUpgrade)
    return () => window.removeEventListener('gaffer:upgrade-org', handleUpgrade)
  }, [router])

  // Top News: news from the organisations running tournaments this user is in
  // comes first, then the global feed.
  useEffect(() => {
    if (!user) return
    let cancelled = false
    const fetchNews = async () => {
      try {
        const joined = await listJoinedCompetitions().catch(() => [])
        const orgIds = Array.from(new Set(joined.map((c) => resolveOrgId(c.orgId)).filter(Boolean) as string[]))
        const orgFeeds = await Promise.all(
          orgIds.map((id) => getOrgFeed(id).then((r) => (r.items ?? r.data ?? []) as FeedItem[]).catch(() => [] as FeedItem[]))
        )
        const mine = rankTopNews(orgFeeds.flat().filter((i) => !i.isDefault))
        const feed = await getGlobalFeed(1).catch(() => null)
        const global = rankTopNews((feed?.data ?? feed?.items ?? []) as FeedItem[])
        const seen = new Set<string>()
        // Official Gaffer news from HQ comes before everything, then news from the organisations the player joined.
        const merged = [...global.filter(isGafferNews), ...mine, ...global].filter((i) => !seen.has(i._id) && seen.add(i._id))
        if (!cancelled) setNews(merged.slice(0, 3))
      } catch (err) {
        console.error('Failed to fetch news:', err)
      } finally {
        if (!cancelled) setIsLoadingNews(false)
      }
    }
    fetchNews()
    return () => { cancelled = true }
  }, [user])

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

      {/* Header */}
      <header
        className="px-6 pb-4 flex-shrink-0 z-50"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        <div className="flex items-center justify-between">
          {/* Left — menu */}
          <div className="flex-1 flex justify-start">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="w-10 h-10 flex items-center justify-start text-white hover:text-orange-gaffer transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>

          {/* Right — wallet, bell, profile */}
          <div className="flex-1 flex items-center justify-end gap-1">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: walletBalance !== null ? 1 : 0, scale: walletBalance !== null ? 1 : 0.8 }}
              onClick={() => walletBalance !== null && router.push('/app/shop')}
              className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full cursor-pointer hover:bg-white/10 transition-all"
              style={{ pointerEvents: walletBalance !== null ? 'auto' : 'none', visibility: walletBalance !== null ? 'visible' : 'hidden' }}
            >
              <span className="text-orange-500 text-sm">💰</span>
              <span className="text-[11px] font-chakra font-black text-white">{walletBalance ?? 0}</span>
            </motion.div>
            <NotificationBell />
            <button
              onClick={() => router.push('/app/profile')}
              className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <UserIcon size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6">
        <main className="space-y-8 pb-24 pt-4">
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
                <div
                  key={item._id}
                  className="bg-[#1E2032] rounded-[24px] overflow-hidden border border-white/5 shadow-2xl cursor-pointer active:opacity-80 transition-opacity"
                  onClick={() => router.push(`/app/news/${item._id}?returnTo=/app/dashboard`)}
                >
                  <div className="relative h-48 bg-gaffer-dark">
                    {(item.media?.[0]?.url || item.imageUrl) && (
                        <img src={getImageUrl((item.media?.[0]?.url || item.imageUrl)!)} className="w-full h-full object-cover" alt="" />
                    )}
                    <div className="absolute bottom-3 left-4 bg-black/40 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white/80 font-chakra">
                       {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-[#FF4D00] rounded-full flex items-center justify-center font-black text-[8px] text-white">{getInitials(getPublisherName(item))}</div>
                      <span className="text-xs font-chakra font-bold text-white uppercase">{getPublisherName(item)}</span>
                    </div>
                    <h3 className="text-white font-chakra font-black text-lg leading-tight uppercase line-clamp-2">{item.title || (item.body.length > 50 ? item.body.substring(0, 50) + '...' : item.body)}</h3>
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
                    className="w-full py-4 rounded-xl font-chakra font-black text-sm bg-gradient-to-r from-[#FF8904] to-[#E7000B] text-white uppercase tracking-wider"
                  >
                    Go to Organization
                  </button>
                </>
              ) : (
                <>
                  <p className="text-white font-chakra font-bold text-lg">Start a New Tournament</p>
                  <button
                    onClick={() => router.push('/onboarding/organization')}
                    className="w-full py-4 rounded-xl font-chakra font-black text-sm bg-gradient-to-r from-[#FF8904] to-[#E7000B] text-white uppercase tracking-wider"
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
