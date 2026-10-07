'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listOrgs, reapplyOrg } from '@/lib/services/org.service'
import { ApiError } from '@/lib/api'

/**
 * Tells an organisation where it stands with Gaffer HQ, on every organisation page:
 *   pending   → under review (everything can be set up, publishing waits for approval)
 *   rejected  → the reason, and a short form to fix details and apply again
 *   suspended → locked out
 * Approved organisations see nothing.
 */
export function OrgStatusBanner() {
  const qc = useQueryClient()
  const { data: orgs } = useQuery({ queryKey: ['orgs', 'mine'], queryFn: listOrgs, staleTime: 30_000 })
  const org = orgs?.[0]
  const [editing, setEditing] = useState(false)
  const [about, setAbout] = useState('')
  const [phone, setPhone] = useState('')
  const [social, setSocial] = useState('')
  const [error, setError] = useState<string | null>(null)

  const reapply = useMutation({
    mutationFn: () =>
      reapplyOrg(org!._id, {
        description: about.trim() || undefined,
        phone: phone.trim() || undefined,
        socialLinks: social.trim() ? [social.trim()] : undefined,
      }),
    onSuccess: () => {
      setEditing(false)
      setError(null)
      qc.invalidateQueries({ queryKey: ['orgs'] })
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not send it. Try again.'),
  })

  if (!org) return null

  const box = 'mx-4 mt-3 rounded-2xl border p-4 font-body text-sm'

  if (org.lifecycleStatus === 'suspended') {
    return (
      <div role="status" className={`${box} border-red-500/40 bg-red-500/10 text-red-100`}>
        <p className="font-semibold">Your organisation is suspended.</p>
        {org.suspension?.reason && <p className="mt-1">{org.suspension.reason}</p>}
        <p className="mt-1 text-red-200/80">You can&apos;t make changes until Gaffer lifts the suspension. Players in your tournaments can keep playing.</p>
      </div>
    )
  }

  if (org.verificationStatus === 'pending') {
    return (
      <div role="status" className={`${box} border-yellow-500/40 bg-yellow-500/10 text-yellow-100`}>
        <p className="font-semibold">Your organisation is under review.</p>
        <p className="mt-1 text-yellow-100/80">You can set up tournaments, teams and players now. Publishing opens as soon as Gaffer approves you.</p>
      </div>
    )
  }

  if (org.verificationStatus === 'rejected') {
    const input = 'mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white'
    return (
      <div role="status" className={`${box} border-red-500/40 bg-red-500/10 text-red-100`}>
        <p className="font-semibold">Your organisation was not approved yet.</p>
        {org.application?.rejectionReason && <p className="mt-1">&ldquo;{org.application.rejectionReason}&rdquo;</p>}
        {!editing ? (
          <button onClick={() => { setEditing(true); setAbout(org.description ?? ''); setPhone(org.application?.phone ?? ''); setSocial(org.application?.socialLinks?.[0] ?? '') }} className="mt-3 rounded-xl bg-gaffer-orange px-4 py-2 font-bold text-black">
            Update details and apply again
          </button>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); reapply.mutate() }} className="mt-3 space-y-3">
            <label className="block">About your league<textarea rows={3} maxLength={500} value={about} onChange={(e) => setAbout(e.target.value)} className={input} /></label>
            <label className="block">Phone<input value={phone} onChange={(e) => setPhone(e.target.value)} className={input} /></label>
            <label className="block">Social page or website<input value={social} onChange={(e) => setSocial(e.target.value)} className={input} /></label>
            {error && <p role="alert" className="text-red-300">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={reapply.isPending} className="rounded-xl bg-gaffer-orange px-4 py-2 font-bold text-black disabled:opacity-60">{reapply.isPending ? 'Sending…' : 'Send for review'}</button>
              <button type="button" onClick={() => setEditing(false)} className="px-3 py-2 text-white/70">Cancel</button>
            </div>
          </form>
        )}
      </div>
    )
  }

  return null
}
