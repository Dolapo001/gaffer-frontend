'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { StaffInviteLinkCard } from '@/components/admin/StaffInviteLinkCard'
import { listCompetitionTeams } from '@/lib/services/competition.service'
import { createCoachInvite } from '@/lib/services/coach.service'
import { getErrorMessage } from '@/lib/api'
import { onThisSite } from '@/lib/siteLink'

/** HQ: the organisation's staff invite link, and a coach link for any of its teams. */
export function OrgInviteLinks({ orgId, orgName, competitions }: { orgId: string; orgName: string; competitions: { id: string; name: string }[] }) {
  return (
    <div className="space-y-4">
      <StaffInviteLinkCard orgId={orgId} orgName={orgName} tone="hq" />
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 space-y-3">
        <div>
          <h3 className="text-white font-bold text-[16px]">Coach links</h3>
          <p className="text-[13px] text-gaffer-muted font-body">Each link works once, for 14 days: the first person to open it becomes the team&apos;s coach.</p>
        </div>
        {competitions.length === 0 ? (
          <p className="text-sm font-body">No tournaments yet, so no teams.</p>
        ) : (
          competitions.map((c) => <CompetitionCoachLinks key={c.id} competition={c} />)
        )}
      </div>
    </div>
  )
}

function CompetitionCoachLinks({ competition }: { competition: { id: string; name: string } }) {
  const [open, setOpen] = useState(false)
  const { data: teams, isLoading } = useQuery({
    queryKey: ['hq', 'coach-link-teams', competition.id],
    queryFn: () => listCompetitionTeams(competition.id),
    enabled: open,
  })
  return (
    <details className="rounded-xl border border-gaffer-border" onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className="cursor-pointer px-3 py-2 text-sm font-body font-semibold">{competition.name}</summary>
      <div className="px-3 pb-3 space-y-2">
        {isLoading && <p className="text-sm text-gaffer-muted font-body">Loading teams…</p>}
        {teams && teams.length === 0 && <p className="text-sm font-body">No teams in this tournament yet.</p>}
        {teams?.map((t) => <TeamCoachLink key={t.teamId || t._id} teamId={t.teamId || t._id} name={t.name} />)}
      </div>
    </details>
  )
}

function TeamCoachLink({ teamId, name }: { teamId: string; name: string }) {
  const [link, setLink] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const make = async () => {
    setBusy(true)
    setError(null)
    try {
      const r = await createCoachInvite(teamId)
      setLink(onThisSite(r.link))
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }
  const copy = async () => {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-wrap items-center gap-2 py-1.5 border-t border-gaffer-border first:border-t-0">
      <span className="flex-1 min-w-[140px] text-sm font-body">{name}</span>
      {link ? (
        <>
          <span className="w-full md:w-auto md:max-w-[320px] truncate text-xs text-gaffer-muted font-body select-all">{link}</span>
          <button onClick={copy} className="px-3 py-1.5 rounded-xl bg-gaffer-orange text-black text-sm font-bold">{copied ? 'Copied' : 'Copy'}</button>
        </>
      ) : (
        <button onClick={make} disabled={busy} className="px-3 py-1.5 rounded-xl border border-gaffer-border text-sm font-body font-semibold hover:bg-gaffer-card disabled:opacity-50">
          {busy ? 'Making…' : 'Make coach link'}
        </button>
      )}
      {error && <p role="alert" className="w-full text-xs text-red-400 font-body">{error}</p>}
    </div>
  )
}
