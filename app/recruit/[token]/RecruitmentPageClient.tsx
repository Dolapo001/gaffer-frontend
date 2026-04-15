'use client'

/**
 * RecruitmentPageClient
 *
 * Public open-recruitment page at /recruit/:handle
 *
 * Uses the existing public backend endpoints:
 *   GET  /public/teams/:handle          → validate team exists
 *   POST /public/teams/:handle/register → submit application
 *
 * State machine: loading → valid | invalid → done
 * No auth required. No redirect under any condition.
 */

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  User,
  Phone,
  Mail,
  Hash,
  AlertCircle,
} from 'lucide-react'
import { ApiError } from '@/lib/api'
import {
  getPublicTeamByHandle,
  registerPublicPlayer,
  type Team,
} from '@/lib/services/team.service'

type PageStatus = 'loading' | 'valid' | 'invalid'

const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'] as const

interface FieldErrors {
  firstName?: string
  lastName?: string
  position?: string
  phone?: string
  email?: string
  jerseyNumber?: string
  general?: string
}

interface RecruitmentPageClientProps {
  token: string // actually the team handle
}

export function RecruitmentPageClient({ token: handle }: RecruitmentPageClientProps) {
  // ── Validation state ──
  const [status, setStatus] = useState<PageStatus>('loading')
  const [team, setTeam] = useState<Team | null>(null)
  const calledRef = useRef(false)

  // ── Form state ──
  const [fields, setFields] = useState({
    firstName: '',
    lastName: '',
    position: '',
    phone: '',
    email: '',
    jerseyNumber: '',
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDone, setIsDone] = useState(false)

  // ── Validate once on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    if (!handle) {
      setStatus('invalid')
      return
    }

    getPublicTeamByHandle(handle)
      .then((t) => {
        setTeam(t)
        setStatus('valid')
      })
      .catch(() => setStatus('invalid'))
  }, [handle])

  // ── Field helpers ─────────────────────────────────────────────────────────
  const set =
    (key: keyof typeof fields) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFields((prev) => ({ ...prev, [key]: e.target.value }))
      setErrors((prev) => ({ ...prev, [key]: undefined, general: undefined }))
    }

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (): FieldErrors => {
    const errs: FieldErrors = {}
    if (!fields.firstName.trim()) errs.firstName = 'First name is required.'
    if (!fields.lastName.trim()) errs.lastName = 'Last name is required.'
    if (!fields.position) errs.position = 'Please select a position.'
    if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      errs.email = 'Enter a valid email address.'
    }
    if (
      fields.jerseyNumber &&
      (isNaN(Number(fields.jerseyNumber)) ||
        Number(fields.jerseyNumber) < 1 ||
        Number(fields.jerseyNumber) > 99)
    ) {
      errs.jerseyNumber = 'Jersey number must be 1–99.'
    }
    return errs
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const clientErrors = validate()
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      return
    }
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      await registerPublicPlayer(handle, {
        firstName: fields.firstName.trim(),
        lastName: fields.lastName.trim(),
        position: fields.position.toLowerCase(),
        phone: fields.phone.trim() || undefined,
        email: fields.email.trim() || undefined,
        jerseyNumber: fields.jerseyNumber ? Number(fields.jerseyNumber) : undefined,
      })
      setIsDone(true)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrors({ general: err.message || 'Submission failed. Please try again.' })
      } else {
        setErrors({ general: 'Something went wrong. Please try again.' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputCls = (field: keyof FieldErrors) =>
    `w-full px-4 py-3.5 rounded-xl bg-[#1C1F2D] border text-white placeholder:text-white/25 font-body text-sm focus:outline-none transition-colors ${
      errors[field]
        ? 'border-red-500/60 focus:border-red-500'
        : 'border-white/5 focus:border-orange-500/50'
    }`

  return (
    <div className="min-h-screen bg-[#0F111A] text-white flex flex-col font-inter">
      {/* Header */}
      <header className="px-6 pt-14 pb-5 shrink-0 border-b border-white/[0.05]">
        <span className="text-[11px] font-body font-bold text-white/30 uppercase tracking-[0.25em]">
          Gaffer FC
        </span>
        <h1 className="font-chakra font-black text-2xl uppercase tracking-tight italic text-white mt-1">
          {team?.name ? `Join ${team.name}` : 'Open Recruitment'}
        </h1>
      </header>

      <main className="flex-1 px-6 pb-20 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* ── Loading ── */}
          {status === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[55vh] gap-4"
            >
              <RefreshCw size={32} className="text-orange-500 animate-spin" />
              <p className="text-white/40 text-sm font-body">Loading recruitment form…</p>
            </motion.div>
          )}

          {/* ── Invalid ── */}
          {status === 'invalid' && (
            <motion.div
              key="invalid"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[55vh] gap-6 text-center px-4"
            >
              <div className="w-20 h-20 rounded-[28px] bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <ShieldAlert size={36} className="text-red-400" />
              </div>
              <div>
                <h2 className="font-chakra font-black text-xl uppercase text-white mb-2">
                  Team Not Found
                </h2>
                <p className="text-white/40 text-sm font-body leading-relaxed max-w-xs mx-auto">
                  This recruitment link is invalid. Please contact the manager for a new one.
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Done ── */}
          {isDone && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 300, delay: 0.1 }}
                className="w-24 h-24 rounded-[32px] bg-green-500/10 border border-green-500/20 flex items-center justify-center"
              >
                <CheckCircle2 size={44} className="text-green-400" />
              </motion.div>
              <div>
                <h2 className="font-chakra font-black text-2xl uppercase text-white mb-2 italic">
                  Application Sent!
                </h2>
                <p className="text-white/50 text-sm font-body leading-relaxed max-w-xs mx-auto">
                  Your request has been submitted. The coach will review your application.
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Valid — Form ── */}
          {status === 'valid' && !isDone && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pt-6 space-y-6"
            >
              {/* Team context card */}
              {team && (
                <div className="bg-[#1C1F2D] rounded-[20px] p-4 border border-white/5 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                    {team.logoUrl ? (
                      <img src={team.logoUrl} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-orange-400 font-black text-sm uppercase">
                        {team.name?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-body font-bold text-white/30 uppercase tracking-widest">
                      Recruiting for
                    </p>
                    <p className="text-white font-display font-bold text-base leading-tight">
                      {team.name}
                    </p>
                    {team.handle && (
                      <p className="text-white/30 text-[11px] font-body">@{team.handle}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Global error */}
              {errors.general && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/25"
                >
                  <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm font-body">{errors.general}</p>
                </motion.div>
              )}

              {/* Required */}
              <div className="space-y-4">
                <p className="text-[11px] font-body font-bold text-white/30 uppercase tracking-widest">
                  Required Info
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-body font-medium text-white/70 flex items-center gap-1">
                      First Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
                      <input
                        type="text"
                        value={fields.firstName}
                        onChange={set('firstName')}
                        placeholder="First"
                        disabled={isSubmitting}
                        className={`${inputCls('firstName')} pl-9`}
                      />
                    </div>
                    {errors.firstName && <p className="text-red-400 text-xs">{errors.firstName}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-body font-medium text-white/70 flex items-center gap-1">
                      Last Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={fields.lastName}
                      onChange={set('lastName')}
                      placeholder="Last"
                      disabled={isSubmitting}
                      className={inputCls('lastName')}
                    />
                    {errors.lastName && <p className="text-red-400 text-xs">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-body font-medium text-white/70 flex items-center gap-1">
                    Preferred Position <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {POSITIONS.map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => {
                          setFields((prev) => ({ ...prev, position: pos }))
                          setErrors((prev) => ({ ...prev, position: undefined }))
                        }}
                        className={`h-11 rounded-xl border font-display font-bold text-[11px] uppercase tracking-wider transition-all ${
                          fields.position === pos
                            ? 'bg-orange-500/15 border-orange-500 text-orange-400'
                            : 'bg-[#1C1F2D] border-white/5 text-white/40 hover:text-white/60'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                  {errors.position && <p className="text-red-400 text-xs">{errors.position}</p>}
                </div>
              </div>

              {/* Optional */}
              <div className="space-y-4">
                <p className="text-[11px] font-body font-bold text-white/30 uppercase tracking-widest">
                  Optional Info
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-body font-medium text-white/70">Phone Number</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
                    <input
                      type="tel"
                      value={fields.phone}
                      onChange={set('phone')}
                      placeholder="+234 810 000 0000"
                      disabled={isSubmitting}
                      className={`${inputCls('phone')} pl-9`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-body font-medium text-white/70">Email Address</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
                    <input
                      type="email"
                      value={fields.email}
                      onChange={set('email')}
                      placeholder="you@example.com"
                      disabled={isSubmitting}
                      className={`${inputCls('email')} pl-9`}
                    />
                  </div>
                  {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-body font-medium text-white/70">Preferred Jersey #</label>
                  <div className="relative">
                    <Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={fields.jerseyNumber}
                      onChange={set('jerseyNumber')}
                      placeholder="1–99"
                      disabled={isSubmitting}
                      className={`${inputCls('jerseyNumber')} pl-9`}
                    />
                  </div>
                  {errors.jerseyNumber && <p className="text-red-400 text-xs">{errors.jerseyNumber}</p>}
                </div>
              </div>

              {/* Submit */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-5 rounded-2xl bg-orange-gradient-btn text-white font-display font-bold text-base shadow-orange-glow disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Submitting…
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  )
}
