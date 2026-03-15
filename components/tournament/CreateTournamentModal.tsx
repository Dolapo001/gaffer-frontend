'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, Trophy, MapPin, Calendar, Users, Zap } from 'lucide-react'
import { useTournamentStore, type SportType, type TournamentFormat } from '@/store/tournamentStore'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  sport: z.enum(['football', 'basketball', 'cricket', 'tennis', 'other'] as const),
  format: z.enum(['knockout', 'league', 'group+knockout'] as const),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  maxTeams: z.number().min(2).max(64),
  location: z.string().min(2, 'Location is required'),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface CreateTournamentProps {
  onClose: () => void
  onSuccess?: () => void
}

const SPORT_OPTIONS: { value: SportType; label: string; emoji: string }[] = [
  { value: 'football', label: 'Football', emoji: '⚽' },
  { value: 'basketball', label: 'Basketball', emoji: '🏀' },
  { value: 'cricket', label: 'Cricket', emoji: '🏏' },
  { value: 'tennis', label: 'Tennis', emoji: '🎾' },
  { value: 'other', label: 'Other', emoji: '🏆' },
]

const FORMAT_OPTIONS: { value: TournamentFormat; label: string; desc: string }[] = [
  { value: 'knockout', label: 'Knockout', desc: 'Single elimination bracket' },
  { value: 'league', label: 'League', desc: 'Round-robin, everyone plays each other' },
  { value: 'group+knockout', label: 'Group + Knockout', desc: 'Group stage then elimination' },
]

const STEPS = ['Details', 'Format', 'Schedule']

export function CreateTournamentModal({ onClose, onSuccess }: CreateTournamentProps) {
  const [step, setStep] = useState(0)
  const { addTournament } = useTournamentStore()
  const { user } = useAuthStore()

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { sport: 'football', format: 'knockout', maxTeams: 8 },
  })

  const watchedSport = watch('sport')
  const watchedFormat = watch('format')

  const nextStep = async () => {
    const fieldsPerStep: (keyof FormData)[][] = [
      ['name', 'sport', 'location'],
      ['format', 'maxTeams'],
      ['startDate', 'endDate'],
    ]
    const valid = await trigger(fieldsPerStep[step])
    if (valid) setStep((s) => Math.min(s + 1, 2))
  }

  const onSubmit = (data: FormData) => {
    addTournament({
      ...data,
      status: 'upcoming',
      createdBy: user?.uid || 'org',
    })
    onSuccess?.()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative mt-auto bg-gaffer-surface rounded-t-3xl border-t border-gaffer-border max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Drag indicator */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gaffer-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gaffer-border">
          <h2 className="font-display font-bold text-white text-lg">Create Tournament</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gaffer-card text-gaffer-muted hover:text-white border border-gaffer-border transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 px-5 py-3">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-display font-bold border transition-all ${
                i < step ? 'bg-gaffer-orange border-gaffer-orange text-white'
                  : i === step ? 'border-gaffer-orange text-gaffer-orange'
                  : 'border-gaffer-border text-gaffer-subtle'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-body flex-1 ${i === step ? 'text-white' : 'text-gaffer-subtle'}`}>{s}</span>
              {i < STEPS.length - 1 && (
                <div className={`h-px flex-1 ${i < step ? 'bg-gaffer-orange' : 'bg-gaffer-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form content */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">

              {/* STEP 0 — Details */}
              {step === 0 && (
                <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 pt-2">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-body font-medium text-white/80 mb-1.5">Tournament Name</label>
                    <div className="relative">
                      <Trophy size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gaffer-subtle" />
                      <input
                        {...register('name')}
                        placeholder="e.g. Bowen Champions Cup"
                        className="w-full pl-9 pr-4 py-3.5 rounded-xl bg-gaffer-card border border-gaffer-border text-white placeholder:text-gaffer-subtle font-body text-sm focus:outline-none focus:border-gaffer-orange transition-colors"
                      />
                    </div>
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                  </div>

                  {/* Sport */}
                  <div>
                    <label className="block text-sm font-body font-medium text-white/80 mb-2">Sport</label>
                    <div className="grid grid-cols-3 gap-2">
                      {SPORT_OPTIONS.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setValue('sport', s.value)}
                          className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-center transition-all ${
                            watchedSport === s.value
                              ? 'border-gaffer-orange bg-gaffer-orange/10'
                              : 'border-gaffer-border bg-gaffer-card hover:border-gaffer-border/70'
                          }`}
                        >
                          <span className="text-xl">{s.emoji}</span>
                          <span className={`text-xs font-body font-medium ${watchedSport === s.value ? 'text-gaffer-orange' : 'text-gaffer-muted'}`}>{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-body font-medium text-white/80 mb-1.5">Location</label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gaffer-subtle" />
                      <input
                        {...register('location')}
                        placeholder="e.g. Lagos, Nigeria"
                        className="w-full pl-9 pr-4 py-3.5 rounded-xl bg-gaffer-card border border-gaffer-border text-white placeholder:text-gaffer-subtle font-body text-sm focus:outline-none focus:border-gaffer-orange transition-colors"
                      />
                    </div>
                    {errors.location && <p className="text-red-400 text-xs mt-1">{errors.location.message}</p>}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-body font-medium text-white/80 mb-1.5">Description <span className="text-gaffer-subtle">(optional)</span></label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      placeholder="Brief tournament description..."
                      className="w-full px-4 py-3 rounded-xl bg-gaffer-card border border-gaffer-border text-white placeholder:text-gaffer-subtle font-body text-sm focus:outline-none focus:border-gaffer-orange transition-colors resize-none"
                    />
                  </div>
                </motion.div>
              )}

              {/* STEP 1 — Format */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-sm font-body font-medium text-white/80 mb-2">Tournament Format</label>
                    <div className="space-y-2">
                      {FORMAT_OPTIONS.map((f) => (
                        <button
                          key={f.value}
                          type="button"
                          onClick={() => setValue('format', f.value)}
                          className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                            watchedFormat === f.value
                              ? 'border-gaffer-orange bg-gaffer-orange/10'
                              : 'border-gaffer-border bg-gaffer-card hover:border-gaffer-border/70'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            watchedFormat === f.value ? 'bg-gaffer-orange/20' : 'bg-gaffer-surface'
                          }`}>
                            <Zap size={16} className={watchedFormat === f.value ? 'text-gaffer-orange' : 'text-gaffer-subtle'} />
                          </div>
                          <div>
                            <p className={`font-body font-semibold text-sm ${watchedFormat === f.value ? 'text-gaffer-orange' : 'text-white'}`}>{f.label}</p>
                            <p className="text-gaffer-muted text-xs font-body mt-0.5">{f.desc}</p>
                          </div>
                          {watchedFormat === f.value && (
                            <div className="ml-auto w-5 h-5 rounded-full bg-gaffer-orange flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-body font-medium text-white/80 mb-1.5">Maximum Teams</label>
                    <div className="relative">
                      <Users size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gaffer-subtle" />
                      <select
                        {...register('maxTeams', { valueAsNumber: true })}
                        className="w-full pl-9 pr-4 py-3.5 rounded-xl bg-gaffer-card border border-gaffer-border text-white font-body text-sm focus:outline-none focus:border-gaffer-orange transition-colors appearance-none cursor-pointer"
                      >
                        {[4, 8, 12, 16, 24, 32, 48, 64].map((n) => (
                          <option key={n} value={n} className="bg-gaffer-card">{n} Teams</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2 — Schedule */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-sm font-body font-medium text-white/80 mb-1.5">Start Date</label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gaffer-subtle pointer-events-none" />
                      <input
                        type="date"
                        {...register('startDate')}
                        className="w-full pl-9 pr-4 py-3.5 rounded-xl bg-gaffer-card border border-gaffer-border text-white font-body text-sm focus:outline-none focus:border-gaffer-orange transition-colors [color-scheme:dark]"
                      />
                    </div>
                    {errors.startDate && <p className="text-red-400 text-xs mt-1">{errors.startDate.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-body font-medium text-white/80 mb-1.5">End Date</label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gaffer-subtle pointer-events-none" />
                      <input
                        type="date"
                        {...register('endDate')}
                        className="w-full pl-9 pr-4 py-3.5 rounded-xl bg-gaffer-card border border-gaffer-border text-white font-body text-sm focus:outline-none focus:border-gaffer-orange transition-colors [color-scheme:dark]"
                      />
                    </div>
                    {errors.endDate && <p className="text-red-400 text-xs mt-1">{errors.endDate.message}</p>}
                  </div>

                  {/* Summary preview */}
                  <div className="bg-gaffer-card border border-gaffer-border rounded-2xl p-4 space-y-2">
                    <p className="text-white text-sm font-body font-semibold">Ready to create?</p>
                    <p className="text-gaffer-muted text-xs font-body leading-relaxed">
                      Once created, you can add teams, schedule matches, and manage the tournament from your admin dashboard.
                    </p>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </form>
        </div>

        {/* Footer actions */}
        <div className="px-5 pb-8 pt-3 border-t border-gaffer-border flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1.5 px-5 py-3.5 rounded-xl border border-gaffer-border text-white font-body font-medium text-sm hover:bg-gaffer-card transition-colors"
            >
              <ChevronLeft size={16} />
              Back
            </button>
          )}
          {step < 2 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-xl bg-orange-gradient-btn text-white font-display font-bold text-sm shadow-orange-glow"
            >
              Next
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-orange-gradient-btn text-white font-display font-bold text-sm shadow-orange-glow"
            >
              <Trophy size={16} />
              Create Tournament
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
