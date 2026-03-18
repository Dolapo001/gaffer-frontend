'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useTournamentStore } from '@/store/tournamentStore'
import { GafferLogo } from '@/components/GafferLogo'
import { NewsCard } from '@/components/home/NewsCard'
import { TournamentBanner } from '@/components/home/TournamentBanner'
import { ArticleDetail } from '@/components/home/ArticleDetail'
import { SkeletonCard } from '@/components/home/SkeletonCard'
import { TOP_NEWS, type Article } from '@/lib/mockData'
import { Bell } from 'lucide-react'
import { useToast } from '@/store/toastStore'

function fetchTopNews(): Promise<Article[]> {
  return new Promise((resolve) => setTimeout(() => resolve(TOP_NEWS), 800))
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { addToast } = useToast()
  const { tournaments } = useTournamentStore()
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Gaffer'
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)

  const { data: news, isLoading } = useQuery({
    queryKey: ['top-news'],
    queryFn: fetchTopNews,
  })

  const featuredArticle = news?.[0]

  return (
    <AnimatePresence mode="wait">
      {selectedArticle ? (
        <motion.div
          key="article"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-gaffer-bg flex flex-col"
        >
          <ArticleDetail article={selectedArticle} onBack={() => setSelectedArticle(null)} />
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-gaffer-bg"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-12 pb-4">
            <GafferLogo size="sm" />
            <div className="flex items-center gap-3">
              <button 
                onClick={() => addToast('No new notifications', 'info')}
                className="w-9 h-9 rounded-full bg-gaffer-card border border-gaffer-border flex items-center justify-center text-gaffer-muted hover:text-white transition-colors"
              >
                <Bell size={18} />
              </button>
              <button 
                onClick={() => addToast('Profile settings coming soon', 'info')}
                className="w-9 h-9 rounded-full bg-orange-gradient-btn flex items-center justify-center text-white font-display font-bold text-sm shadow-orange-glow active:scale-95 transition-transform"
              >
                {displayName[0].toUpperCase()}
              </button>
            </div>
          </div>

          {/* Greeting */}
          <div className="px-4 pb-4">
            <p className="font-body text-gaffer-muted text-sm">Welcome back,</p>
            <h1 className="font-display font-bold text-2xl text-white leading-tight">
              {displayName}
            </h1>
          </div>

          <div className="px-4 space-y-6 pb-6">
            {/* Top News Section */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-bold text-white text-base tracking-wide">
                  Top News
                </h2>
                <button
                  onClick={() => router.push('/app/news')}
                  className="text-gaffer-orange text-xs font-body font-medium"
                >
                  See all
                </button>
              </div>

              {isLoading ? (
                <SkeletonCard size="large" />
              ) : featuredArticle ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <NewsCard
                    {...featuredArticle}
                    size="large"
                    onClick={() => setSelectedArticle(featuredArticle)}
                  />
                </motion.div>
              ) : null}
            </section>

            {/* Tournament Section */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-bold text-white text-base tracking-wide">
                  Tournament
                </h2>
                {tournaments.length > 0 && (
                  <button
                    onClick={() => router.push('/tournaments')}
                    className="text-gaffer-orange text-xs font-body font-medium"
                  >
                    See all
                  </button>
                )}
              </div>

              <TournamentBanner
                hasTourn={tournaments.length > 0}
                onCreateClick={() => router.push('/tournaments/create')}
              />
            </section>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
