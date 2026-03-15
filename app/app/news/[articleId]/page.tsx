'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArticleDetail } from '@/components/home/ArticleDetail'
import { TOP_NEWS, TRENDING_POSTS } from '@/lib/mockData'
import { ChevronLeft } from 'lucide-react'

const ALL_ARTICLES = [...TOP_NEWS, ...TRENDING_POSTS]

function fetchArticle(id: string) {
  return new Promise<(typeof ALL_ARTICLES)[0] | null>((resolve) =>
    setTimeout(() => {
      const article = ALL_ARTICLES.find((a) => a.id === id) ?? null
      resolve(article)
    }, 400)
  )
}

export default function ArticlePage() {
  const { articleId } = useParams<{ articleId: string }>()
  const router = useRouter()

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', articleId],
    queryFn: () => fetchArticle(articleId),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gaffer-bg animate-pulse">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gaffer-border">
          <div className="w-8 h-8 rounded-full bg-gaffer-card" />
          <div className="flex-1 h-4 bg-gaffer-card rounded mx-8" />
        </div>
        <div className="px-4 py-4 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-gaffer-card" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-gaffer-card rounded w-1/3" />
              <div className="h-2.5 bg-gaffer-card rounded w-1/4" />
            </div>
          </div>
          <div className="h-5 bg-gaffer-card rounded w-4/5" />
          <div className="h-5 bg-gaffer-card rounded w-3/5" />
          <div className="h-52 bg-gaffer-card rounded-2xl" />
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-3 bg-gaffer-card rounded w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gaffer-bg flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-gaffer-muted font-body text-sm">Article not found</p>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gaffer-orange font-body text-sm font-medium"
        >
          <ChevronLeft size={16} />
          Go back
        </button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gaffer-bg flex flex-col"
    >
      <ArticleDetail article={article} onBack={() => router.back()} />
    </motion.div>
  )
}
