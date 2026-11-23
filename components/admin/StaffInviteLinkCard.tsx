'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link2, Copy, Check, Share2, RefreshCw } from 'lucide-react'
import { createInviteLink, getInviteLink, revokeInviteLink } from '@/lib/services/member.service'
import { useToast } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'
import { onThisSite } from '@/lib/siteLink'

const ROLES = [
  { id: 'manager', label: 'Manager', hint: 'Tournaments, teams, fixtures, live matches' },
  { id: 'staff', label: 'Staff', hint: 'Lineups and match events' },
  { id: 'viewer', label: 'Viewer', hint: 'See everything, change nothing' },
  { id: 'admin', label: 'Admin', hint: 'Everything, including staff' },
] as const

/** One link the organisation shares with everyone it wants on its staff. Used on the organiser Staff page and in HQ. */
export function StaffInviteLinkCard({ orgId, orgName, tone = 'app' }: { orgId: string; orgName?: string; tone?: 'app' | 'hq' }) {
  const qc = useQueryClient()
  const { addToast } = useToast()
  const [copied, setCopied] = useState(false)
  const [role, setRole] = useState<string>('manager')
  const key = ['staff-invite-link', orgId]
  const { data: link, isLoading } = useQuery({ queryKey: key, queryFn: () => getInviteLink(orgId), enabled: !!orgId })

  const url = link ? onThisSite(link.url) : ''

  const make = useMutation({
    mutationFn: (r: string) => createInviteLink(orgId, r),
    onSuccess: (l) => { qc.setQueryData(key, l); addToast('Invite link ready', 'success') },
    onError: (e) => addToast(getErrorMessage(e), 'error'),
  })
  const off = useMutation({
    mutationFn: () => revokeInviteLink(orgId),
    onSuccess: () => { qc.setQueryData(key, null); addToast('Invite link switched off', 'info') },
    onError: (e) => addToast(getErrorMessage(e), 'error'),
  })

  const copy = async () => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      addToast('Could not copy. Press and hold the link to copy it.', 'error')
    }
  }
  const share = async () => {
    if (!link) return
    const text = `Join ${orgName ? `the ${orgName}` : 'our'} team on Gaffer and help run our tournaments: ${url}`
    if (navigator.share) {
      try { await navigator.share({ text }) } catch { /* closed */ }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
    }
  }

  const card = tone === 'hq' ? 'bg-white/[0.03] border border-white/10 rounded-2xl p-5' : 'bg-[#1C2130] rounded-[24px] p-5 border border-white/5'

  return (
    <section className={`${card} space-y-4`} aria-label="Staff invite link">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-orange-500/15 flex items-center justify-center shrink-0"><Link2 size={18} className="text-orange-400" /></div>
        <div className="min-w-0">
          <h2 className="text-white font-bold text-[16px]">Staff invite link</h2>
          <p className="text-white/50 text-[13px]">Send one link to everyone you want helping you. Anyone who opens it can join{orgName ? ` ${orgName}` : ''}.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-12 rounded-xl bg-white/5 animate-pulse" />
      ) : link ? (
        <>
          <div className="bg-black/30 rounded-xl px-3 py-3 border border-white/5">
            <span className="block truncate text-[13px] text-white/80 select-all">{url}</span>
          </div>
          <p className="text-[12px] text-white/40">
            People join as <span className="text-white/70 font-semibold capitalize">{link.role}</span>. {link.uses} {link.uses === 1 ? 'person has' : 'people have'} joined with this link.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={copy} className="h-11 rounded-full bg-orange-500 text-black font-black text-[13px] flex items-center justify-center gap-2">
              {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy link</>}
            </button>
            <button onClick={share} className="h-11 rounded-full border border-white/15 text-white font-bold text-[13px] flex items-center justify-center gap-2">
              <Share2 size={16} /> Share
            </button>
          </div>
          <details className="text-[13px]">
            <summary className="cursor-pointer text-white/50">Change the role or reset the link</summary>
            <div className="pt-3 space-y-3">
              <RolePicker role={role} setRole={setRole} />
              <div className="flex gap-2">
                <button onClick={() => make.mutate(role)} disabled={make.isPending} className="flex-1 h-10 rounded-full border border-white/15 text-white font-bold text-[13px] flex items-center justify-center gap-2 disabled:opacity-50">
                  <RefreshCw size={14} /> Make a new link
                </button>
                <button onClick={() => off.mutate()} disabled={off.isPending} className="h-10 px-4 rounded-full text-red-400 font-bold text-[13px] disabled:opacity-50">Switch off</button>
              </div>
              <p className="text-[12px] text-white/40">A new link stops the old one working. People who already joined stay.</p>
            </div>
          </details>
        </>
      ) : (
        <div className="space-y-3">
          <RolePicker role={role} setRole={setRole} />
          <button onClick={() => make.mutate(role)} disabled={make.isPending} className="w-full h-11 rounded-full bg-orange-500 text-black font-black text-[13px] disabled:opacity-50">
            {make.isPending ? 'Making link…' : 'Make invite link'}
          </button>
        </div>
      )}
    </section>
  )
}

function RolePicker({ role, setRole }: { role: string; setRole: (r: string) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-[12px] text-white/50">People who join get this role</p>
      <div className="grid grid-cols-2 gap-2">
        {ROLES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRole(r.id)}
            aria-pressed={role === r.id}
            className={`text-left rounded-xl px-3 py-2 border ${role === r.id ? 'border-orange-500 bg-orange-500/10' : 'border-white/10 bg-white/[0.03]'}`}
          >
            <span className="block text-white text-[13px] font-bold">{r.label}</span>
            <span className="block text-white/40 text-[11px] leading-snug">{r.hint}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
