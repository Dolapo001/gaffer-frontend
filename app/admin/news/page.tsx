'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Flame, Share2, Clock, CheckCircle2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listOrgs } from '@/lib/services/org.service'
import { getOrgFeed, publishNews, type FeedItem } from '@/lib/services/feed.service'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m} mins ago`
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

  const feedItems: FeedItem[] = Array.isArray(feedData)
    ? feedData
    : ((feedData?.items ?? feedData?.data ?? []) as FeedItem[])

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
    <div className="h-screen flex flex-col bg-[#181928] overflow-hidden relative">
      <div className="flex-1 overflow-y-auto no-scrollbar pb-40">
        <div className="px-6 pt-12 space-y-8">
          {/* Header */}
          <h2 className="font-chakra font-black text-lg text-white tracking-widest uppercase">Post News</h2>

          {/* Posting Interface */}
          <div className="space-y-4">
            <div className="relative bg-[#1E2032] border border-white/5 rounded-[24px] p-6 focus-within:border-white/10 transition-all shadow-2xl">
              <textarea
                value={newsContent}
                onChange={(e) => setNewsContent(e.target.value)}
                placeholder="What's News are we posting today"
                className="w-full h-32 bg-transparent text-white text-sm font-chakra font-medium border-none outline-none resize-none placeholder:text-white/20"
              />
              
              <div className="flex items-center gap-3 mt-2">
                <label className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-white transition-all cursor-pointer">
                    <input type="file" className="hidden" onChange={handleImageChange} />
                    <Plus size={20} />
                </label>
                {selectedImage && (
                    <div className="h-10 w-16 rounded-md overflow-hidden relative group">
                        <img src={selectedImage} className="w-full h-full object-cover" alt="" />
                        <button onClick={() => setSelectedImage(null)} className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 uppercase text-[8px] font-chakra font-black">X</button>
                    </div>
                )}
              </div>
            </div>

            {!firstOrg && (
              <p className="text-center text-white/40 text-xs font-chakra py-1">
                You need an organization to post news.
              </p>
            )}
            <button
              onClick={() => canPost && postMutation.mutate()}
              disabled={!canPost || postMutation.isPending}
              className="w-full py-4 rounded-xl font-chakra font-black text-lg bg-gradient-to-r from-[#FF8904] to-[#E7000B] text-white uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {postMutation.isPending ? 'Posting...' : 'Post'}
            </button>
          </div>

          {/* Feed Section */}
          <div className="space-y-6">
            <h2 className="font-chakra font-black text-lg text-white tracking-widest uppercase">Top News</h2>

            {isLoading ? (
              <div className="space-y-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-48 bg-[#1E2032] rounded-[28px] animate-pulse" />
                ))}
              </div>
            ) : feedItems.length === 0 ? (
                <div className="bg-[#1E2032] rounded-[24px] p-12 text-center border border-dashed border-white/10">
                    <p className="text-white/20 font-chakra text-sm font-bold uppercase tracking-wider">No news posted yet</p>
                </div>
            ) : (
              <div className="space-y-6 pb-20">
                {feedItems.map((item, i) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="bg-[#1E2032] rounded-[28px] overflow-hidden border border-white/5 shadow-2xl group flex flex-col"
                  >
                    <div className="relative h-56 overflow-hidden bg-gaffer-dark">
                        {item.media?.[0]?.url && (
                          <img src={item.media[0].url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
                        )}
                        <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/5">
                          <Clock size={14} className="text-white/60" />
                          <span className="text-[10px] text-white/80 font-chakra font-bold">{timeAgo(item.createdAt)}</span>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gaffer-dark overflow-hidden border border-white/10">
                            {/* Logo */}
                            <div className="w-full h-full bg-[#FF4D00]/20 flex items-center justify-center font-black text-[8px] text-[#FF4D00]">G</div>
                        </div>
                        <span className="font-chakra font-black text-[11px] text-white uppercase tracking-wider flex items-center gap-1.5">
                          {firstOrg?.name ?? 'GAFFER'}
                          <CheckCircle2 size={14} className="text-[#FF8904] fill-[#FF8904]/10" />
                        </span>
                      </div>

                      <h3 className="font-chakra font-black text-xl text-white leading-tight uppercase line-clamp-2">
                        {item.body.split('\n')[0]}
                      </h3>
                      
                      <p className="font-chakra text-white/50 text-xs line-clamp-2 font-medium">
                        {item.body}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <Flame size={18} className="text-[#FF8904]" />
                          <span className="font-chakra font-black text-[#FF8904] text-sm tracking-tight">{item.likesCount || 0}</span>
                        </div>
                        <button className="text-white/40 hover:text-white transition-colors">
                          <Share2 size={18} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
