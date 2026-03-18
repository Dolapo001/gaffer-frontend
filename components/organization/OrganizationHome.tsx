'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { listOrgs } from '@/lib/services/org.service'
import { listCompetitions } from '@/lib/services/competition.service'
import { getGlobalFeed } from '@/lib/services/feed.service'
import { Menu, Trophy, Plus, Newspaper, Users, Calendar } from 'lucide-react'
import { OrganizationSidebar } from './OrganizationSidebar'
import { GradientButton } from '@/components/GradientButton'

export function OrganizationHome() {
  const router = useRouter()
  const { user, role } = useAuthStore()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const { data: orgs } = useQuery({
    queryKey: ['orgs'],
    queryFn: listOrgs,
  })

  const firstOrg = orgs?.[0]

  const { data: competitions } = useQuery({
    queryKey: ['competitions', firstOrg?._id],
    queryFn: () => listCompetitions(firstOrg!._id),
    enabled: !!firstOrg?._id,
  })

  const { data: feedData } = useQuery({
    queryKey: ['global-feed', 1],
    queryFn: () => getGlobalFeed(1),
    staleTime: 60_000,
  })

  const feedItems = (feedData?.items ?? feedData?.data ?? []) as any[]
  const latestNews = feedItems.slice(0, 3)

  const publishedComps = (competitions ?? []).filter((c) => c.status === 'published')
  const draftComps = (competitions ?? []).filter((c) => c.status === 'draft')

  return (
    <div className="min-h-screen bg-gaffer-bg pb-24 relative overflow-x-hidden">
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
      <header className="px-4 pt-12 pb-4 flex items-center justify-between sticky top-0 bg-gaffer-bg/95 backdrop-blur-md z-40 border-b border-gaffer-border">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="w-10 h-10 flex items-center justify-center text-white hover:text-gaffer-orange transition-colors"
        >
          <Menu size={22} />
        </button>
        <div className="text-center">
          {firstOrg && (
            <p className="text-white font-display font-bold text-sm">{firstOrg.name}</p>
          )}
          {role === 'organization' && (
            <p className="text-gaffer-orange text-[10px] font-body">Admin Dashboard</p>
          )}
        </div>
        <button
          onClick={() => router.push('/admin/tournaments')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gaffer-orange/10 border border-gaffer-orange/30 text-gaffer-orange"
        >
          <Plus size={18} />
        </button>
      </header>

      <main className="px-4 space-y-6 mt-4">
        {/* Quick stats */}
        {firstOrg && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Competitions', value: String(competitions?.length ?? 0), icon: Trophy, color: 'text-gaffer-orange' },
              { label: 'Active', value: String(publishedComps.length), icon: Calendar, color: 'text-green-400' },
              { label: 'Draft', value: String(draftComps.length), icon: Users, color: 'text-yellow-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-gaffer-card border border-gaffer-border rounded-2xl p-3 text-center">
                <Icon size={18} className={`${color} mx-auto mb-1`} />
                <p className="font-display font-black text-xl text-white">{value}</p>
                <p className="text-gaffer-muted text-[10px] font-body">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Competitions */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-white text-sm tracking-wide">Competitions</h2>
            <button
              onClick={() => router.push('/admin/tournaments')}
              className="text-gaffer-orange text-xs font-body font-medium"
            >
              Manage
            </button>
          </div>
          {competitions && competitions.length > 0 ? (
            <div className="space-y-2">
              {competitions.slice(0, 4).map((comp) => (
                <motion.button
                  key={comp._id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(`/admin/tournaments/${comp._id}`)}
                  className="w-full flex items-center gap-3 bg-gaffer-card border border-gaffer-border rounded-xl p-3 text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-gaffer-orange/10 flex items-center justify-center">
                    <Trophy size={16} className="text-gaffer-orange" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-body font-medium text-sm truncate">{comp.name}</p>
                    <p className="text-gaffer-muted text-xs font-body capitalize">{comp.sport}</p>
                  </div>
                  <span className={`text-[10px] font-display font-bold px-2 py-0.5 rounded-full border ${
                    comp.status === 'published'
                      ? 'text-green-400 bg-green-400/10 border-green-400/30'
                      : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
                  }`}>
                    {comp.status}
                  </span>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="bg-gaffer-card border border-gaffer-border rounded-2xl p-6 text-center">
              <Trophy size={28} className="text-gaffer-subtle mx-auto mb-3" />
              <p className="text-white font-body font-medium text-sm mb-4">No competitions yet</p>
              <GradientButton onClick={() => router.push('/admin/tournaments')}>
                Create Competition
              </GradientButton>
            </div>
          )}
        </section>

        {/* News feed */}
        {latestNews.length > 0 && (
          <section>
            <h2 className="font-display font-bold text-white text-sm tracking-wide mb-3">Latest News</h2>
            <div className="space-y-3">
              {latestNews.map((item: any) => (
                <div key={item._id} className="bg-gaffer-card border border-gaffer-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Newspaper size={12} className="text-gaffer-orange" />
                    <span className="text-gaffer-orange text-[10px] font-display font-bold uppercase tracking-wide">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-white text-sm font-body line-clamp-2">{item.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
