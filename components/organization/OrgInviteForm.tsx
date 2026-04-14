'use client'

/**
 * OrgInviteForm
 *
 * Collects collaborator details for someone accepting an organisation invite.
 * Submits via POST /invite/accept with type="organization".
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Phone, AlertCircle, RefreshCw } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { acceptInvite } from '@/lib/services/invite.service'
import { ApiError } from '@/lib/api'

const ROLES = ['Manager', 'Assistant Manager', 'Coach', 'Scout', 'Analyst', 'Staff'] as const
type OrgRole = (typeof ROLES)[number]

interface FieldErrors {
  firstName?: string
  lastName?: string
  phone?: string
  role?: string
  general?: string
}

interface OrgInviteFormProps {
  token: string
  onSuccess: () => void
}

export function OrgInviteForm({ token, onSuccess }: OrgInviteFormProps) {
  const [fields, setFields] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    role: '' as OrgRole | '',
  })
  const [errors, setErrors] = useState<FieldErrors>({})

  const set =
    (key: keyof typeof fields) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFields((prev) => ({ ...prev, [key]: e.target.value }))
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    }

  const validate = (): FieldErrors => {
    const errs: FieldErrors = {}
    if (!fields.firstName.trim()) errs.firstName = 'First name is required.'
    if (!fields.lastName.trim()) errs.lastName = 'Last name is required.'
    if (!fields.role) errs.role = 'Please select a role.'
    return errs
  }

  const acceptMutation = useMutation({
    mutationFn: () =>
      acceptInvite(token, 'organization', {
        firstName: fields.firstName.trim(),
        lastName: fields.lastName.trim(),
        phone: fields.phone.trim() || undefined,
        role: fields.role || undefined,
      }),
    onSuccess: () => onSuccess(),
    onError: (err: unknown) => {
      if (!(err instanceof ApiError)) {
        setErrors({ general: 'Something went wrong. Please try again.' })
        return
      }
      switch (err.status) {
        case 404:
          setErrors({ general: 'This invite link is invalid or does not exist.' })
          break
        case 410:
          setErrors({ general: 'This invite link has expired. Please ask for a new one.' })
          break
        case 400:
          setErrors({ general: 'This invite link has already been used.' })
          break
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
    acceptMutation.mutate()
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

      {/* Name */}
      <div>
        <p className="text-[11px] font-body font-bold text-white/30 uppercase tracking-widest mb-3">
          Your Details
        </p>
        <div className="grid grid-cols-2 gap-3">
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
            {errors.firstName && (
              <p className="text-red-400 text-xs">{errors.firstName}</p>
            )}
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
              className={inputCls('lastName')}
            />
            {errors.lastName && (
              <p className="text-red-400 text-xs">{errors.lastName}</p>
            )}
          </div>
        </div>
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        <label className="text-xs font-body font-medium text-white/70">
          Phone Number <span className="text-white/30">(optional)</span>
        </label>
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

      {/* Role */}
      <div className="space-y-2">
        <label className="text-xs font-body font-medium text-white/70 flex items-center gap-1">
          Your Role <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setFields((prev) => ({ ...prev, role: r }))
                setErrors((prev) => ({ ...prev, role: undefined }))
              }}
              className={`h-11 rounded-xl border font-display font-bold text-[11px] uppercase tracking-wider transition-all ${
                fields.role === r
                  ? 'bg-orange-500/15 border-orange-500 text-orange-400'
                  : 'bg-[#1C1F2D] border-white/5 text-white/40 hover:text-white/60'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        {errors.role && <p className="text-red-400 text-xs">{errors.role}</p>}
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
            Joining Organisation…
          </>
        ) : (
          'Accept Invitation'
        )}
      </button>
    </div>
  )
}
