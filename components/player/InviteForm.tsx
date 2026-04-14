'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Phone, Calendar, Flag, Hash, AlertCircle, RefreshCw } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { acceptPlayerInviteWithToken, type AcceptInvitePayload } from '@/lib/services/team.service'
import { ApiError } from '@/lib/api'

const POSITIONS = ['goalkeeper', 'defender', 'midfielder', 'forward'] as const

interface FieldErrors {
  firstName?: string
  lastName?: string
  phone?: string
  dateOfBirth?: string
  position?: string
  jerseyNumber?: string
  nationality?: string
  general?: string
}

interface InviteFormProps {
  token: string
  /** Callback fired after the player is successfully registered */
  onSuccess: () => void
}

/**
 * InviteForm — collects player details and submits them via
 * POST /player-invites/accept with the invite token.
 *
 * Handles all backend error codes:
 *   INVALID_OR_EXPIRED_INVITE → shows global error (token reused / expired)
 *   TEAM_FULL                 → shows global error
 *   JERSEY_TAKEN              → highlights jerseyNumber field
 *   INVALID_PLAYER_DATA       → maps backend details to individual fields
 */
export function InviteForm({ token, onSuccess }: InviteFormProps) {
  const [fields, setFields] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    position: '',
    jerseyNumber: '',
    nationality: '',
  })
  const [errors, setErrors] = useState<FieldErrors>({})

  const set = (key: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFields((prev) => ({ ...prev, [key]: e.target.value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const validate = (): FieldErrors => {
    const errs: FieldErrors = {}
    if (!fields.firstName.trim()) errs.firstName = 'First name is required.'
    if (!fields.lastName.trim()) errs.lastName = 'Last name is required.'
    if (fields.jerseyNumber && (isNaN(Number(fields.jerseyNumber)) || Number(fields.jerseyNumber) < 1 || Number(fields.jerseyNumber) > 99)) {
      errs.jerseyNumber = 'Jersey number must be between 1 and 99.'
    }
    return errs
  }

  const acceptMutation = useMutation({
    mutationFn: (payload: AcceptInvitePayload) => acceptPlayerInviteWithToken(payload),
    onSuccess: () => onSuccess(),
    onError: (err: unknown) => {
      if (!(err instanceof ApiError)) {
        setErrors({ general: 'Something went wrong. Please try again.' })
        return
      }

      switch (err.code) {
        case 'INVALID_OR_EXPIRED_INVITE':
          setErrors({ general: 'This invite link has expired or has already been used.' })
          break
        case 'TEAM_FULL':
          setErrors({ general: 'This team is currently full. Contact the manager.' })
          break
        case 'JERSEY_TAKEN':
          setErrors({ jerseyNumber: 'This jersey number is already taken. Choose another.' })
          break
        case 'INVALID_PLAYER_DATA': {
          // details may be: { field: string, message: string }[]
          const details = err.details as Array<{ field?: string; message?: string }> | null
          if (Array.isArray(details) && details.length > 0) {
            const mapped: FieldErrors = {}
            details.forEach(({ field, message }) => {
              if (field && message) {
                const key = field as keyof FieldErrors
                mapped[key] = message
              }
            })
            if (Object.keys(mapped).length) {
              setErrors(mapped)
              return
            }
          }
          setErrors({ general: err.message || 'Invalid player data. Please check your details.' })
          break
        }
        default:
          setErrors({ general: err.message || 'Something went wrong.' })
      }
    },
  })

  const handleSubmit = () => {
    const clientErrors = validate()
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      return
    }

    const payload: AcceptInvitePayload = {
      token,
      firstName: fields.firstName.trim(),
      lastName: fields.lastName.trim(),
      phone: fields.phone.trim() || undefined,
      dateOfBirth: fields.dateOfBirth || undefined,
      position: fields.position || undefined,
      jerseyNumber: fields.jerseyNumber ? Number(fields.jerseyNumber) : undefined,
      nationality: fields.nationality.trim() || undefined,
    }
    acceptMutation.mutate(payload)
  }

  const inputCls = (field: keyof FieldErrors) =>
    `w-full px-4 py-3 rounded-xl bg-[#1C1F2D] border text-white placeholder:text-white/25 font-body text-sm focus:outline-none transition-colors ${
      errors[field]
        ? 'border-red-500/60 focus:border-red-500'
        : 'border-white/5 focus:border-orange-500/50'
    }`

  return (
    <div className="space-y-6">
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

      {/* Required fields */}
      <div>
        <p className="text-[11px] font-body font-bold text-white/30 uppercase tracking-widest mb-3">
          Personal Details
        </p>
        <div className="grid grid-cols-2 gap-3">
          {/* First Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-body font-medium text-white/70 flex items-center gap-1">
              First Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                type="text"
                value={fields.firstName}
                onChange={set('firstName')}
                placeholder="First"
                className={`${inputCls('firstName')} pl-9`}
              />
            </div>
            {errors.firstName && <p className="text-red-400 text-xs">{errors.firstName}</p>}
          </div>

          {/* Last Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-body font-medium text-white/70 flex items-center gap-1">
              Last Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={fields.lastName}
              onChange={set('lastName')}
              placeholder="Last"
              className={inputCls('lastName')}
            />
            {errors.lastName && <p className="text-red-400 text-xs">{errors.lastName}</p>}
          </div>
        </div>
      </div>

      {/* Optional fields */}
      <div>
        <p className="text-[11px] font-body font-bold text-white/30 uppercase tracking-widest mb-3">
          Optional Info
        </p>
        <div className="space-y-3">
          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-body font-medium text-white/70">Phone Number</label>
            <div className="relative">
              <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                type="tel"
                value={fields.phone}
                onChange={set('phone')}
                placeholder="+234 810 000 0000"
                className={`${inputCls('phone')} pl-9`}
              />
            </div>
            {errors.phone && <p className="text-red-400 text-xs">{errors.phone}</p>}
          </div>

          {/* Date of Birth */}
          <div className="space-y-1.5">
            <label className="text-xs font-body font-medium text-white/70">Date of Birth</label>
            <div className="relative">
              <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                type="date"
                value={fields.dateOfBirth}
                onChange={set('dateOfBirth')}
                className={`${inputCls('dateOfBirth')} pl-9`}
              />
            </div>
            {errors.dateOfBirth && <p className="text-red-400 text-xs">{errors.dateOfBirth}</p>}
          </div>

          {/* Nationality + Jersey side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-body font-medium text-white/70">Nationality</label>
              <div className="relative">
                <Flag size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  type="text"
                  value={fields.nationality}
                  onChange={set('nationality')}
                  placeholder="e.g. Nigerian"
                  className={`${inputCls('nationality')} pl-9`}
                />
              </div>
              {errors.nationality && <p className="text-red-400 text-xs">{errors.nationality}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-body font-medium text-white/70">Jersey #</label>
              <div className="relative">
                <Hash size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={fields.jerseyNumber}
                  onChange={set('jerseyNumber')}
                  placeholder="1–99"
                  className={`${inputCls('jerseyNumber')} pl-9`}
                />
              </div>
              {errors.jerseyNumber && <p className="text-red-400 text-xs">{errors.jerseyNumber}</p>}
            </div>
          </div>

          {/* Position */}
          <div className="space-y-1.5">
            <label className="text-xs font-body font-medium text-white/70">Preferred Position</label>
            <div className="grid grid-cols-2 gap-2">
              {POSITIONS.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => {
                    setFields((prev) => ({ ...prev, position: pos }))
                    setErrors((prev) => ({ ...prev, position: undefined }))
                  }}
                  className={`h-11 rounded-xl border font-display font-bold text-[11px] uppercase tracking-wider transition-all capitalize ${
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
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={acceptMutation.isPending}
        className="w-full py-5 rounded-2xl bg-orange-gradient-btn text-white font-display font-bold text-base shadow-orange-glow disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
      >
        {acceptMutation.isPending ? (
          <>
            <RefreshCw size={18} className="animate-spin" />
            Joining Team…
          </>
        ) : (
          'Join Team'
        )}
      </button>
    </div>
  )
}
