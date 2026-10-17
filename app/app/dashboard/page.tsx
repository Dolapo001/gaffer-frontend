'use client'

import React, { useState, useLayoutEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { Menu, Newspaper as NewsIcon, User as UserIcon } from 'lucide-react'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { OrganizationSidebar } from '@/components/organization/OrganizationSidebar'
import { getGlobalFeed, getNewsFeed, type FeedItem, type FeedPage } from '@/lib/services/feed.service'
import { NewsCard } from '@/components/home/NewsCard'
import { PostCard } from '@/components/home/PostCard'
import { LiveNowCard } from '@/components/home/LiveNowCard'
import { toNewsCardProps } from '@/lib/newsCardProps'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useWallet } from '@/hooks/useWallet'

const PAGE = 20
const itemsOf = (p: FeedPage): FeedItem[] => (p.items ?? p.data ?? []) as FeedItem[]
const uniqueById = (list: FeedItem[]) => { const seen = new Set<string>(); return list.filter((i) => !seen.has(i._id) && seen.add(i._id)) }

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile } = useAuthStore()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { data: wallet } = useWallet()
  const walletBalance = wallet?.balance ?? null

  useLayoutEffect(() => {
    const handleUpgrade = () => router.push('/onboarding/organization')
    window.addEventListener('gaffer:upgrade-org', handleUpgrade)
    return () => window.removeEventListener('gaffer:upgrade-org', handleUpgrade)
  }, [router])

  // News from every competition on the app, newest first, with the official Gaffer post pinned on top
  const newsQ = useInfiniteQuery({
    queryKey: ['home-news'],
    queryFn: ({ pageParam }) => getNewsFeed(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last, all) => (itemsOf(last).length >= PAGE ? all.length + 1 : undefined),
    enabled: !!user,
    staleTime: 60_000,
  })
  const news = useMemo(() => {
    const all = uniqueById((newsQ.data?.pages ?? []).flatMap(itemsOf).filter((i) => i.type === 'news' || i.authorType === 'system'))
    const pinned = all.filter((i) => i.authorType === 'system' || i.isPinned)
    const rest = all.filter((i) => !(i.authorType === 'system' || i.isPinned))
    return [...pinned, ...rest]
  }, [newsQ.data])

  // Posts people write: reply, repost and react like a social feed
  const postsQ = useInfiniteQuery({
    queryKey: ['home-posts'],
    queryFn: ({ pageParam }) => getGlobalFeed(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last, all) => (itemsOf(last).length >= PAGE ? all.length + 1 : undefined),
    enabled: !!user,
    staleTime: 60_000,
  })
  const posts = useMemo(
    () => uniqueById((postsQ.data?.pages ?? []).flatMap(itemsOf).filter((i) => i.type === 'post' || i.type === 'repost')),
    [postsQ.data],
  )

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
        <main className="space-y-8 pt-4" style={{ paddingBottom: 'calc(140px + env(safe-area-inset-bottom, 0px))' }}>
          <div>
             <p className="font-chakra text-white/40 text-xs font-bold uppercase tracking-wider">Good Day,</p>
             <h2 className="font-chakra font-black text-2xl text-white uppercase tracking-tight -mt-1">{displayName}</h2>
          </div>

          {/* Matches being played right now in my leagues */}
          <LiveNowCard />

          {/* News: people only react to it */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-chakra font-bold text-lg uppercase tracking-tight">Top News</h2>
              {news.length > 0 && (
                <button onClick={() => router.push('/app/news')} className="text-gaffer-orange text-[11px] font-chakra font-black uppercase tracking-widest">
                  See all
                </button>
              )}
            </div>

            {newsQ.isLoading ? (
              <div className="h-48 bg-white/5 animate-pulse rounded-[24px]" />
            ) : news.length > 0 ? (
              <div className="space-y-4">
                {news.map((item) => (
                  <NewsCard key={item._id} {...toNewsCardProps(item)} size="large" onClick={() => router.push(`/app/news/${item._id}?returnTo=/app/dashboard`)} />
                ))}
                {newsQ.hasNextPage && (
                  <button onClick={() => newsQ.fetchNextPage()} disabled={newsQ.isFetchingNextPage} className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 text-white text-[11px] font-chakra font-black uppercase tracking-widest disabled:opacity-50">
                    {newsQ.isFetchingNextPage ? 'Loading…' : 'More news'}
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white/5 rounded-[24px] p-12 text-center border border-dashed border-white/10">
                <NewsIcon className="mx-auto text-white/10 mb-2" />
                <p className="text-white/40 font-chakra text-sm">No news yet</p>
              </div>
            )}
          </section>

          {/* Posts: comment, repost, react */}
          {(postsQ.isLoading || posts.length > 0) && (
            <section>
              <h2 className="text-white font-chakra font-bold text-lg mb-4 uppercase tracking-tight">Trending</h2>
              {postsQ.isLoading ? (
                <div className="h-40 bg-white/5 animate-pulse rounded-[24px]" />
              ) : (
                <div className="space-y-4">
                  {posts.map((item) => (
                    <PostCard key={item._id} item={item} onOpen={() => router.push(`/app/news/${(item.type === 'repost' && item.parentFeedId ? item.parentFeedId._id : item._id)}?returnTo=/app/dashboard`)} />
                  ))}
                  {postsQ.hasNextPage && (
                    <button onClick={() => postsQ.fetchNextPage()} disabled={postsQ.isFetchingNextPage} className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 text-white text-[11px] font-chakra font-black uppercase tracking-widest disabled:opacity-50">
                      {postsQ.isFetchingNextPage ? 'Loading…' : 'More posts'}
                    </button>
                  )}
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
