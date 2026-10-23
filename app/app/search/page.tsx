'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Search as SearchIcon, X } from 'lucide-react'
import { searchEverything, type SearchType } from '@/lib/services/profile.service'
import { FollowButton } from '@/components/FollowButton'
import { getImageUrl } from '@/lib/api'

const TABS: { key: SearchType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'player', label: 'Player' },
  { key: 'team', label: 'Team' },
  { key: 'match', label: 'Match' },
  { key: 'competition', label: 'Competition' },
]
const RECENT_KEY = 'gaffer-recent-searches'

function readRecent(): string[] { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] } }
function writeRecent(list: string[]) { try { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 6))) } catch { /* private mode */ } }

function Logo({ src, name }: { src?: string | null; name: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={getImageUrl(src)} alt="" className="w-11 h-11 rounded-full object-cover bg-white/10 shrink-0" />
  ) : <span className="w-11 h-11 rounded-full bg-white/10 text-white font-black flex items-center justify-center shrink-0">{name[0]?.toUpperCase()}</span>
}

const row = 'w-full text-left flex items-center gap-3 py-3 border-b border-white/5'

/** One search box for players, teams, matches and tournaments. Tap a player to open their page. */
export default function SearchPage() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [q, setQ] = useState('')
  const [type, setType] = useState<SearchType>('all')
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => { setRecent(readRecent()) }, [])
  useEffect(() => { const t = setTimeout(() => setQ(text.trim()), 300); return () => clearTimeout(t) }, [text])

  const enabled = q.length >= 2
  const results = useQuery({ queryKey: ['search', q, type], queryFn: () => searchEverything(q, type), enabled, staleTime: 30_000, placeholderData: (prev) => prev })

  const remember = () => { if (enabled) { const next = [q, ...readRecent().filter((r) => r.toLowerCase() !== q.toLowerCase())]; writeRecent(next); setRecent(next) } }
  const open = (path: string) => { remember(); router.push(path) }

  const r = results.data
  const nothing = enabled && r && !results.isFetching && r.players.length + r.teams.length + r.competitions.length + r.matches.length === 0

  return (
    <div className="min-h-screen bg-[#181928] px-5 pt-5" style={{ paddingBottom: 'calc(140px + env(safe-area-inset-bottom, 0px))' }}>
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} aria-label="Back" className="text-white"><ChevronLeft size={26} /></button>
        <div className="relative flex-1">
          <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" aria-hidden="true" />
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') remember() }}
            placeholder="Search players, teams, matches"
            aria-label="Search"
            className="w-full h-12 rounded-full bg-white text-black pl-11 pr-10 font-semibold outline-none placeholder:text-black/40"
          />
          {text && <button onClick={() => setText('')} aria-label="Clear" className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50"><X size={18} /></button>}
        </div>
      </div>

      <div role="tablist" aria-label="Search in" className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={type === t.key} onClick={() => setType(t.key)} className={`px-4 h-10 rounded-full text-sm font-semibold shrink-0 ${type === t.key ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>{t.label}</button>
        ))}
      </div>

      {!enabled && (
        <div className="mt-6">
          {recent.length > 0 ? (
            <>
              <div className="flex items-center justify-between"><h2 className="text-white font-bold">Recent</h2><button onClick={() => { writeRecent([]); setRecent([]) }} className="text-xs font-semibold text-orange-400">Clear</button></div>
              {recent.map((s) => (
                <button key={s} onClick={() => setText(s)} className={`${row} text-white`}><SearchIcon size={16} className="text-white/40" /> {s}</button>
              ))}
            </>
          ) : <p className="text-white/45 text-sm text-center mt-10">Type a name to find a player, a team, a match or a tournament.</p>}
        </div>
      )}

      {enabled && !r && results.isLoading && <div className="mt-6 h-24 rounded-2xl bg-white/5 animate-pulse" />}
      {nothing && <p className="text-white/50 text-center mt-10">Nothing found for &ldquo;{q}&rdquo;.</p>}

      {r && r.players.length > 0 && (
        <section className="mt-5" aria-label="Players">
          <h2 className="text-white/45 text-xs font-black uppercase tracking-widest">Players</h2>
          {r.players.map((p) => (
            <div key={p.id} className={row}>
              <button onClick={() => open(`/app/player/${p.id}`)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <Logo src={p.photoUrl} name={p.name} />
                <span className="min-w-0">
                  <span className="block text-white font-semibold truncate">{p.name}</span>
                  <span className="block text-xs text-white/45 truncate">{[p.team?.name, p.position, p.jerseyNumber != null ? `#${p.jerseyNumber}` : null].filter(Boolean).join(' · ')}</span>
                </span>
              </button>
              <FollowButton type="player" id={p.id} />
            </div>
          ))}
        </section>
      )}

      {r && r.teams.length > 0 && (
        <section className="mt-5" aria-label="Teams">
          <h2 className="text-white/45 text-xs font-black uppercase tracking-widest">Teams</h2>
          {r.teams.map((t) => (
            <div key={t.id} className={row}>
              <Logo src={t.logoUrl} name={t.name} />
              <span className="flex-1 min-w-0 text-white font-semibold truncate">{t.name}</span>
              <FollowButton type="team" id={t.id} />
            </div>
          ))}
        </section>
      )}

      {r && r.matches.length > 0 && (
        <section className="mt-5" aria-label="Matches">
          <h2 className="text-white/45 text-xs font-black uppercase tracking-widest">Matches</h2>
          {r.matches.map((m) => (
            <button key={m.id} onClick={() => open(`/app/match/${m.id}`)} className={row}>
              <span className="flex-1 min-w-0 text-white text-sm">
                <span className="block font-semibold truncate">{m.home?.name} {m.score ? `${m.score.home} - ${m.score.away}` : 'v'} {m.away?.name}</span>
                <span className="block text-xs text-white/45 truncate">{[m.tournament, new Date(m.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })].filter(Boolean).join(' · ')}</span>
              </span>
            </button>
          ))}
        </section>
      )}

      {r && r.competitions.length > 0 && (
        <section className="mt-5" aria-label="Competitions">
          <h2 className="text-white/45 text-xs font-black uppercase tracking-widest">Competitions</h2>
          {r.competitions.map((c) => (
            <button key={c.id} onClick={() => open(`/app/league/${c.id}`)} className={row}>
              <span className="w-11 h-11 rounded-full bg-orange-500/20 text-orange-300 font-black flex items-center justify-center shrink-0">{c.name[0]}</span>
              <span className="flex-1 min-w-0 text-left text-white font-semibold truncate">{c.name}</span>
            </button>
          ))}
        </section>
      )}
    </div>
  )
}
