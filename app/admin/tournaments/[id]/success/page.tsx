'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CheckCircle2, Copy, Share2, ArrowLeft, Trophy, ExternalLink } from 'lucide-react'
import { getCompetition } from '@/lib/services/competition.service'
import { useToastStore } from '@/store/toastStore'

const slugify = (text: string) => text.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]+/g, '')

export default function TournamentSuccessPage() {
  const params = useParams()
  const router = useRouter()
  const toast = useToastStore()
  const id = params.id as string

  const { data: competition, isLoading } = useQuery({
    queryKey: ['competition', id],
    queryFn: () => getCompetition(id),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#181928] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#FF8904] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!competition) return null

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const tournamentSlug = slugify(competition.name)
  const shareLink = `${baseUrl}/${tournamentSlug}`
  const joinCode = competition.joinCode || 'N/A'

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.addToast(`${label} copied!`, 'success')
  }

  return (
    <div className="min-h-screen bg-[#181928] flex flex-col items-center justify-center p-6 pb-24">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg space-y-8 text-center"
      >
        {/* Success Icon */}
        <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
            className="absolute inset-0 bg-gradient-to-br from-[#FF8904] to-[#E7000B] rounded-full blur-2xl opacity-40 animate-pulse"
          />
          <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-[#FF8904] to-[#E7000B] rounded-full flex items-center justify-center shadow-2xl">
            <Trophy size={48} className="text-white" />
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 border-4 border-[#181928]"
          >
            <CheckCircle2 size={24} className="text-white" />
          </motion.div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-3xl font-chakra font-black text-white uppercase tracking-tight">Tournament Live!</h1>
          <p className="text-white/60 font-medium">"{competition.name}" is now public and ready for players.</p>
        </div>

        {/* Share Cards */}
        <div className="grid gap-4 mt-12">
          {/* Link Card */}
          <div className="bg-[#1E2032] border border-white/5 rounded-[24px] p-6 text-left space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-chakra font-black text-[#FF8904] uppercase tracking-widest">Share Link</span>
              <button 
                onClick={() => copyToClipboard(shareLink, 'Link')}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <Copy size={14} />
              </button>
            </div>
            <div className="flex items-center gap-3 bg-black/20 rounded-xl px-4 py-3 border border-white/5">
              <p className="text-sm text-white/80 font-medium truncate flex-1">{shareLink}</p>
              <ExternalLink size={14} className="text-[#FF8904] shrink-0" />
            </div>
          </div>

          {/* Join Code Card */}
          <div className="bg-[#1E2032] border border-white/5 rounded-[24px] p-6 text-left space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-chakra font-black text-[#FF8904] uppercase tracking-widest">Invitation Code</span>
              <button 
                onClick={() => copyToClipboard(joinCode, 'Code')}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <Copy size={14} />
              </button>
            </div>
            <div className="bg-gradient-to-r from-gaffer-orange/20 to-transparent rounded-xl px-6 py-4 border border-gaffer-orange/20 flex items-center justify-between">
              <p className="text-2xl font-chakra font-black text-white tracking-[0.2em]">{joinCode}</p>
              <Share2 size={20} className="text-[#FF8904]" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-8 space-y-4">
          <button 
            onClick={() => router.push(`/admin/tournaments/${id}`)}
            className="w-full h-14 bg-gradient-to-r from-[#FF8904] to-[#E7000B] text-white font-chakra font-black text-base uppercase tracking-widest rounded-2xl shadow-lg shadow-[#E7000B]/20 active:scale-95 transition-all"
          >
            Back to Dashboard
          </button>
          
          <button 
            onClick={() => router.push('/admin/tournaments')}
            className="flex items-center justify-center gap-2 mx-auto text-white/40 hover:text-white font-chakra font-bold text-xs uppercase tracking-widest transition-colors"
          >
            <ArrowLeft size={14} />
            View All Tournaments
          </button>
        </div>
      </motion.div>
    </div>
  )
}
