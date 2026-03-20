'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useQuery, useMutation } from '@tanstack/react-query'
import { User, Mail, Trophy, ChevronRight, CheckCircle2, Shield, ChevronDown } from 'lucide-react'
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
    <div className="min-h-screen bg-[#11121C] text-white selection:bg-gaffer-orange/30 selection:text-gaffer-orange flex flex-col items-center justify-start relative overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-gaffer-orange/10 blur-[150px] rounded-full opacity-60 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#E7000B]/10 blur-[150px] rounded-full opacity-60 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative w-full max-w-[430px] mx-auto px-6 py-12 flex flex-col flex-1">
        {/* Top Header Section */}
        <div className="space-y-6 mb-8 text-center shrink-0">
          <motion.div 
            initial={{ y: -20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 shadow-inner backdrop-blur-md"
          >
            <Trophy size={14} className="text-gaffer-orange" />
            <span className="text-[10px] font-chakra font-black uppercase tracking-widest text-gaffer-orange">
              {formatHandle(competitionSlug)}
            </span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-[10px] font-chakra font-black uppercase tracking-widest text-white/40">
              {formatHandle(group)}
            </span>
          </motion.div>

          {/* Animated Avatar Container */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ delay: 0.1, type: 'spring' }}
            className="flex flex-col items-center"
          >
             <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-br from-gaffer-orange to-[#E7000B] rounded-[40px] blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                <div className="w-[100px] h-[100px] relative rounded-[32px] bg-[#1C1D2B] border border-white/10 shadow-2xl p-4 flex items-center justify-center mb-6 overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                   <img 
                     src={team.logoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${team.name}`} 
                     alt={team.name} 
                     className="w-full h-full object-contain relative z-10 filter drop-shadow-2xl" 
                   />
                </div>
             </div>
             <h1 className="font-chakra font-black text-3xl uppercase tracking-tighter leading-none mb-2">
               Join <span className="text-gaffer-orange">{team.name}</span>
             </h1>
             <p className="font-chakra text-white/40 text-[11px] font-bold uppercase tracking-[0.3em] opacity-60">@{teamHandle}</p>
          </motion.div>
        </div>

        {/* Registration Form */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.2 }}
          className="bg-[#1C1D2B]/80 backdrop-blur-2xl border border-white/10 rounded-[40px] p-8 shadow-[0_40px_100px_rgba(0,0,0,0.5)] relative overflow-hidden"
        >
          {/* Form Glass Accent */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gaffer-orange/40 to-transparent" />

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-chakra font-black text-white/30 uppercase tracking-[0.2em] ml-2">First Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gaffer-orange transition-colors" size={16} />
                  <input 
                    type="text" 
                    required 
                    value={formData.firstName} 
                    onChange={e => setFormData({...formData, firstName: e.target.value})} 
                    placeholder="John" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-gaffer-orange/50 focus:bg-white-[0.07] transition-all placeholder:text-white/10" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-chakra font-black text-white/30 uppercase tracking-[0.2em] ml-2">Last Name</label>
                <input 
                  type="text" 
                  required 
                  value={formData.lastName} 
                  onChange={e => setFormData({...formData, lastName: e.target.value})} 
                  placeholder="Doe" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none focus:border-gaffer-orange/50 focus:bg-white-[0.07] transition-all placeholder:text-white/10" 
                />
              </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-chakra font-black text-white/30 uppercase tracking-[0.2em] ml-2">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gaffer-orange transition-colors" size={16} />
                  <input 
                    type="email" 
                    required 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    placeholder="john@example.com" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-gaffer-orange/50 focus:bg-white-[0.07] transition-all placeholder:text-white/10" 
                  />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-chakra font-black text-white/30 uppercase tracking-[0.2em] ml-2">Position</label>
                    <div className="relative">
                       <select 
                         value={formData.position} 
                         onChange={e => setFormData({...formData, position: e.target.value})} 
                         className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none appearance-none cursor-pointer focus:border-gaffer-orange/50"
                       >
                           <option value="" className="bg-[#1C1D2B]">Select...</option>
                           {positions.map(pos => (
                             <option key={pos} value={pos} className="bg-[#1C1D2B]">{pos}</option>
                           ))}
                       </select>
                       <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={16} />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-chakra font-black text-white/30 uppercase tracking-[0.2em] ml-2">Jersey #</label>
                    <input 
                      type="number" 
                      value={formData.jerseyNumber || ''} 
                      onChange={e => setFormData({...formData, jerseyNumber: e.target.value ? parseInt(e.target.value) : undefined})} 
                      placeholder="10" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none focus:border-gaffer-orange/50 transition-all placeholder:text-white/10" 
                    />
                </div>
            </div>

            <div className="pt-2">
               <button 
                 type="submit" 
                 disabled={registerMutation.isPending} 
                 className="w-full h-[72px] bg-gradient-to-br from-gaffer-orange to-[#E7000B] text-white rounded-[24px] font-chakra font-black text-lg uppercase tracking-widest shadow-[0_12px_40px_rgba(255,122,0,0.3)] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 group relative overflow-hidden"
               >
                 <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                 {registerMutation.isPending ? (
                   <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                 ) : (
                   <>Confirm Registration <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
                 )}
               </button>
            </div>
            
            <p className="text-[9px] text-center text-white/20 font-black uppercase tracking-[0.25em] pt-2">
              By clicking confirm, you agree to join the team roster.
            </p>
          </form>
        </motion.div>
        
        <div className="mt-8 flex flex-col items-center gap-4">
           <p className="text-white/10 text-[9px] font-chakra font-black uppercase tracking-[0.4em]">Powered by Gaffer</p>
        </div>
      </div>
    </div>
  )
}
