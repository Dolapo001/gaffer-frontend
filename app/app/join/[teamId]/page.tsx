'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronLeft, Camera, User, Phone, Plus } from 'lucide-react'
import { GradientButton } from '@/components/GradientButton'
import { validatePlayerInvite, acceptPlayerInvite } from '@/lib/services/team.service'
import { getErrorMessage } from '@/lib/api'

const POSITIONS = ['goalkeeper', 'defender', 'midfielder', 'forward']

export default function JoinTeamPage() {
  const params = useParams()
  const router = useRouter()
  // The route param is the invite token
  const token = params.teamId as string

  const [inviteInfo, setInviteInfo] = useState<{ email: string; teamId: string } | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    position: 'forward',
  })
  const [photo, setPhoto] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    validatePlayerInvite(token)
      .then((res) => setInviteInfo(res.invite))
      .catch((err) => setInviteError(getErrorMessage(err)))
  }, [token])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setPhoto(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName) {
      setSubmitError('First and last name are required')
      return
    }
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await acceptPlayerInvite({
        token,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        position: formData.position,
      })
      router.replace('/app/dashboard')
    } catch (err) {
      setSubmitError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (inviteError) {
    return (
      <div className="min-h-screen bg-[#0F111A] text-white flex flex-col items-center justify-center px-8 gap-6">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <User size={32} className="text-red-400" />
        </div>
        <div className="text-center">
          <h2 className="font-chakra font-black text-xl uppercase">Invalid Invite</h2>
          <p className="text-white/40 text-sm mt-2">{inviteError}</p>
        </div>
        <button onClick={() => router.push('/app/dashboard')} className="text-orange-500 font-bold text-sm">
          Go Home
        </button>
      </div>
    )
  }

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

      <main className="flex-1 px-6 pt-8 pb-32 space-y-8 overflow-y-auto">
        {/* Team Context */}
        {inviteInfo && (
          <div className="bg-[#1C1F2D] rounded-[32px] p-6 border border-white/5 flex items-center gap-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-white/5 p-3 border border-white/10 flex-shrink-0 flex items-center justify-center">
              <User size={24} className="text-white/40" />
            </div>
            <div>
              <h2 className="font-chakra font-black text-xl uppercase italic text-white/90">Join Team</h2>
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest">{inviteInfo.email}</p>
            </div>
          </div>
        )}

        {/* Photo Upload */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="w-32 h-32 rounded-[40px] bg-[#1C1F2D] border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden group-hover:border-orange-500/50 transition-colors">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} className="w-full h-full object-cover" alt="" />
              ) : (
                <Camera size={40} className="text-white/20" />
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-xl hover:scale-110 active:scale-95 transition-all cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              <Plus size={20} />
            </label>
          </div>
          <span className="text-white/40 text-[10px] uppercase font-bold tracking-widest leading-none">Upload Profile Picture</span>
        </div>

        {/* Error */}
        {submitError && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-body">
            {submitError}
          </motion.div>
        )}

        {/* Form Fields */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] text-white/40 font-black uppercase tracking-[0.2em] ml-1">First Name</label>
              <div className="relative">
                <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="First"
                  className="w-full h-14 bg-[#1C1F2D] border border-white/5 rounded-2xl pl-12 pr-4 text-white text-sm focus:outline-none focus:border-orange-500/30 transition-all font-bold"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] text-white/40 font-black uppercase tracking-[0.2em] ml-1">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Last"
                className="w-full h-14 bg-[#1C1F2D] border border-white/5 rounded-2xl px-5 text-white text-sm focus:outline-none focus:border-orange-500/30 transition-all font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] text-white/40 font-black uppercase tracking-[0.2em] ml-1">Phone Number</label>
            <div className="relative">
              <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+234 810 123 4567"
                className="w-full h-14 bg-[#1C1F2D] border border-white/5 rounded-2xl pl-12 pr-6 text-white text-sm focus:outline-none focus:border-orange-500/30 transition-all font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] text-white/40 font-black uppercase tracking-[0.2em] ml-1">Preferred Position</label>
            <div className="grid grid-cols-2 gap-3">
              {POSITIONS.map((pos) => (
                <button
                  key={pos}
                  onClick={() => setFormData({ ...formData, position: pos })}
                  className={`h-12 rounded-xl border font-chakra font-black text-[11px] uppercase tracking-wider transition-all capitalize ${
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
        </div>

        {/* Action Button */}
        <div className="fixed bottom-10 left-6 right-6 z-50">
          <GradientButton
            onClick={handleSubmit}
            loading={isSubmitting}
            className="w-full h-16 rounded-2xl font-chakra font-black text-lg uppercase tracking-widest shadow-2xl transition-all"
          >
            Submit Registration
          </GradientButton>
        </div>
      </main>
    </div>
  )
}
