'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Armchair } from 'lucide-react'
import { getPlayerFantasy, getPlayerMatches, getPlayerProfile, type PlayerFantasy, type PlayerMatch, type PlayerProfile } from '@/lib/services/profile.service'
import { FollowButton } from '@/components/FollowButton'
import { getImageUrl } from '@/lib/api'
import { getRatingBadgeStyle } from '@/lib/ratingsEngine'

const TABS = ['Overview', 'Matches', 'Tournaments', 'Fantasy'] as const
type Tab = (typeof TABS)[number]

const card = 'rounded-3xl bg-[#1E2032] border border-white/5 p-4'
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: '2-digit' })

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-[11px] font-bold uppercase tracking-wider text-white/45">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  )
}

function RatingBadge({ rating }: { rating: number | null }) {
  if (rating == null) return <span className="w-11 text-center text-white/25 text-sm">–</span>
  const st = getRatingBadgeStyle(rating, false)
  return <span className={`w-11 text-center text-sm font-black px-1.5 py-1 rounded-md ${st.bgClass} ${st.textClass}`}>{rating.toFixed(1)}</span>
}

function MatchRow({ m }: { m: PlayerMatch }) {
  const router = useRouter()
  const pill = m.result === 'W' ? 'bg-emerald-500/25 text-emerald-300' : m.result === 'L' ? 'bg-red-500/25 text-red-300' : m.result === 'D' ? 'bg-white/15 text-white/70' : ''
  return (
    <button onClick={() => router.push(`/app/match/${m.fixtureId}`)} className="w-full text-left flex items-center gap-3 py-3 border-t border-white/5 first:border-t-0">
      <span className="w-14 text-[11px] text-white/45 leading-tight">{fmtDate(m.date)}<br />{m.status === 'completed' ? 'FT' : m.status === 'scheduled' ? '' : 'LIVE'}</span>
      <span className="flex-1 min-w-0 text-sm text-white">
        <span className="flex justify-between gap-2"><span className="truncate">{m.home?.name}</span><b>{m.score ? m.score.home : ''}</b></span>
        <span className="flex justify-between gap-2"><span className="truncate">{m.away?.name}</span><b>{m.score ? m.score.away : ''}</b></span>
      </span>
      <span className="flex items-center gap-2 shrink-0">
        {m.goals > 0 && <span title="Goals" className="text-sm text-white">⚽{m.goals > 1 ? ` ${m.goals}` : ''}</span>}
        {m.assists > 0 && <span title="Assists" className="text-xs text-white/70">A{m.assists > 1 ? ` ${m.assists}` : ''}</span>}
        {m.yellowCards > 0 && <span title="Yellow card" className="w-3 h-4 rounded-[2px] bg-yellow-400 inline-block" />}
        {m.redCards > 0 && <span title="Red card" className="w-3 h-4 rounded-[2px] bg-red-500 inline-block" />}
        {m.benched ? <Armchair size={20} className="text-white/40" aria-label="Unused substitute" /> : <RatingBadge rating={m.rating} />}
        {m.result && <span className={`w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center ${pill}`}>{m.result}</span>}
      </span>
    </button>
  )
}

function Overview({ profile, matches }: { profile: PlayerProfile; matches: PlayerMatch[] | undefined }) {
  const t = profile.totals
  return (
    <div className="space-y-4">
      <section className={card}>
        <h3 className="text-white font-bold mb-3">Career numbers</h3>
        <div className="grid grid-cols-3 gap-y-5">
          <Stat label="Matches" value={t.matches} />
          <Stat label="Goals" value={t.goals} />
          <Stat label="Assists" value={t.assists} />
          <Stat label="Rating" value={t.avgRating != null ? t.avgRating.toFixed(1) : '–'} />
          <Stat label="Yellow" value={t.yellowCards} />
          <Stat label="Red" value={t.redCards} />
          {t.cleanSheets > 0 && <Stat label="Clean sheets" value={t.cleanSheets} />}
        </div>
      </section>

      {profile.teams.length > 0 && (
        <section className={card}>
          <h3 className="text-white font-bold mb-2">Teams</h3>
          <ul className="space-y-2">
            {profile.teams.map((tm) => (
              <li key={tm.id} className="flex items-center gap-3 text-white text-sm">
                {tm.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getImageUrl(tm.logoUrl)} alt="" className="w-8 h-8 rounded-full object-contain bg-white/5" />
                ) : <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-black">{tm.name[0]}</span>}
                <span className="font-semibold">{tm.name}</span>
                {tm.role === 'captain' && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300">Captain</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={card}>
        <h3 className="text-white font-bold mb-1">Latest matches</h3>
        {!matches ? <div className="h-16 rounded-xl bg-white/5 animate-pulse" /> : matches.length === 0 ? <p className="text-sm text-white/45 py-3">No matches yet.</p> : matches.slice(0, 4).map((m) => <MatchRow key={m.fixtureId} m={m} />)}
      </section>
    </div>
  )
}

function Matches({ matches }: { matches: PlayerMatch[] | undefined }) {
  if (!matches) return <div className="h-32 rounded-3xl bg-white/5 animate-pulse" />
  if (matches.length === 0) return <p className="text-sm text-white/45 text-center py-10">No matches yet.</p>
  const groups: Record<string, PlayerMatch[]> = {}
  for (const m of matches) { const k = m.tournament ?? 'Matches'; (groups[k] = groups[k] ?? []).push(m) }
  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([name, list]) => (
        <section key={name} className={card}>
          <h3 className="text-white font-bold mb-1">{name}</h3>
          {list.map((m) => <MatchRow key={m.fixtureId} m={m} />)}
        </section>
      ))}
    </div>
  )
}

function Tournaments({ profile }: { profile: PlayerProfile }) {
  if (profile.tournaments.length === 0) return <p className="text-sm text-white/45 text-center py-10">No tournaments yet.</p>
  return (
    <section className={card}>
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 text-[11px] font-bold uppercase tracking-wider text-white/45 pb-2">
        <span>Tournament</span><span className="w-10 text-right">RTG</span><span className="w-8 text-right">MP</span><span className="w-8 text-right">G</span><span className="w-8 text-right">A</span>
      </div>
      {profile.tournaments.map((t) => (
        <div key={t.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 items-center py-3 border-t border-white/5">
          <span className="min-w-0"><span className="block text-white text-sm font-semibold truncate">{t.name}</span>{t.team && <span className="block text-xs text-white/45 truncate">{t.team.name}</span>}</span>
          <span className="w-10 flex justify-end"><RatingBadge rating={t.avgRating} /></span>
          <span className="w-8 text-right text-white text-sm">{t.matches}</span>
          <span className="w-8 text-right text-white text-sm">{t.goals}</span>
          <span className="w-8 text-right text-white text-sm">{t.assists}</span>
        </div>
      ))}
    </section>
  )
}

function PriceChart({ history }: { history: PlayerFantasy['priceHistory'] }) {
  if (history.length === 0) return <p className="text-sm text-white/45">The price has not changed yet.</p>
  const w = 320, h = 110
  const prices = history.map((x) => x.price)
  const lo = Math.min(...prices), hi = Math.max(...prices)
  const pad = Math.max(0.2, (hi - lo) * 0.2)
  const y = (p: number) => h - ((p - (lo - pad)) / (hi - lo + pad * 2)) * h
  const x = (i: number) => (history.length === 1 ? w / 2 : (i / (history.length - 1)) * w)
  const pts = history.map((p, i) => `${x(i)},${y(p.price)}`).join(' ')
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h + 18}`} role="img" aria-label="Price over the rounds" className="w-full h-auto">
        <polyline points={pts} fill="none" stroke="#FF8904" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        {history.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.price)} r={4} fill="#FF8904"><title>{`Price ${p.price}`}</title></circle>)}
        <text x={0} y={h + 14} fontSize={11} className="fill-white/45">Start</text>
        <text x={w} y={h + 14} fontSize={11} textAnchor="end" className="fill-white/45">Now</text>
      </svg>
      <div className="mt-2 flex justify-between text-xs text-white/60"><span>Lowest <b className="text-white">{lo}</b></span><span>Highest <b className="text-white">{hi}</b></span></div>
    </div>
  )
}

function Fantasy({ id }: { id: string }) {
  const { data, isLoading } = useQuery({ queryKey: ['player-fantasy', id], queryFn: () => getPlayerFantasy(id) })
  const [pick, setPick] = useState(0)
  if (isLoading) return <div className="h-32 rounded-3xl bg-white/5 animate-pulse" />
  if (!data || data.length === 0) return <p className="text-sm text-white/45 text-center py-10">This player is not in a Fantasy game yet.</p>
  const f = data[Math.min(pick, data.length - 1)]
  return (
    <div className="space-y-4">
      {data.length > 1 && (
        <select aria-label="Tournament" value={pick} onChange={(e) => setPick(Number(e.target.value))} className="w-full h-12 rounded-2xl bg-[#1E2032] border border-white/10 text-white px-4 font-semibold">
          {data.map((d, i) => <option key={d.competitionId} value={i}>{d.tournament}</option>)}
        </select>
      )}
      <section className={card}>
        <h3 className="text-white font-bold mb-3">{data.length === 1 ? f.tournament : 'General'}</h3>
        <div className="grid grid-cols-3 gap-y-5">
          <Stat label="Pts / match" value={f.pointsPerMatch} />
          <Stat label="Form" value={f.form != null ? f.form : '–'} />
          <Stat label="Total points" value={f.totalPoints} />
          <Stat label="Price" value={f.price != null ? f.price.toFixed(1) : '–'} />
          <Stat label="Selected" value={`${f.selectedPercent}%`} />
          <Stat label="Position" value={f.position ?? '–'} />
        </div>
      </section>
      <section className={card}>
        <h3 className="text-white font-bold mb-3">Price tracker</h3>
        <PriceChart history={f.priceHistory} />
      </section>
      <section className={card}>
        <div className="flex items-center justify-between mb-1"><h3 className="text-white font-bold">Results</h3><span className="text-[11px] font-bold uppercase tracking-wider text-white/45">Pts</span></div>
        {f.rounds.length === 0 ? <p className="text-sm text-white/45 py-3">No rounds scored yet.</p> : f.rounds.map((r) => (
          <div key={r.round} className="flex items-center justify-between py-3 border-t border-white/5 first:border-t-0 text-sm">
            <span className="text-white"><b className="text-white/50 mr-3">R{r.round}</b>{r.name}</span>
            <span className={`font-black ${r.appeared ? 'text-white' : 'text-white/30'}`}>{r.appeared ? r.points : '–'}</span>
          </div>
        ))}
      </section>
    </div>
  )
}

/** A player's page: who they are, what they did, and how they do in Fantasy. */
export default function PlayerPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('Overview')
  const [followers, setFollowers] = useState<number | null>(null)

  const profile = useQuery({ queryKey: ['player-profile', id], queryFn: () => getPlayerProfile(id), retry: false })
  const matches = useQuery({ queryKey: ['player-matches', id], queryFn: () => getPlayerMatches(id), enabled: !!profile.data })

  if (profile.isLoading) return <div className="min-h-screen bg-[#181928] p-5"><div className="h-40 rounded-3xl bg-white/5 animate-pulse" /></div>
  if (profile.isError || !profile.data) {
    return (
      <div className="min-h-screen bg-[#181928] p-5 space-y-4">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-white/70 text-sm font-semibold"><ChevronLeft size={18} /> Back</button>
        <p className="text-white/60">We could not find this player.</p>
      </div>
    )
  }

  const p = profile.data
  const team = p.teams[0]
  const count = followers ?? p.followers

  return (
    <div className="min-h-screen bg-[#181928]" style={{ paddingBottom: 'calc(140px + env(safe-area-inset-bottom, 0px))' }}>
      <header className="px-5 pt-5 pb-4 bg-gradient-to-b from-[#252848] to-[#181928]">
        <button onClick={() => router.back()} aria-label="Back" className="flex items-center gap-1 text-white/80 text-sm font-semibold -ml-1"><ChevronLeft size={20} /> Back</button>
        <div className="mt-4 flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-orange-500 text-black font-black text-3xl flex items-center justify-center overflow-hidden shrink-0">
            {p.player.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getImageUrl(p.player.photoUrl)} alt="" className="w-full h-full object-cover" />
            ) : p.player.name[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-white font-black text-2xl leading-tight truncate">{p.player.name}</h1>
            {p.player.name !== p.player.fullName && <p className="text-white/45 text-sm truncate">{p.player.fullName}</p>}
            {team && <p className="text-white/70 text-sm mt-0.5 truncate">{team.name}</p>}
            <p className="text-white/45 text-xs mt-1">
              {[p.player.position, p.player.jerseyNumber != null ? `#${p.player.jerseyNumber}` : null, p.player.nationality].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-white/60 text-sm"><b className="text-white">{count}</b> {count === 1 ? 'follower' : 'followers'}</p>
          <FollowButton type="player" id={id} initial={p.isFollowing} size="md" onChange={(_f, n) => setFollowers(n)} />
        </div>
      </header>

      <div role="tablist" aria-label="Player" className="flex px-5 border-b border-white/10 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`px-4 h-12 shrink-0 font-semibold text-sm border-b-2 -mb-px ${tab === t ? 'border-orange-500 text-white' : 'border-transparent text-white/50'}`}>{t}</button>
        ))}
      </div>

      <div className="px-5 pt-5">
        {tab === 'Overview' && <Overview profile={p} matches={matches.data} />}
        {tab === 'Matches' && <Matches matches={matches.data} />}
        {tab === 'Tournaments' && <Tournaments profile={p} />}
        {tab === 'Fantasy' && <Fantasy id={id} />}
      </div>
    </div>
  )
}
