'use client'

import React, { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useQuery, useMutation } from '@tanstack/react-query'
import { User, Trophy, ChevronRight, CheckCircle2, Shield, ChevronDown, Camera, X, Hash } from 'lucide-react'
import {
  getPublicTeamByHandle,
  registerPublicPlayer,
  uploadPublicPlayerPhoto,
  type AddPlayerPayload,
} from '@/lib/services/team.service'
import { getPublicCompetitionBySlug } from '@/lib/services/competition.service'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'

const SPORT_POSITIONS: Record<string, string[]> = {
  football:   ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Center-Back', 'Full-Back'],
  basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
  rugby:      ['Forward', 'Back'],
  cricket:    ['Batsman', 'Bowler', 'Wicketkeeper', 'All-Rounder'],
  netball:    ['Goal Shooter', 'Goal Attack', 'Wing Attack', 'Center', 'Wing Defense', 'Goal Defense', 'Goal Keeper'],
}

const inputCls = (hasIcon = false) =>
  `w-full bg-white/[0.04] border border-white/10 rounded-2xl py-3.5 ${hasIcon ? 'pl-10 pr-3' : 'px-4'} text-sm font-medium focus:outline-none focus:border-gaffer-orange/50 focus:bg-white/[0.06] transition-all placeholder:text-white/15 text-white`

export default function PlayerRecruitmentForm() {
  const params = useParams()
  const competitionSlug = params.competition as string
  const slug = params.slug as string[] | undefined
  
  // Handlers for both [competition]/[team] and [competition]/[group]/[team]
  // via the catch-all route [...slug]
  const group = slug && slug.length > 1 ? slug[0] : undefined
  const teamHandle = slug ? slug[slug.length - 1] : ''

  const router = useRouter()
  const toast  = useToastStore()
  const [isSuccess, setIsSuccess] = useState(false)

  const [form, setForm] = useState({
    firstName:    '',
    lastName:     '',
    position:     '',
    jerseyNumber: '',
    role:         'player' as 'player' | 'captain' | 'coach',
  })

  const photoRef                        = useRef<HTMLInputElement>(null)
  const [photoFile, setPhotoFile]       = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const handlePhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const { data: team, isLoading } = useQuery({
    queryKey: ['public-team', teamHandle],
    queryFn:  () => getPublicTeamByHandle(teamHandle),
    enabled:  !!teamHandle,
  })

  const { data: competition } = useQuery({
    queryKey: ['public-competition', competitionSlug],
    queryFn:  () => getPublicCompetitionBySlug(competitionSlug),
    enabled:  !!competitionSlug,
    retry:    false,
  })

  const sport     = (competition?.sport || team?.sport || 'football').toLowerCase()
  const positions = SPORT_POSITIONS[sport] || ['Goalkeeper', 'Defender', 'Midfielder', 'Forward']

  const registerMutation = useMutation({
    mutationFn: async () => {
      const payload: AddPlayerPayload = {
        firstName:    form.firstName,
        lastName:     form.lastName,
        position:     form.position    || undefined,
        jerseyNumber: form.jerseyNumber ? parseInt(form.jerseyNumber) : undefined,
        role:         form.role,
      }
      const result = await registerPublicPlayer(teamHandle, payload)
      if (photoFile && result.player?._id) {
        try { 
          await uploadPublicPlayerPhoto(teamHandle, result.player._id as string, photoFile) 
        } catch (photoErr) {
          console.error("Photo upload failed:", photoErr)
          toast.addToast("Welcome! (Photo upload failed, you can add it later)", "warning")
          return result
        }
      }
      return result
    },
    onSuccess: () => { 
      setIsSuccess(true)
      // Only show success toast if the photo try/catch didn't already show a warning
      if (!toast.toasts.some(t => t.type === 'warning')) {
        toast.addToast('Welcome to the squad! 🎉', 'success') 
      }
    },
    onError:   (err) => toast.addToast(getErrorMessage(err), 'error'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.addToast('First and last name are required', 'error')
      return
    }
    registerMutation.mutate()
  }

  const formatHandle = (h: string) => h?.replace(/-/g, ' ').toUpperCase() || ''

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#0F111A] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-white/10 border-t-gaffer-orange rounded-full animate-spin" />
      </div>
    )
  }

  // ── Team not found ─────────────────────────────────────────────────────────
  if (!team) {
    return (
      <div className="fixed inset-0 bg-[#0F111A] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
          <Shield size={40} className="text-white/20" />
        </div>
        <h1 className="font-chakra font-black text-2xl text-white uppercase tracking-tighter mb-2">Team Not Found</h1>
        <p className="text-white/40 text-sm max-w-xs mx-auto mb-8 leading-relaxed">This recruitment link may be expired or invalid.</p>
        <button onClick={() => router.push('/')} className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-chakra font-bold text-xs uppercase tracking-widest transition-all">
          Go Home
        </button>
      </div>
    )
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-[#0F111A] flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="w-28 h-28 bg-gradient-to-br from-gaffer-orange to-[#E7000B] rounded-[36px] flex items-center justify-center mb-8 mx-auto shadow-2xl shadow-gaffer-orange/30">
            <CheckCircle2 size={56} className="text-white" />
          </div>
        </motion.div>
        {photoPreview && (
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gaffer-orange/30 mx-auto mb-6 shadow-xl">
            <img src={photoPreview} className="w-full h-full object-cover object-top" alt="" />
          </div>
        )}
        <h1 className="font-chakra font-black text-4xl text-white uppercase tracking-tighter mb-2">You&apos;re In!</h1>
        <p className="text-white/50 text-sm mb-8 leading-relaxed">
          You have successfully joined <span className="text-white font-bold">{team.name}</span>.
        </p>
        <button onClick={() => router.push('/')} className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-chakra font-bold text-sm uppercase tracking-widest transition-all">
          Finish
        </button>
      </div>
    )
  }

  // ── Main Form ──────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-[#11121C] text-white overflow-hidden flex flex-col items-center justify-center">
      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-gaffer-orange/10 blur-[150px] rounded-full opacity-50 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#E7000B]/10 blur-[150px] rounded-full opacity-50 animate-pulse" style={{ animationDelay: '1.2s' }} />
      </div>

      <div className="relative w-full max-w-[430px] mx-auto px-5 flex flex-col gap-4">

        {/* ── Hero ── */}
        <div className="text-center flex flex-col items-center gap-2">
          {/* Badge */}
          <motion.div initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <Trophy size={12} className="text-gaffer-orange" />
            <span className="text-[10px] font-chakra font-black uppercase tracking-widest text-gaffer-orange">{formatHandle(competitionSlug)}</span>
            {group && (
              <>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-[10px] font-chakra font-black uppercase tracking-widest text-white/40">{formatHandle(group)}</span>
              </>
            )}
          </motion.div>

          {/* Logo + name */}
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: 'spring' }}
            className="flex flex-col items-center gap-2">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-br from-gaffer-orange to-[#E7000B] rounded-[28px] blur-xl opacity-15" />
              <div className="w-[68px] h-[68px] relative rounded-[20px] bg-[#1C1D2B] border border-white/10 shadow-xl p-2.5 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                <img
                  src={team.logoUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${team.name}`}
                  alt={team.name}
                  className="w-full h-full object-contain relative z-10"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
            </div>
            <div>
              <h1 className="font-chakra font-black text-2xl uppercase tracking-tighter leading-none">
                Join <span className="text-gaffer-orange">{team.name}</span>
              </h1>
              <p className="font-chakra text-white/30 text-[10px] font-bold uppercase tracking-[0.3em] mt-0.5">@{teamHandle}</p>
            </div>
          </motion.div>
        </div>

        {/* ── Card ── */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.12 }}
          className="bg-[#1C1D2B]/80 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-[0_30px_80px_rgba(0,0,0,0.5)] relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gaffer-orange/50 to-transparent" />

          <form onSubmit={handleSubmit} className="p-5 space-y-3.5">

            {/* Photo picker */}
            <div className="flex items-center justify-center">
              <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoPick} />
              <div className="relative">
                <button
                  type="button"
                  onClick={() => photoRef.current?.click()}
                  className="w-[72px] h-[72px] rounded-full overflow-hidden bg-[#11121C] border-2 border-dashed border-white/15 hover:border-gaffer-orange/50 transition-colors flex items-center justify-center group"
                >
                  {photoPreview ? (
                    <img src={photoPreview} className="w-full h-full object-cover object-top" alt="" />
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Camera size={18} className="text-white/20 group-hover:text-gaffer-orange/60 transition-colors" />
                      <span className="text-[7px] font-black uppercase tracking-widest text-white/20 group-hover:text-gaffer-orange/60 transition-colors">Photo</span>
                    </div>
                  )}
                </button>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center shadow-lg transition-colors"
                  >
                    <X size={9} className="text-white" />
                  </button>
                )}
              </div>
            </div>

            {/* Name row */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <label className="text-[9px] font-chakra font-black text-white/30 uppercase tracking-[0.2em] ml-1">First Name</label>
                <div className="relative group">
                  <User size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gaffer-orange transition-colors pointer-events-none" />
                  <input type="text" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="John" className={inputCls(true)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-chakra font-black text-white/30 uppercase tracking-[0.2em] ml-1">Last Name</label>
                <input type="text" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Doe" className={inputCls(false)} />
              </div>
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-chakra font-black text-white/30 uppercase tracking-[0.2em] ml-1">Role</label>
              <div className="grid grid-cols-3 gap-2">
                {(['player', 'captain', 'coach'] as const).map(r => (
                  <button key={r} type="button" onClick={() => setForm({ ...form, role: r })}
                    className={`py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                      form.role === r ? 'bg-gaffer-orange border-gaffer-orange text-white' : 'bg-white/[0.03] border-white/10 text-white/40 hover:border-white/25'
                    }`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Position + Jersey (hidden for coach) */}
            {form.role !== 'coach' && (
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-chakra font-black text-white/30 uppercase tracking-[0.2em] ml-1">Position</label>
                  <div className="relative">
                    <select value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-2xl py-3.5 pl-4 pr-9 text-sm font-medium text-white focus:outline-none focus:border-gaffer-orange/50 appearance-none cursor-pointer transition-all">
                      <option value="" className="bg-[#1C1D2B]">Select…</option>
                      {positions.map(p => <option key={p} value={p} className="bg-[#1C1D2B]">{p}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-chakra font-black text-white/30 uppercase tracking-[0.2em] ml-1">Jersey #</label>
                  <div className="relative group">
                    <Hash size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gaffer-orange transition-colors pointer-events-none" />
                    <input type="number" min={1} max={99} value={form.jerseyNumber} onChange={e => setForm({ ...form, jerseyNumber: e.target.value })} placeholder="10" className={inputCls(true)} />
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="pt-0.5">
              <button type="submit" disabled={registerMutation.isPending}
                className="w-full h-[58px] bg-gradient-to-br from-gaffer-orange to-[#E7000B] text-white rounded-[18px] font-chakra font-black text-[14px] uppercase tracking-widest shadow-[0_12px_40px_rgba(255,122,0,0.3)] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2.5 group relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                {registerMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Confirm Registration <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </div>

            <p className="text-[8px] text-center text-white/20 font-black uppercase tracking-[0.2em]">
              By clicking confirm, you agree to join the team roster.
            </p>
          </form>
        </motion.div>

        <p className="text-white/10 text-[8px] font-chakra font-black uppercase tracking-[0.4em] text-center">
          Powered by Gaffer
        </p>
      </div>
    </div>
  )
}
