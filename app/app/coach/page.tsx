'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Link2, Check, ChevronRight, Users } from 'lucide-react'
import { confirmSquad, getMyCoachTeams, type CoachFixture, type CoachTeam } from '@/lib/services/coach.service'
import { useToast } from '@/store/toastStore'
import { getErrorMessage, getImageUrl } from '@/lib/api'

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

function lineupChip(f: CoachFixture) {
  if (f.status !== 'scheduled') return { text: 'Match started', cls: 'bg-white/10 text-white/60' }
  if (!f.lineup || f.lineup.starters.length === 0) return { text: 'Pick lineup', cls: 'bg-orange-500 text-black' }
  return f.lineup.status === 'approved'
    ? { text: 'Lineup approved', cls: 'bg-emerald-500/20 text-emerald-300' }
    : { text: 'Lineup sent', cls: 'bg-sky-500/20 text-sky-300' }
}

function TeamSection({ team }: { team: CoachTeam }) {
  const router = useRouter()
  const qc = useQueryClient()
  const { addToast } = useToast()

  const confirm = useMutation({
    mutationFn: () => confirmSquad(team.teamId),
    onSuccess: (r) => { addToast(`Squad confirmed: ${r.players} players. The organiser has been told.`, 'success'); qc.invalidateQueries({ queryKey: ['coach-teams'] }) },
    onError: (e) => addToast(getErrorMessage(e), 'error'),
  })

  const shareLink = async () => {
    try {
      if (navigator.share) await navigator.share({ title: `Join ${team.name}`, text: `Register for ${team.name} on Gaffer`, url: team.recruitmentLink })
      else { await navigator.clipboard.writeText(team.recruitmentLink); addToast('Recruitment link copied', 'success') }
    } catch { /* cancelled */ }
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center text-white font-black">
          {team.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={getImageUrl(team.logoUrl)} alt="" className="w-full h-full object-contain" />
          ) : team.name[0]}
        </div>
        <h2 className="text-white font-black text-xl">{team.name}</h2>
      </div>

      <div className="rounded-3xl bg-[#1E2032] border border-white/5 p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-white font-bold flex items-center gap-2"><Users size={18} className="text-orange-400" /> Squad</h3>
            <p className="text-sm text-white/50">{team.squad.length} {team.squad.length === 1 ? 'player' : 'players'} registered</p>
          </div>
          <button onClick={shareLink} className="flex items-center gap-2 px-4 h-11 rounded-full border border-white/15 text-white text-sm font-semibold">
            <Link2 size={16} /> Send link
          </button>
        </div>

        {team.squad.length === 0 ? (
          <p className="text-sm text-white/50">No one has registered yet. Send the recruitment link to your players. They join by filling in a short form.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {team.squad.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2.5">
                <span className="w-8 text-center text-white/40 text-sm font-bold">{p.jerseyNumber ?? ''}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-white text-sm font-semibold truncate">{p.name}</span>
                  {p.name !== p.fullName && <span className="block text-xs text-white/40 truncate">{p.fullName}</span>}
                </span>
                {p.position && <span className="text-xs text-white/50 uppercase">{p.position}</span>}
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={() => confirm.mutate()}
          disabled={confirm.isPending || team.squad.length === 0}
          className="w-full h-12 rounded-full bg-orange-500 text-black font-black text-sm disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {team.squadConfirmedAt && <Check size={16} />}
          {confirm.isPending ? 'Confirming…' : team.squadConfirmedAt ? 'Squad confirmed. Confirm again after changes' : 'Confirm squad'}
        </button>
        <p className="text-xs text-white/40">The organiser is told when you confirm. They can still make changes to your squad.</p>
      </div>

      <div className="space-y-3">
        <h3 className="text-white font-bold text-lg">Matches</h3>
        {team.fixtures.length === 0 && <p className="text-sm text-white/50">No matches are scheduled yet.</p>}
        {team.fixtures.map((f) => {
          const chip = lineupChip(f)
          return (
            <button key={f.id} onClick={() => router.push(`/app/coach/match/${f.id}`)} className="w-full text-left rounded-2xl bg-[#1E2032] border border-white/5 p-4 flex items-center gap-3 active:scale-[0.99] transition">
              <div className="min-w-0 flex-1">
                <p className="text-white font-semibold truncate">{f.home ? 'v' : '@'} {f.opponent?.name ?? 'Opponent'}</p>
                <p className="text-xs text-white/50 mt-0.5">{when(f.kickoffAt)}{f.venue ? ` · ${f.venue}` : ''}</p>
              </div>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full shrink-0 ${chip.cls}`}>{chip.text}</span>
              <ChevronRight size={18} className="text-white/30 shrink-0" />
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default function CoachDashboardPage() {
  const router = useRouter()
  const { data: teams, isLoading } = useQuery({ queryKey: ['coach-teams'], queryFn: getMyCoachTeams })

  return (
    <div className="min-h-screen bg-[#181928] px-5 pt-6 space-y-6" style={{ paddingBottom: 'calc(140px + env(safe-area-inset-bottom, 0px))' }}>
      <header className="flex items-center justify-between">
        <button onClick={() => router.push('/app/dashboard')} className="flex items-center gap-1 text-white/70 text-sm font-semibold"><ChevronLeft size={18} /> Player mode</button>
        <span className="text-xs font-black uppercase tracking-widest text-orange-400">Coach mode</span>
      </header>

      {isLoading && <div className="h-40 rounded-3xl bg-white/5 animate-pulse" />}

      {!isLoading && (teams ?? []).length === 0 && (
        <div className="rounded-3xl bg-[#1E2032] border border-dashed border-white/10 p-8 text-center space-y-2">
          <h1 className="text-white font-black text-lg">You are not coaching a team yet</h1>
          <p className="text-sm text-white/50">When an organiser sends you a coach invite link, open it and your team appears here.</p>
        </div>
      )}

      {(teams ?? []).map((t) => <TeamSection key={t.teamId} team={t} />)}
    </div>
  )
}
