'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronLeft, Camera, User, Phone, Mail, Award } from 'lucide-react'
import { GradientButton } from '@/components/GradientButton'

export default function JoinTeamPage() {
  const params = useParams()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: 'Forward',
    description: ''
  })
  const [photo, setPhoto] = useState<string | null>(null)

  const positions = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward']

  return (
    <div className="min-h-screen bg-[#0F111A] text-white flex flex-col font-inter">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-[#0F111A]/90 backdrop-blur-xl z-50">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full border border-white/10 text-white/60"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-chakra font-black text-xl uppercase tracking-tight italic">Register Player</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 px-6 pt-8 pb-32 space-y-8 overflow-y-auto no-scrollbar">
        {/* Team Context */}
        <div className="bg-[#1C1F2D] rounded-[32px] p-6 border border-white/5 flex items-center gap-4 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2" />
           <div className="w-16 h-16 rounded-full bg-white/5 p-3 border border-white/10 flex-shrink-0">
             <img src="/images/mc_logo.png" className="w-full h-full object-contain" alt="" />
           </div>
           <div>
             <h2 className="font-chakra font-black text-2xl uppercase italic text-white/90">Join COCCS</h2>
             <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Bowenfans League Season 4</p>
           </div>
        </div>

        {/* Photo Upload */}
        <div className="flex flex-col items-center gap-4">
           <div className="relative group">
              <div className="w-32 h-32 rounded-[40px] bg-[#1C1F2D] border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden group-hover:border-orange-500/50 transition-colors">
                 {photo ? (
                    <img src={photo} className="w-full h-full object-cover" alt="" />
                 ) : (
                    <Camera size={40} className="text-white/20" />
                 )}
              </div>
              <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-xl hover:scale-110 active:scale-95 transition-all">
                 <Plus size={20} />
              </button>
           </div>
           <span className="text-white/40 text-[10px] uppercase font-bold tracking-widest leading-none">Upload Profile Picture</span>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
           <div className="space-y-2">
              <label className="text-[11px] text-white/40 font-black uppercase tracking-[0.2em] ml-1">Full Name</label>
              <div className="relative">
                 <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" />
                 <input 
                   type="text" 
                   placeholder="Enter your name"
                   className="w-full h-14 bg-[#1C1F2D] border border-white/5 rounded-2xl pl-12 pr-6 text-white text-sm focus:outline-none focus:border-orange-500/30 transition-all font-bold"
                 />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[11px] text-white/40 font-black uppercase tracking-[0.2em] ml-1">Phone Number</label>
              <div className="relative">
                 <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" />
                 <input 
                   type="tel" 
                   placeholder="+234 810 123 4567"
                   className="w-full h-14 bg-[#1C1F2D] border border-white/5 rounded-2xl pl-12 pr-6 text-white text-sm focus:outline-none focus:border-orange-500/30 transition-all font-bold"
                 />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[11px] text-white/40 font-black uppercase tracking-[0.2em] ml-1">Preferred Position</label>
              <div className="grid grid-cols-2 gap-3">
                 {positions.map((pos) => (
                    <button 
                      key={pos}
                      onClick={() => setFormData({...formData, position: pos})}
                      className={`h-12 rounded-xl border font-chakra font-black text-[11px] uppercase tracking-wider transition-all ${
                        formData.position === pos 
                          ? 'bg-orange-600/20 border-orange-500 text-orange-500 shadow-[0_0_20px_rgba(234,88,12,0.1)]' 
                          : 'bg-[#1C1F2D] border-white/5 text-white/40 hover:text-white'
                      }`}
                    >
                       {pos}
                    </button>
                 ))}
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[11px] text-white/40 font-black uppercase tracking-[0.2em] ml-1">Short Bio</label>
              <textarea 
                placeholder="Tell us about yourself..."
                rows={3}
                className="w-full bg-[#1C1F2D] border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:border-orange-500/30 transition-all font-medium resize-none"
              />
           </div>
        </div>

        {/* Action Button */}
        <div className="fixed bottom-10 left-6 right-6 z-50">
           <GradientButton 
             onClick={() => router.push('/app/dashboard')}
             className="w-full h-16 rounded-2xl font-chakra font-black text-lg uppercase tracking-widest shadow-2xl transition-all"
           >
              Submit Registration
           </GradientButton>
        </div>
      </main>
    </div>
  )
}

import { Plus } from 'lucide-react'
