'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UserCheck, Mail, X } from 'lucide-react'
import { getTeamCoaches, removeTeamCoach, revokeCoachInvite } from '@/lib/services/coach.service'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'
import { formatDateTime } from '@/lib/dates'

export const teamCoachesKey = (teamId: string) => ['team-coaches', teamId] as const

type Target = { kind: 'coach'; id: string; name: string } | { kind: 'invite'; id: string; name: string }

/** The people who coach a team and the coach invites still waiting, with a way to take access away. */
export function TeamCoachesPanel({ teamId, teamName }: { teamId: string; teamName: string }) {
  const qc = useQueryClient()
  const toast = useToastStore()
  const [target, setTarget] = useState<Target | null>(null)

  const list = useQuery({ queryKey: teamCoachesKey(teamId), queryFn: () => getTeamCoaches(teamId), staleTime: 15_000 })

  const revoke = useMutation({
    mutationFn: (t: Target) => (t.kind === 'coach' ? removeTeamCoach(teamId, t.id) : revokeCoachInvite(teamId, t.id)),
    onSuccess: (_r, t) => {
      toast.addToast(t.kind === 'coach' ? `${t.name} can no longer coach ${teamName}.` : 'Invite withdrawn. Its link no longer works.', 'success')
      qc.invalidateQueries({ queryKey: teamCoachesKey(teamId) })
    },
    onError: (e) => toast.addToast(getErrorMessage(e), 'error'),
    onSettled: () => setTarget(null),
  })

  const coaches = list.data?.coaches ?? []
  const invites = list.data?.invites ?? []
  if (list.isLoading || list.isError || (coaches.length === 0 && invites.length === 0)) return null

  return (
    <div className="bg-[#1C1E2B] rounded-2xl p-3.5 border border-white/[0.03] space-y-2.5">
      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Coaches</p>

      {coaches.map((c) => (
        <div key={c.userId} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0"><UserCheck size={15} className="text-emerald-300" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{c.name}</p>
            <p className="text-[11px] text-white/40 truncate">{c.email ?? 'Coach'}{c.squadConfirmedAt ? ' · squad confirmed' : ''}</p>
          </div>
          <button onClick={() => setTarget({ kind: 'coach', id: c.userId, name: c.name })} className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:opacity-80">Remove</button>
        </div>
      ))}

      {invites.map((i) => (
        <div key={i.id} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0"><Mail size={15} className="text-white/50" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{i.email ?? 'Invite link (anyone with it)'}</p>
            <p className="text-[11px] text-white/40">Invited, not accepted · expires {formatDateTime(i.expiresAt)}</p>
          </div>
          <button onClick={() => setTarget({ kind: 'invite', id: i.id, name: i.email ?? 'this invite' })} aria-label="Withdraw invite" className="text-white/40 hover:text-red-400"><X size={16} /></button>
        </div>
      ))}

      <ConfirmDialog
        open={!!target}
        destructive
        title={target?.kind === 'coach' ? `Remove ${target.name}?` : 'Withdraw this invite?'}
        message={target?.kind === 'coach'
          ? `They lose access to ${teamName} straight away and are told. You can invite them again later.`
          : 'The link stops working. If it was emailed, the email can no longer be used.'}
        confirmLabel={target?.kind === 'coach' ? 'Remove coach' : 'Withdraw invite'}
        onConfirm={() => target && revoke.mutate(target)}
        onCancel={() => setTarget(null)}
      />
    </div>
  )
}
