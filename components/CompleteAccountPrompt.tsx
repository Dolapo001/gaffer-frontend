'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getProfile, updateProfile } from '@/lib/services/user.service'
import { useAuthStore } from '@/store/authStore'
import { getErrorMessage } from '@/lib/api'
import { isProfileComplete } from '@/lib/displayName'

const field = 'w-full h-12 rounded-xl bg-[#181928] border border-white/10 px-4 text-white text-sm outline-none focus:border-orange-500/60 placeholder:text-white/30'
const label = 'block text-xs font-semibold text-white/60 mb-1.5'

const phoneOk = (v: string) => /^\+?[0-9][0-9\s-]{6,17}$/.test(v.trim())

/**
 * Asks everyone, new sign-ups and people who joined before, to finish their account: their name, the name they want
 * to be called, and a phone number. It appears on the next screen they open until it is done.
 */
export function CompleteAccountPrompt() {
  const user = useAuthStore((s) => s.user)
  const setProfile = useAuthStore((s) => s.setProfile)
  const { data: profile, refetch } = useQuery({ queryKey: ['my-profile'], queryFn: getProfile, enabled: !!user, staleTime: 5 * 60_000, meta: { suppressGlobalError: true } })

  const [fullName, setFullName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [filled, setFilled] = useState(false)
  const [error, setError] = useState('')

  // Start from whatever we already know about them
  useEffect(() => {
    if (profile && !filled) {
      setFullName(profile.fullName ?? '')
      setDisplayName(profile.displayName ?? '')
      setPhone(profile.phone ?? '')
      setFilled(true)
    }
  }, [profile, filled])

  const save = useMutation({
    mutationFn: () => updateProfile({ fullName: fullName.trim(), displayName: displayName.trim(), phone: phone.trim() }),
    onSuccess: (p) => { setProfile(p); refetch() },
    onError: (e) => setError(getErrorMessage(e)),
    meta: { suppressGlobalError: true },
  })

  if (!user || !profile || isProfileComplete(profile)) return null

  const full = fullName
  const display = displayName
  const ph = phone
  const valid = full.trim().length > 0 && display.trim().length >= 2 && display.trim().length <= 30 && phoneOk(ph)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!valid || save.isPending) return
    save.mutate()
  }

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Complete your account">
      <div className="absolute inset-0 bg-black/80" />
      <form onSubmit={submit} className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl bg-[#1E2032] border border-white/10 p-6 space-y-4">
        <div>
          <h2 className="text-white text-xl font-black">Complete your account</h2>
          <p className="text-sm text-white/60 mt-1">A few details so other people know who you are on Gaffer.</p>
        </div>

        <div>
          <label className={label} htmlFor="ca-full">Full name</label>
          <input id="ca-full" className={field} value={full} onChange={(e) => setFullName(e.target.value)} autoComplete="name" placeholder="e.g. Ademofe Omotolani" />
        </div>

        <div>
          <label className={label} htmlFor="ca-display">What should we call you?</label>
          <input id="ca-display" className={field} value={display} maxLength={30} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Chrissy" />
          <p className="text-xs text-white/40 mt-1.5">This is the name shown on your comments, in lineups and on leaderboards.</p>
        </div>

        <div>
          <label className={label} htmlFor="ca-phone">Phone number</label>
          <input id="ca-phone" className={field} value={ph} inputMode="tel" autoComplete="tel" onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0803 000 0000" />
          {ph.trim() && !phoneOk(ph) && <p className="text-xs text-red-400 mt-1.5">Enter a valid phone number.</p>}
        </div>

        <div>
          <label className={label} htmlFor="ca-email">Email</label>
          <input id="ca-email" className={`${field} opacity-60`} value={profile.email} readOnly />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button type="submit" disabled={!valid || save.isPending} className="w-full h-12 rounded-full bg-orange-500 text-black font-black text-sm disabled:opacity-40">
          {save.isPending ? 'Saving…' : 'Save and continue'}
        </button>
      </form>
    </div>
  )
}
