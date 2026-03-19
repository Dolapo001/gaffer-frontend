'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Flame, Share2, Clock, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GradientButton } from '@/components/GradientButton'
import { listOrgs } from '@/lib/services/org.service'
import { getOrgFeed, publishNews, type FeedItem } from '@/lib/services/feed.service'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function AdminNewsPage() {
  const qc = useQueryClient()
  const toast = useToastStore()
  const [newsContent, setNewsContent] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const { data: orgs } = useQuery({ queryKey: ['orgs'], queryFn: listOrgs })
  const firstOrg = orgs?.[0]

  const { data: feedData, isLoading } = useQuery({
    queryKey: ['org-feed', firstOrg?._id],
    queryFn: () => getOrgFeed(firstOrg!._id),
    enabled: !!firstOrg?._id,
    staleTime: 30_000,
  })

  const feedItems: FeedItem[] = ((feedData?.items ?? feedData?.data ?? []) as FeedItem[])

  const postMutation = useMutation({
    mutationFn: () =>
      publishNews({
        orgId: firstOrg!._id,
        body: newsContent.trim(),
        visibility: 'public',
      }),
    onSuccess: () => {
      setNewsContent('')
      setSelectedImage(null)
      qc.invalidateQueries({ queryKey: ['org-feed', firstOrg?._id] })
      toast.addToast('News published!', 'success')
    },
    onError: (err: unknown) => toast.addToast(getErrorMessage(err), 'error'),
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setSelectedImage(url)
    }
  }

  const canPost = newsContent.trim().length > 0 && !!firstOrg

  return (
    <div className="min-h-screen bg-[#0F111A] pb-32 pt-8">
      <div className="px-6 space-y-8">
        {/* Posting Interface */}
        <div className="space-y-4">
          <div className="relative group">
            <div className="flex flex-col bg-[#1C1F2D] border border-white/5 rounded-[24px] overflow-hidden shadow-xl focus-within:border-white/10 transition-all">
              {selectedImage && (
                <div className="relative h-40 w-full bg-black/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedImage} className="w-full h-full object-cover" alt="Preview" />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <textarea
                value={newsContent}
                onChange={(e) => setNewsContent(e.target.value)}
                placeholder="What's the news today?"
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
            onClick={() => canPost && postMutation.mutate()}
            loading={postMutation.isPending}
            className="h-14 rounded-2xl font-chakra font-black text-base uppercase tracking-wider shadow-2xl shadow-orange-500/20"
            style={{ background: 'linear-gradient(90deg, #FF8A00 0%, #FF0000 100%)' }}
          >
            Post
          </GradientButton>
        </div>

        {/* Feed Section */}
        <div className="space-y-6">
          <h2 className="font-chakra font-bold text-lg text-white tracking-tight">Recent News</h2>

          {isLoading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-48 bg-[#1C1F2D] rounded-[28px] animate-pulse" />
              ))}
            </div>
          ) : feedItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/40 text-sm">No news posted yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {feedItems.map((item, i) => {
                const imageUrl = item.media?.find((m) => m.type === 'image')?.url
                return (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="bg-[#1C1F2D] rounded-[28px] overflow-hidden border border-white/5 shadow-2xl group"
                  >
                    {imageUrl && (
                      <div className="relative h-[210px] overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
                        <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/5">
                          <Clock size={12} className="text-white/60" />
                          <span className="text-[10px] text-white/80 font-medium">{timeAgo(item.createdAt)}</span>
                        </div>
                      </div>
                    )}

                    <div className="p-5 space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="font-chakra font-black text-[11px] text-white uppercase tracking-wider flex items-center gap-1.5 pt-0.5">
                          {firstOrg?.name ?? 'Organization'}
                          <div className="w-3.5 h-3.5 bg-orange-500 rounded-full flex items-center justify-center">
                            <svg width="8" height="6" viewBox="0 0 10 8" fill="none" className="text-white">
                              <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </span>
                        {!imageUrl && (
                          <span className="ml-auto text-[10px] text-white/40">{timeAgo(item.createdAt)}</span>
                        )}
                      </div>

                      <p className="font-body text-white/90 text-sm leading-relaxed line-clamp-4">{item.body}</p>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <Flame size={18} className="text-orange-500" />
                          <span className="font-chakra font-bold text-orange-500 text-sm">{item.likesCount}</span>
                        </div>
                        <button className="p-2 rounded-full hover:bg-white/5 transition-colors">
                          <Share2 size={18} className="text-white/40 hover:text-white" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
