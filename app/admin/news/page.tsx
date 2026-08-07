'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Flame, Share2, Clock, CheckCircle2, Trash2, Pin, Trophy } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listOrgs } from '@/lib/services/org.service'
import { listCompetitions } from '@/lib/services/competition.service'
import { getOrgFeed, publishNews, deletePost, type FeedItem } from '@/lib/services/feed.service'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'
import { ConfirmDialog } from '@/components/ConfirmDialog'

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
  
  const [title, setTitle] = useState('')
  const [newsContent, setNewsContent] = useState('')
  const [selectedCompId, setSelectedCompId] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FeedItem | null>(null)

  const { data: orgs } = useQuery({ queryKey: ['orgs'], queryFn: listOrgs })
  const firstOrg = orgs?.[0]

  const { data: competitions } = useQuery({
    queryKey: ['competitions', firstOrg?._id],
    queryFn: () => listCompetitions(firstOrg!._id),
    enabled: !!firstOrg?._id,
  })

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
    mutationFn: async () => {
      let uploadedUrl: string | undefined = undefined
      let media: { url: string; type: 'image' }[] = []

      if (selectedFile && firstOrg) {
        const { uploadOrgAsset } = await import('@/lib/services/org.service')
        const result = await uploadOrgAsset(firstOrg._id, selectedFile)
        uploadedUrl = result.url
        media = [{ url: result.url, type: 'image' }]
      }

      return publishNews({
        orgId: firstOrg!._id,
        title: title.trim() || undefined,
        body: newsContent.trim(),
        imageUrl: uploadedUrl,
        media,
        targetType: selectedCompId ? 'competition' : undefined,
        targetId: selectedCompId || undefined,
        isPinned,
        visibility: 'public',
      })
    },
    onSuccess: () => {
      setTitle('')
      setNewsContent('')
      setSelectedCompId('')
      setIsPinned(false)
      setSelectedImage(null)
      setSelectedFile(null)
      qc.invalidateQueries({ queryKey: ['org-feed', firstOrg?._id] })
      toast.addToast('News published successfully!', 'success')
    },
    onError: (err: unknown) => toast.addToast(getErrorMessage(err), 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePost(id),
    onSuccess: () => {
      setDeleteTarget(null)
      qc.invalidateQueries({ queryKey: ['org-feed', firstOrg?._id] })
      toast.addToast('Post deleted.', 'success')
    },
    onError: (err: unknown) => {
      setDeleteTarget(null)
      toast.addToast(getErrorMessage(err), 'error')
    },
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        toast.addToast('File size exceeds 15MB limit', 'error')
        return
      }
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setSelectedImage(url)
    }
  }

  const canPost = newsContent.trim().length > 0 && !!firstOrg

  return (
    <div className="h-screen flex flex-col bg-[#181928] overflow-hidden relative">
      <div className="flex-1 overflow-y-auto no-scrollbar pb-40">
        <div className="px-6 pt-12 space-y-8 max-w-2xl mx-auto">
          {/* Header */}
          <h2 className="font-chakra font-black text-xl text-white tracking-widest uppercase">Post News</h2>

          {/* Posting Interface */}
          <div className="space-y-4">
            <div className="bg-[#1E2032] border border-white/5 rounded-[24px] p-6 focus-within:border-white/10 transition-all shadow-2xl space-y-4">
              
              {/* Headline Input */}
              <div>
                <label className="block text-[11px] font-chakra font-bold text-white/50 uppercase tracking-wider mb-1.5">
                  Headline / Title (Optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Bowen Fans League Round 3 Preview"
                  className="w-full bg-[#141523] text-white text-sm font-chakra font-medium px-4 py-3 rounded-xl border border-white/5 outline-none focus:border-[#FF8904]/50 transition-all placeholder:text-white/20"
                />
              </div>

              {/* Target Competition Dropdown */}
              <div>
                <label className="block text-[11px] font-chakra font-bold text-white/50 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Trophy size={13} className="text-[#FF8904]" />
                  Target Competition (Optional)
                </label>
                <select
                  value={selectedCompId}
                  onChange={(e) => setSelectedCompId(e.target.value)}
                  className="w-full bg-[#141523] text-white text-sm font-chakra font-medium px-4 py-3 rounded-xl border border-white/5 outline-none focus:border-[#FF8904]/50 transition-all"
                >
                  <option value="">All Competitions (General Org News)</option>
                  {competitions && competitions.length > 0 ? (
                    competitions.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))
                  ) : (
                    <option value="bowen-fans-league">Bowen Fans League (Default Target)</option>
                  )}
                </select>
              </div>

              {/* Main Content Textarea */}
              <div>
                <label className="block text-[11px] font-chakra font-bold text-white/50 uppercase tracking-wider mb-1.5">
                  Article Body
                </label>
                <textarea
                  value={newsContent}
                  onChange={(e) => setNewsContent(e.target.value)}
                  placeholder="Write what's news today..."
                  className="w-full h-32 bg-[#141523] text-white text-sm font-chakra font-medium px-4 py-3 rounded-xl border border-white/5 outline-none resize-none placeholder:text-white/20 focus:border-[#FF8904]/50 transition-all"
                />
              </div>

              {/* Image Attachment & Pin Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <label className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-white transition-all cursor-pointer">
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
                    <Plus size={20} />
                  </label>
                  {selectedImage && (
                    <div className="h-10 w-16 rounded-md overflow-hidden relative group border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={selectedImage} className="w-full h-full object-cover" alt="" />
                      <button
                        type="button"
                        onClick={() => { setSelectedImage(null); setSelectedFile(null); }}
                        className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 uppercase text-[9px] font-chakra font-black"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Pin Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 accent-[#FF8904]"
                  />
                  <span className="text-xs font-chakra font-bold text-white/70 flex items-center gap-1">
                    <Pin size={13} className={isPinned ? "text-[#FF8904]" : "text-white/30"} />
                    Pin to Top
                  </span>
                </label>
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
              className="w-full py-4 rounded-xl font-chakra font-black text-sm bg-gradient-to-r from-[#FF8904] to-[#E7000B] text-white uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {postMutation.isPending && <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />}
              {postMutation.isPending ? 'Posting...' : 'Post News'}
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
                    {(item.imageUrl || item.media?.[0]?.url) && (
                      <div className="w-full h-[200px] relative bg-[#181E32] overflow-hidden rounded-t-[28px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.imageUrl || item.media![0].url} className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105" alt="" />
                        <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/5">
                          <Clock size={14} className="text-white/60" />
                          <span className="text-[10px] text-white/80 font-chakra font-bold">{timeAgo(item.createdAt)}</span>
                        </div>
                        {item.isPinned && (
                          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF8904] text-black font-chakra font-black text-[10px] uppercase tracking-wider shadow-lg">
                            <Pin size={12} />
                            Pinned
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gaffer-dark overflow-hidden border border-white/10">
                          <div className="w-full h-full bg-[#FF4D00]/20 flex items-center justify-center font-black text-[8px] text-[#FF4D00]">G</div>
                        </div>
                        <span className="font-chakra font-black text-[11px] text-white uppercase tracking-wider flex items-center gap-1.5">
                          {firstOrg?.name ?? 'GAFFER'}
                          <CheckCircle2 size={14} className="text-[#FF8904] fill-[#FF8904]/10" />
                        </span>
                      </div>

                      {item.title && (
                        <h3 className="font-chakra font-black text-xl text-white leading-tight uppercase">
                          {item.title}
                        </h3>
                      )}

                      <p className="font-chakra text-white/70 text-sm line-clamp-3 font-medium">
                        {item.body}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <Flame size={18} className="text-[#FF8904]" />
                          <span className="font-chakra font-black text-[#FF8904] text-sm tracking-tight">{item.likesCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button className="text-white/40 hover:text-white transition-colors">
                            <Share2 size={18} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="text-white/30 hover:text-red-400 transition-colors"
                            aria-label="Delete post"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
        destructive
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
