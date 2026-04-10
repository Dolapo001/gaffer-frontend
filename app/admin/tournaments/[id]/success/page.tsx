'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CheckCircle2, Copy, Share2, ArrowLeft, Trophy, ExternalLink } from 'lucide-react'
import { getCompetition } from '@/lib/services/competition.service'
import { useToastStore } from '@/store/toastStore'
import { useUIStore } from '@/store/uiStore'
import { useEffect } from 'react'

const slugify = (text: string) => text.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]+/g, '')

export default function TournamentSuccessPage() {
  const params = useParams()
  const router = useRouter()
  const toast = useToastStore()
  const id = params.id as string
  const { hideNavbar, showNavbar } = useUIStore()

  useEffect(() => {
    hideNavbar()
    return () => {
      showNavbar()
    }
  }, [hideNavbar, showNavbar])

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
  const joinCode = competition.joinCode || 'N/A'
  const shareLink = `${baseUrl}/app/${tournamentSlug}/${joinCode}`

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.addToast(`${label} copied!`, 'success')
  }

  return (
    <div className="min-h-screen bg-[#0B0C14] flex flex-col relative overflow-y-auto overflow-x-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[100%] h-[100%] bg-gradient-radial from-[#FF8904]/10 to-transparent blur-[120px] rounded-full opacity-30 animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[100%] h-[100%] bg-gradient-radial from-[#E7000B]/10 to-transparent blur-[120px] rounded-full opacity-30 animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />

      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md space-y-6 sm:space-y-10 text-center mx-auto px-5 py-10"
      >
        {/* Premium Trophy Logo */}
        <div className="relative mx-auto w-32 h-32 sm:w-44 sm:h-44 flex items-center justify-center">
          <motion.div 
            animate={{ 
              scale: [1, 1.15, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-br from-[#FF8904] to-[#E7000B] rounded-full blur-[40px] opacity-30"
          />
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10"
          >
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-b from-[#1C1D2B] to-[#0F101A] rounded-[36px] sm:rounded-[48px] flex items-center justify-center shadow-[0_30px_70px_-15px_rgba(0,0,0,0.6)] border border-white/10 group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF8904]/20 to-[#E7000B]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative z-10 w-22 h-22 bg-gradient-to-br from-[#FF8904] to-[#E7000B] rounded-[34px] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                <Trophy size={48} className="text-white drop-shadow-[0_2px_15px_rgba(0,0,0,0.4)]" />
              </div>
            </div>
            
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: 'spring', damping: 12 }}
              className="absolute -bottom-1 -right-1 bg-[#22C55E] rounded-full p-3.5 border-4 border-[#0B0C14] shadow-2xl flex items-center justify-center"
            >
              <CheckCircle2 size={22} className="text-white" />
            </motion.div>
          </motion.div>
        </div>

        {/* Headline Section */}
        <div className="space-y-6 px-2">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-chakra font-black uppercase italic leading-[0.85] tracking-tighter bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent drop-shadow-[0_15px_30px_rgba(255,137,4,0.3)]">
            Tournament<br/>Published!
          </h1>
          <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-[#FF8904]/10 rounded-full border border-[#FF8904]/20 backdrop-blur-md">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_15px_#22C55E]" />
            <span className="text-[#FF8904] font-chakra font-black text-[11px] uppercase tracking-[0.35em]">
              {competition.name}
            </span>
          </div>
        </div>

        {/* Aligned Cards Container */}
        <div className="grid gap-5 px-1 pt-4">
          {/* Branded Link Card */}
          <div className="group bg-[#151624]/80 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 text-left transition-all hover:border-[#FF8904]/30 hover:bg-[#151624] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#FF8904]/10 flex items-center justify-center">
                  <ExternalLink size={14} className="text-[#FF8904]" />
                </div>
                <span className="text-[10px] font-chakra font-black text-white/40 uppercase tracking-[0.25em]">Join Link</span>
              </div>
              <button 
                onClick={() => copyToClipboard(shareLink, 'Link')}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-[#FF8904] hover:bg-[#FF8904]/10 transition-all border border-white/5 active:scale-90"
              >
                <Copy size={16} />
              </button>
            </div>
            <div className="relative min-w-0">
              <div className="bg-black/40 rounded-2xl px-5 py-4 border border-white/5 overflow-hidden">
                <p className="text-xs text-white/70 font-display font-medium truncate pr-2">{shareLink}</p>
              </div>
            </div>
          </div>

          {/* Branded Join Code Card */}
          <div className="group bg-[#151624]/80 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 text-left transition-all hover:border-[#FF8904]/30 hover:bg-[#151624] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gaffer-orange/10 flex items-center justify-center">
                  <Share2 size={14} className="text-[#FF8904]" />
                </div>
                <span className="text-[10px] font-chakra font-black text-white/40 uppercase tracking-[0.25em]">Join Code</span>
              </div>
              <button 
                onClick={() => copyToClipboard(joinCode, 'Code')}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-[#FF8904] hover:bg-[#FF8904]/10 transition-all border border-white/5 active:scale-90"
              >
                <Copy size={16} />
              </button>
            </div>
            <div className="bg-gradient-to-r from-[#FF8904]/10 via-[#FF8904]/5 to-transparent rounded-2xl px-6 py-5 border border-[#FF8904]/20 flex items-center justify-center text-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
              <p className="text-2xl sm:text-4xl font-chakra font-black text-white tracking-[0.2em] sm:tracking-[0.3em] ml-[0.2em] sm:ml-[0.3em] select-all shadow-glow break-all">
                {joinCode}
              </p>
            </div>
          </div>
        </div>

        {/* Global Navigation Actions */}
        <div className="pt-6 sm:pt-10 space-y-4 px-1">
          <button 
            onClick={() => router.push(`/admin/tournaments/${id}`)}
            className="group relative w-full py-4 bg-gradient-to-r from-[#FF8904] to-[#E7000B] text-white font-chakra font-black text-base uppercase tracking-[0.25em] rounded-[24px] shadow-[0_15px_40px_rgba(231,0,11,0.4)] active:scale-[0.98] transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10">Back to Dashboard</span>
          </button>
          
          <button 
            onClick={() => router.push('/admin/tournaments')}
            className="flex items-center justify-center gap-2 mx-auto text-white/20 hover:text-white font-chakra font-bold text-[10px] uppercase tracking-[0.25em] transition-all group pt-2"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1.5 transition-transform duration-300" />
            View All Tournaments
          </button>
        </div>
      </motion.div>
    </div>
  )
}
