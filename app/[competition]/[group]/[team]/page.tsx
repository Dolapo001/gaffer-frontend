'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useQuery, useMutation } from '@tanstack/react-query'
import { User, Mail, Trophy, ChevronRight, CheckCircle2, Shield } from 'lucide-react'
import { getPublicTeamByHandle, registerPublicPlayer, type AddPlayerPayload } from '@/lib/services/team.service'
import { getPublicCompetitionBySlug } from '@/lib/services/competition.service'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'

const SPORT_POSITIONS: Record<string, string[]> = {
  football: ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'],
  basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
  rugby: ['Forward', 'Back'],
  cricket: ['Batsman', 'Bowler', 'Wicketkeeper', 'All-Rounder'],
  netball: ['Goal Shooter', 'Goal Attack', 'Wing Attack', 'Center', 'Wing Defense', 'Goal Defense', 'Goal Keeper'],
}

export default function PlayerRecruitmentPage() {
  const { competition: competitionSlug, group, team: teamHandle } = useParams() as { competition: string; group: string; team: string }
  const router = useRouter()
  const toast = useToastStore()
  const [isSuccess, setIsSuccess] = useState(false)

  // Form State
  const [formData, setFormData] = useState<AddPlayerPayload>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    jerseyNumber: undefined,
  })

  const { data: team, isLoading: isLoadingTeam } = useQuery({
    queryKey: ['public-team', teamHandle],
    queryFn: () => getPublicTeamByHandle(teamHandle),
    enabled: !!teamHandle,
  })

  const { data: competition } = useQuery({
    queryKey: ['public-competition', competitionSlug],
    queryFn: () => getPublicCompetitionBySlug(competitionSlug),
    enabled: !!competitionSlug,
  })

  const sport = (competition?.sport || team?.sport || 'football').toLowerCase()
  const positions = SPORT_POSITIONS[sport] || ['Player']

  const registerMutation = useMutation({
    mutationFn: (payload: AddPlayerPayload) => registerPublicPlayer(teamHandle, payload),
    onSuccess: () => {
      setIsSuccess(true)
      toast.addToast('Welcome to the squad!', 'success')
    },
    onError: (err) => toast.addToast(getErrorMessage(err), 'error'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.addToast('Please fill in all required fields', 'error')
      return
    }
    registerMutation.mutate(formData)
  }

  const formatHandle = (h: string) => h?.replace(/-/g, ' ').toUpperCase() || ''

  if (isLoadingTeam) {
    return (
      <div className="min-h-screen bg-[#0F111A] flex items-center justify-center p-6">
        <div className="w-12 h-12 border-2 border-white/10 border-t-[#FF8904] rounded-full animate-spin" />
      </div>
    )
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-[#0F111A] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
           <Shield size={40} className="text-white/20" />
        </div>
        <h1 className="font-chakra font-black text-2xl text-white uppercase tracking-tighter mb-2">Team Not Found</h1>
        <p className="text-white/40 text-sm max-w-xs mx-auto mb-8 font-medium">This recruitment link might be expired or invalid.</p>
        <button onClick={() => router.push('/')} className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-chakra font-bold text-xs uppercase tracking-widest transition-all">Go Home</button>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#0F111A] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="w-24 h-24 bg-gradient-to-br from-[#FF8904] to-[#E7000B] rounded-[32px] flex items-center justify-center mb-8 mx-auto shadow-2xl">
            <CheckCircle2 size={48} className="text-white" />
          </div>
        </motion.div>
        <h1 className="font-chakra font-black text-3xl text-white uppercase tracking-tighter mb-2">You&apos;re In!</h1>
        <p className="text-white/60 text-sm mb-8 font-medium">You have successfully joined <span className="text-white font-bold">{team.name}</span>.</p>
        <button onClick={() => router.push('/')} className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-chakra font-bold text-sm uppercase tracking-widest transition-all">Finish</button>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#0F111A] text-white selection:bg-[#FF8904]/30 selection:text-[#FF8904] overflow-hidden flex flex-col items-center justify-center relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FF8904]/5 blur-[120px] rounded-full opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#E7000B]/5 blur-[120px] rounded-full opacity-60" />
      </div>

      <div className="relative w-full max-w-sm mx-auto px-6 py-4 flex flex-col h-full">
        <div className="space-y-4 mb-4 text-center shrink-0">
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <Trophy size={11} className="text-[#FF8904]" />
            <span className="text-[9px] font-chakra font-black uppercase tracking-widest text-[#FF8904]">{formatHandle(competitionSlug)}</span>
            <span className="w-0.5 h-0.5 rounded-full bg-white/20" />
            <span className="text-[9px] font-chakra font-black uppercase tracking-widest text-white/40">{formatHandle(group)}</span>
          </motion.div>

          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}>
             <div className="w-20 h-20 mx-auto rounded-[24px] bg-[#1C2130] border border-white/5 shadow-2xl p-4 flex items-center justify-center mb-4">
                <img src={team.logoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${team.name}`} alt={team.name} className="w-full h-full object-contain" />
             </div>
             <h1 className="font-chakra font-black text-2xl uppercase tracking-tighter leading-none mb-1">JOIN {team.name}</h1>
             <p className="font-chakra text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">@{teamHandle}</p>
          </motion.div>
        </div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex-1 min-h-0 flex flex-col justify-center">
          <form onSubmit={handleSubmit} className="space-y-4 bg-[#161825]/80 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 shadow-2xl">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-[10px] font-chakra font-black text-white/40 uppercase tracking-widest ml-1">First Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FF8904] transition-colors" size={14} />
                  <input type="text" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="John" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-[#FF8904]/50 transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-chakra font-black text-white/40 uppercase tracking-widest ml-1">Last Name</label>
                <input type="text" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Doe" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-medium focus:outline-none focus:border-[#FF8904]/50 transition-all" />
              </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-chakra font-black text-white/40 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FF8904] transition-colors" size={14} />
                  <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-[#FF8904]/50 transition-all" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                <div className="space-y-2">
                    <label className="text-[10px] font-chakra font-black text-white/40 uppercase tracking-widest ml-1">Position</label>
                    <select value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-medium focus:outline-none appearance-none cursor-pointer">
                        <option value="" className="bg-[#1C2130]">Select...</option>
                        {positions.map(pos => (
                          <option key={pos} value={pos} className="bg-[#1C2130]">{pos}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-chakra font-black text-white/40 uppercase tracking-widest ml-1">Jersey #</label>
                    <input type="number" value={formData.jerseyNumber || ''} onChange={e => setFormData({...formData, jerseyNumber: e.target.value ? parseInt(e.target.value) : undefined})} placeholder="10" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-medium focus:outline-none transition-all" />
                </div>
            </div>

            <button type="submit" disabled={registerMutation.isPending} className="w-full bg-gradient-to-r from-[#FF8904] to-[#E7000B] text-white py-4 rounded-xl font-chakra font-black text-sm uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2">
              {registerMutation.isPending ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>Confirm Registration <ChevronRight size={16} /></>}
            </button>
            <p className="text-[8px] text-center text-white/20 font-medium uppercase tracking-widest">By clicking confirm, you agree to join the team roster.</p>
          </form>
        </motion.div>
        <p className="mt-4 text-center text-white/10 text-[8px] font-chakra font-black uppercase tracking-[0.2em]">POWERED BY GAFFER</p>
      </div>
    </div>
  )
}
