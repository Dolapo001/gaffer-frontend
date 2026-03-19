'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { getGlobalFeed, type FeedItem } from '@/lib/services/feed.service'
import { listOrgs, type Org } from '@/lib/services/org.service'
import { GafferLogo } from '@/components/GafferLogo'
import { SkeletonCard } from '@/components/home/SkeletonCard'
import { Bell, Newspaper } from 'lucide-react'

// ─── Feed Item Card ───────────────────────────────────────────────────────────

function FeedCard({ item, onClick }: { item: FeedItem; onClick: () => void }) {
  const firstImage = item.media?.find((m) => m.type === 'image')
  const timeAgo = formatTimeAgo(item.createdAt)

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left bg-gaffer-card border border-gaffer-border rounded-2xl overflow-hidden"
    >
      {firstImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={firstImage.url} alt="" className="w-full h-40 object-cover" />
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] font-display font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border ${
            item.type === 'news'
              ? 'text-gaffer-orange bg-gaffer-orange/10 border-gaffer-orange/30'
              : 'text-blue-400 bg-blue-400/10 border-blue-400/30'
          }`}>
            {item.type}
          </span>
          <span className="text-gaffer-subtle text-[10px] font-body ml-auto">{timeAgo}</span>
        </div>
        <p className="text-white font-body font-medium text-sm leading-relaxed line-clamp-3">
          {item.body}
        </p>
        {item.likesCount > 0 && (
          <p className="text-gaffer-subtle text-[10px] font-body mt-2">
            ❤ {item.likesCount} {item.likesCount === 1 ? 'like' : 'likes'}
          </p>
        )}
      </div>
    </motion.button>
  )
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile } = useAuthStore()
  const [page, setPage] = useState(1)

  const displayName =
    profile?.fullName || profile?.username || user?.email?.split('@')[0] || 'Gaffer'

  const { data: feedData, isLoading: feedLoading } = useQuery({
    queryKey: ['global-feed', page],
    queryFn: () => getGlobalFeed(page),
    staleTime: 60_000,
  })

  const { data: orgs } = useQuery({
    queryKey: ['orgs'],
    queryFn: listOrgs,
    staleTime: 5 * 60_000,
  })

  const feedItems: FeedItem[] = (feedData?.items ?? feedData?.data ?? []) as FeedItem[]
  const featuredItem = feedItems[0]
  const restItems = feedItems.slice(1)

  return (
    <div className="min-h-screen bg-gaffer-bg pb-28">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <GafferLogo size="sm" />
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/app/notifications')}
            className="w-9 h-9 rounded-full bg-gaffer-card border border-gaffer-border flex items-center justify-center text-gaffer-muted hover:text-white transition-colors"
          >
            <Bell size={18} />
          </button>
          <button
            onClick={() => router.push('/app/profile')}
            className="w-9 h-9 rounded-full bg-orange-gradient-btn flex items-center justify-center text-white font-display font-bold text-sm shadow-orange-glow"
          >
            {displayName[0].toUpperCase()}
          </button>
        </div>
      </div>

      {/* Greeting */}
      <div className="px-4 pb-4">
        <p className="font-body text-gaffer-muted text-sm">Welcome back,</p>
        <h1 className="font-display font-bold text-2xl text-white leading-tight">{displayName}</h1>
      </div>

      <div className="px-4 space-y-6">
        {/* Orgs quick access */}
        {orgs && orgs.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-white text-base tracking-wide">
                My Organizations
              </h2>
              <button
                onClick={() => router.push('/admin')}
                className="text-gaffer-orange text-xs font-body font-medium"
              >
                See all
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
              {orgs.slice(0, 5).map((org: Org) => (
                <button
                  key={org._id}
                  onClick={() => router.push('/admin')}
                  className="flex-shrink-0 flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gaffer-card border border-gaffer-border flex items-center justify-center text-gaffer-orange font-display font-bold text-lg">
                    {org.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={org.logoUrl} alt={org.name} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      org.name[0].toUpperCase()
                    )}
                  </div>
                  <span className="text-gaffer-muted text-[10px] font-body truncate max-w-[48px]">
                    {org.name}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Top News / Feed */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-white text-base tracking-wide">
              Latest News
            </h2>
          </div>

          {feedLoading ? (
            <div className="space-y-4">
              <SkeletonCard size="large" />
              <SkeletonCard size="small" />
            </div>
          ) : featuredItem ? (
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <FeedCard item={featuredItem} onClick={() => {}} />
              </motion.div>
              {restItems.slice(0, 4).map((item, i) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (i + 1) * 0.06 }}
                >
                  <FeedCard item={item} onClick={() => {}} />
                </motion.div>
              ))}

              {/* Pagination */}
              {feedData && feedData.total > feedItems.length && (
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="w-full py-3 rounded-xl border border-gaffer-border text-gaffer-orange text-sm font-body"
                >
                  Load more
                </button>
              )}
            </div>
          ) : (
            <div className="bg-gaffer-card border border-gaffer-border rounded-2xl p-8 text-center">
              <Newspaper size={32} className="text-gaffer-subtle mx-auto mb-3" />
              <p className="text-gaffer-muted font-body text-sm">No news yet</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
