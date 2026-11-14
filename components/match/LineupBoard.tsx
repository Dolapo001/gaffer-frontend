'use client'

/**
 * The match lineups, laid out like the best score apps: one calm pitch with both teams (home from the top, away
 * from the bottom), round player photos, "10 C. Azubuike" labels, a small rating pill and event marks, then the
 * substitutes for either team.
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getImageUrl } from '@/lib/api'
import { calculatePlayerRating, eventsForPlayer, getRatingBadgeStyle } from '@/lib/ratingsEngine'
import { zonesFromString } from '@/lib/lineupFormation'
import { TeamBadge } from '@/components/ui/TeamBadge'
import type { LineupPlayer, TeamLineupData } from './MatchLineupPitch'

type Side = 'home' | 'away'
const idOf = (v: any) => (v && typeof v === 'object' ? String(v._id) : v ? String(v) : '')

/** "C. Azubuike": the nickname if the player has one, otherwise first initial and last name. */
export function shortPlayerName(p: Pick<LineupPlayer, 'name'> & { firstName?: string; lastName?: string; displayName?: string }) {
  const nick = (p.displayName || '').trim()
  if (nick) return nick
  const first = (p.firstName || '').trim()
  const last = (p.lastName || '').trim()
  if (first && last) return `${first[0]}. ${last}`
  return last || first || p.name || 'Player'
}

function Silhouette() {
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden>
      <rect width="40" height="40" fill="#C7CAD1" />
      <circle cx="20" cy="15" r="7" fill="#9EA3AD" />
      <path d="M6 40c1.5-8.5 7.2-13 14-13s12.5 4.5 14 13z" fill="#9EA3AD" />
    </svg>
  )
}

function Avatar({ photoUrl, size }: { photoUrl?: string; size: number }) {
  return (
    <span className="block overflow-hidden rounded-full ring-2 ring-[#15171e]" style={{ width: size, height: size }}>
      {photoUrl ? <img src={getImageUrl(photoUrl)} alt="" className="h-full w-full object-cover object-top" /> : <Silhouette />}
    </span>
  )
}

interface Marks { goals: number; assists: number; yellow: boolean; red: boolean; subOut?: number | null }

function marksFor(player: LineupPlayer, events: any[]): Marks {
  const mine = eventsForPlayer(player.id, events)
  const t = (e: any) => String(e.type || e.rawType || '').toLowerCase()
  const subOut = events.find((e: any) => ['sub', 'substitution'].includes(t(e)) && idOf(e.playerOutId || e.playerId) === String(player.id))
  return {
    goals: mine.filter((e) => ['goal', 'penalty_scored'].includes(t(e))).length,
    assists: events.filter((e: any) => idOf(e.assistPlayerId) === String(player.id)).length,
    yellow: !!player.hasYellowCard,
    red: !!player.hasRedCard,
    subOut: subOut ? subOut.minute ?? null : null,
  }
}

function MarkIcons({ m }: { m: Marks }) {
  return (
    <span className="absolute -right-1.5 -top-1 flex gap-0.5">
      {m.goals > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-0.5 text-[9px] font-bold text-black" title={`${m.goals} goal${m.goals > 1 ? 's' : ''}`}>
          ⚽{m.goals > 1 ? m.goals : ''}
        </span>
      )}
      {m.red ? <span className="h-4 w-3 rounded-[2px] bg-[#ef4444]" title="Red card" /> : m.yellow ? <span className="h-4 w-3 rounded-[2px] bg-[#facc15]" title="Yellow card" /> : null}
      {m.subOut != null && (
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#15171e] text-[10px] font-bold text-[#ef4444]" title={`Substituted ${m.subOut}'`}>↓</span>
      )}
    </span>
  )
}

function PlayerSpot({ player, rating, marks, onOpen }: { player: LineupPlayer & Record<string, any>; rating: number | null; marks: Marks; onOpen: () => void }) {
  const badge = rating != null ? getRatingBadgeStyle(rating, marks.red) : null
  return (
    <button type="button" onClick={onOpen} className="flex min-w-0 max-w-[104px] flex-1 flex-col items-center gap-1.5 px-0.5 focus:outline-none">
      <span className="relative">
        <Avatar photoUrl={player.photoUrl} size={44} />
        <MarkIcons m={marks} />
        {badge && (
          <span
            className="absolute -bottom-1 -left-3 rounded-[4px] px-1 py-px text-[10px] font-bold leading-[14px] tabular-nums"
            style={{ background: badge.badgeColorHex, color: badge.badgeColorHex === '#eab308' ? '#000' : '#fff' }}
          >
            {rating!.toFixed(1)}
          </span>
        )}
        {player.isCaptain && <span className="absolute -bottom-1 -right-2 rounded-full bg-white px-1 text-[9px] font-bold leading-[14px] text-black">C</span>}
      </span>
      <span className="flex max-w-full items-baseline gap-1 text-[12px] leading-4">
        <span className="shrink-0 tabular-nums text-white/45">{player.jerseyNumber}</span>
        <span className="truncate font-semibold text-white">{shortPlayerName(player)}</span>
      </span>
    </button>
  )
}

/** Rows from the goal outwards: goalkeeper, defence, midfield, attack. */
function rowsOf(team: TeamLineupData): LineupPlayer[][] {
  const z = zonesFromString(team.formation)
  const s = team.starters
  const rows = [s.slice(0, 1), s.slice(1, 1 + z.DEF), s.slice(1 + z.DEF, 1 + z.DEF + z.MID), s.slice(1 + z.DEF + z.MID)]
  return rows.filter((r) => r.length)
}

function TeamBar({ team }: { team: TeamLineupData }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <TeamBadge name={team.teamName} logoUrl={team.logoUrl} size={28} />
      <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-white">{team.teamName}</span>
      <span className="text-[13px] font-semibold tabular-nums text-white/70">{team.formation}</span>
    </div>
  )
}

function PitchLines() {
  const line = 'rgba(255,255,255,0.10)'
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 200" aria-hidden>
      <rect x="0.5" y="0.5" width="99" height="199" fill="none" stroke={line} strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
      <line x1="0" y1="100" x2="100" y2="100" stroke={line} strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <rect x="28" y="0" width="44" height="14" fill="none" stroke={line} strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <rect x="40" y="0" width="20" height="5" fill="none" stroke={line} strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <rect x="28" y="186" width="44" height="14" fill="none" stroke={line} strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <rect x="40" y="195" width="20" height="5" fill="none" stroke={line} strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function CentreCircle() {
  return <span className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" aria-hidden />
}

function SubstitutesCard({ home, away, events }: { home: TeamLineupData; away: TeamLineupData; events: any[] }) {
  const [side, setSide] = useState<Side>('home')
  const team = side === 'home' ? home : away
  const router = useRouter()
  const cameOn = (p: LineupPlayer) => events.find((e: any) => ['sub', 'substitution'].includes(String(e.type || e.rawType).toLowerCase()) && idOf(e.playerInId || e.relatedPlayerId) === String(p.id))
  const bench = team.bench || []
  return (
    <section className="rounded-2xl bg-[#1c1e26]">
      <div className="p-3">
        <div className="grid grid-cols-2 rounded-full bg-black/30 p-1" role="tablist" aria-label="Team">
          {([['home', home], ['away', away]] as const).map(([s, t]) => (
            <button key={s} role="tab" aria-selected={side === s} onClick={() => setSide(s)} className={`flex items-center justify-center gap-2 rounded-full py-2 ${side === s ? 'bg-white' : ''}`}>
              <TeamBadge name={t.teamName} logoUrl={t.logoUrl} size={22} />
              <span className={`truncate text-[13px] font-semibold ${side === s ? 'text-black' : 'text-white/60'}`}>{t.shortName || t.teamName}</span>
            </button>
          ))}
        </div>
      </div>
      <h3 className="px-4 pb-2 pt-1 text-center text-[15px] font-semibold text-white">Substitutes</h3>
      {bench.length === 0 ? (
        <p className="px-4 pb-5 text-center text-sm text-white/45">No substitutes named.</p>
      ) : (
        <ul className="px-4 pb-2">
          {bench.map((p) => {
            const on = cameOn(p)
            return (
              <li key={p.id} className="border-t border-white/[0.06] first:border-t-0">
                <button type="button" onClick={() => router.push(`/app/player/${p.id}`)} className="flex w-full items-center gap-3 py-3 text-left">
                  <Avatar photoUrl={p.photoUrl} size={40} />
                  <span className="w-6 shrink-0 text-right text-[14px] tabular-nums text-white/45">{p.jerseyNumber}</span>
                  <span className="min-w-0 flex-1 truncate text-[15px] text-white">{(p as any).fullName || p.name}</span>
                  {on && <span className="shrink-0 text-[12px] font-semibold text-[#22c55e]">↑ {on.minute}&apos;</span>}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export function LineupBoard({ home, away, events: rawEvents = [], isLive = false }: { home: TeamLineupData; away: TeamLineupData; events?: any[]; isLive?: boolean }) {
  // The match feed calls every booking "card"; name the colour so ratings count it
  const events = rawEvents.map((e: any) => {
    if (String(e.type) !== 'card' || e.rawType) return e
    const text = String(e.commentaryText || e.description || e.text || '').toLowerCase()
    return { ...e, rawType: /red card|second yellow|sent off/.test(text) ? 'red_card' : 'yellow_card' }
  })
  const router = useRouter()
  const started = events.length > 0 || isLive
  const ratingOf = (p: LineupPlayer): number | null => {
    if (p.rating != null && !Number.isNaN(p.rating)) return p.rating
    return started ? calculatePlayerRating(p.position || 'MID', eventsForPlayer(p.id, events)) : null
  }
  const homeRows = rowsOf(home)
  const awayRows = rowsOf(away).reverse() // attack nearest the halfway line, goalkeeper at the bottom
  const hasAny = home.starters.length > 0 || away.starters.length > 0
  const rowH = 92

  const Row = ({ players }: { players: LineupPlayer[] }) => (
    <div className="flex items-start justify-evenly px-1" style={{ height: rowH }}>
      {players.map((p) => (
        <PlayerSpot key={p.id} player={p as any} rating={ratingOf(p)} marks={marksFor(p, events)} onOpen={() => router.push(`/app/player/${p.id}`)} />
      ))}
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      <section className="overflow-hidden rounded-2xl bg-[#1c1e26]">
        <TeamBar team={home} />
        {hasAny ? (
          <div className="relative mx-3 overflow-hidden rounded-xl bg-[#15171e]">
            <PitchLines />
            <CentreCircle />
            <div className="relative pt-4">
              {home.starters.length ? homeRows.map((r, i) => <Row key={`h${i}`} players={r} />) : <EmptyHalf name={home.teamName} isLive={isLive} />}
            </div>
            <div className="relative pb-2">
              {away.starters.length ? awayRows.map((r, i) => <Row key={`a${i}`} players={r} />) : <EmptyHalf name={away.teamName} isLive={isLive} />}
            </div>
          </div>
        ) : (
          <p className="px-4 pb-6 pt-2 text-center text-sm text-white/50">Lineups appear here once the teams are confirmed.</p>
        )}
        <TeamBar team={away} />
      </section>
      <SubstitutesCard home={home} away={away} events={events} />
    </div>
  )
}

function EmptyHalf({ name, isLive }: { name: string; isLive: boolean }) {
  return (
    <div className="flex items-center justify-center px-6 text-center text-sm text-white/45" style={{ height: 184 }}>
      {isLive ? `${name}'s lineup hasn't been confirmed yet.` : `${name} hasn't announced a lineup yet.`}
    </div>
  )
}
