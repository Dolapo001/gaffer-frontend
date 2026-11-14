'use client'

/**
 * The match lineups, laid out like the best score apps: one full-width pitch with both teams (home from the top,
 * away from the bottom), small round photos with the rating sitting on the photo's lower edge, "10 C. Azubuike"
 * labels, tiny event marks, then the substitutes for either team.
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getImageUrl } from '@/lib/api'
import { calculatePlayerRating, eventsForPlayer } from '@/lib/ratingsEngine'
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

/** Rating colours, in bands: blue for 8+, green 7+, gold 6.5+, orange 6+, red below. */
export function ratingColour(r: number) {
  if (r >= 8) return '#1E8EF5'
  if (r >= 7) return '#16A34A'
  if (r >= 6.5) return '#C99A06'
  if (r >= 6) return '#E8730C'
  return '#DC2626'
}

function Silhouette() {
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden>
      <rect width="40" height="40" fill="#D5D8DE" />
      <circle cx="20" cy="15.5" r="6.5" fill="#A7ACB5" />
      <path d="M7 40c1.4-8 6.9-12.4 13-12.4S31.6 32 33 40z" fill="#A7ACB5" />
    </svg>
  )
}

function Avatar({ photoUrl, size, dim = false }: { photoUrl?: string; size: number; dim?: boolean }) {
  return (
    <span className={`block overflow-hidden rounded-full bg-white ring-1 ring-white/20 ${dim ? 'opacity-60' : ''}`} style={{ width: size, height: size }}>
      {photoUrl ? <img src={getImageUrl(photoUrl)} alt="" className="h-full w-full object-cover object-top" /> : <Silhouette />}
    </span>
  )
}

interface Marks { goals: number; yellow: boolean; red: boolean; subOut?: number | null }

function marksFor(player: LineupPlayer, events: any[]): Marks {
  const mine = eventsForPlayer(player.id, events)
  const t = (e: any) => String(e.rawType || e.type || '').toLowerCase()
  const subOut = events.find((e: any) => ['sub', 'substitution'].includes(t(e)) && idOf(e.playerOutId) === String(player.id))
  return {
    goals: mine.filter((e) => ['goal', 'penalty_scored'].includes(t(e))).length,
    yellow: !!player.hasYellowCard,
    red: !!player.hasRedCard,
    subOut: subOut ? subOut.minute ?? null : null,
  }
}

const DISC = 'flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.25)]'

/** Small white discs on the top-left of the photo: substituted, booked, scored. */
function MarkIcons({ m }: { m: Marks }) {
  return (
    <span className="absolute -left-[8px] -top-[3px] flex flex-col gap-[2px]">
      {m.subOut != null && (
        <span className={DISC} title={`Substituted ${m.subOut}'`}>
          <svg viewBox="0 0 12 12" className="h-[10px] w-[10px]" aria-hidden>
            <path d="M3.5 2v6.5M1.5 6.5l2 2 2-2" fill="none" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8.5 10V3.5M6.5 5.5l2-2 2 2" fill="none" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
      {(m.red || m.yellow) && (
        <span className={DISC} title={m.red ? 'Red card' : 'Yellow card'}>
          <span className="h-[9px] w-[6.5px] rounded-[1px]" style={{ background: m.red ? '#DC2626' : '#FACC15' }} />
        </span>
      )}
      {m.goals > 0 && (
        <span className={`${DISC} ${m.goals > 1 ? 'px-[2px]' : ''}`} title={`${m.goals} goal${m.goals > 1 ? 's' : ''}`}>
          <svg viewBox="0 0 12 12" className="h-[11px] w-[11px]" aria-hidden>
            <circle cx="6" cy="6" r="5.3" fill="#fff" stroke="#111" strokeWidth="0.9" />
            <path d="M6 3.9l2 1.45-.76 2.35H4.76L4 5.35z" fill="#111" />
            <path d="M6 3.9V.8M8 5.35l2.9-.95M7.24 7.7l1.8 2.5M4.76 7.7l-1.8 2.5M4 5.35l-2.9-.95" stroke="#111" strokeWidth="0.9" />
            <path d="M4.6.85L6 .7l1.4.15L6 1.6zM11.1 4.3l.3 1.5-.6 1.2-.4-1.6zM9.6 10.3l-1.3.75-1.3-.2 1.2-1zM2.4 10.3l1.3.75 1.3-.2-1.2-1zM.9 4.3l-.3 1.5.6 1.2.4-1.6z" fill="#111" />
          </svg>
          {m.goals > 1 && <span className="ml-[1px] font-body text-[9px] font-bold leading-none text-black">{m.goals}</span>}
        </span>
      )}
    </span>
  )
}

function PlayerSpot({ player, rating, marks, best, onOpen }: { player: LineupPlayer; rating: number | null; marks: Marks; best: boolean; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="flex min-w-0 max-w-[96px] flex-1 flex-col items-center px-0.5 focus:outline-none">
      <span className="relative">
        <Avatar photoUrl={player.photoUrl} size={40} dim={marks.red} />
        <MarkIcons m={marks} />
        {rating != null && (
          <span className="absolute left-1/2 top-[29px] -translate-x-1/2">
            {best && (
              <span className="absolute right-full top-1/2 mr-[3px] flex h-[15px] w-[15px] -translate-y-1/2 items-center justify-center rounded-full bg-[#16A34A]" title="Top rated">
                <svg viewBox="0 0 10 10" className="h-[9px] w-[9px]" aria-hidden>
                  <path d="M5 .8l1.25 2.6 2.85.38-2.08 1.98.52 2.83L5 7.22 2.46 8.6l.52-2.83L.9 3.78l2.85-.38z" fill="#fff" />
                </svg>
              </span>
            )}
            <span
              className="flex h-[16px] min-w-[27px] items-center justify-center rounded-[3px] px-[3px] font-body text-[11.5px] font-bold leading-none tabular-nums text-white"
              style={{ background: ratingColour(rating) }}
            >
              {rating.toFixed(1)}
            </span>
          </span>
        )}
      </span>
      <span className={`flex max-w-full items-baseline gap-[3px] font-body text-[12px] font-medium leading-[15px] tracking-[-0.01em] ${rating != null ? 'mt-[10px]' : 'mt-[5px]'}`}>
        <span className="shrink-0 tabular-nums text-white/55">{player.jerseyNumber}</span>
        <span className="truncate text-white">{player.isCaptain ? '(c) ' : ''}{shortPlayerName(player)}</span>
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

function TeamStrip({ team }: { team: TeamLineupData }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-3">
      <TeamBadge name={team.teamName} logoUrl={team.logoUrl} size={24} />
      <span className="min-w-0 flex-1 truncate font-body text-[15px] font-semibold text-white">{team.teamName}</span>
      <span className="font-body text-[14px] font-medium tabular-nums text-white/60">{team.formation}</span>
    </div>
  )
}

const LINE = 'rgba(255,255,255,0.16)'

/** One penalty area: the box, the six-yard box and the D. Drawn in pixels so the arcs stay round. */
function Area({ end }: { end: 'top' | 'bottom' }) {
  const open = end === 'top' ? { borderTop: 'none' } : { borderBottom: 'none' }
  return (
    <>
      <span className="absolute left-1/2 w-[42%] -translate-x-1/2" style={{ [end]: 0, height: 64, border: `1px solid ${LINE}`, ...open }} />
      <span className="absolute left-1/2 w-[18%] -translate-x-1/2" style={{ [end]: 0, height: 22, border: `1px solid ${LINE}`, ...open }} />
      <span className="absolute left-1/2 h-[12px] w-[60px] -translate-x-1/2 overflow-hidden" style={{ [end]: 65 }}>
        <span className="absolute left-0 h-[60px] w-[60px] rounded-full" style={{ [end]: -48, border: `1px solid ${LINE}` }} />
      </span>
    </>
  )
}

function Corner({ v, h }: { v: 'top' | 'bottom'; h: 'left' | 'right' }) {
  return (
    <span className="absolute h-[12px] w-[12px] overflow-hidden" style={{ [v]: 0, [h]: 0 }}>
      <span className="absolute h-[24px] w-[24px] rounded-full" style={{ [v]: -12, [h]: -12, border: `1px solid ${LINE}` }} />
    </span>
  )
}

function PitchMarkings() {
  return (
    <span className="pointer-events-none absolute inset-0" aria-hidden style={{ border: `1px solid ${LINE}` }}>
      <Area end="top" />
      <Area end="bottom" />
      <span className="absolute inset-x-0 top-1/2 h-px" style={{ background: LINE }} />
      <span className="absolute left-1/2 top-1/2 h-[96px] w-[96px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ border: `1px solid ${LINE}` }} />
      <Corner v="top" h="left" />
      <Corner v="top" h="right" />
      <Corner v="bottom" h="left" />
      <Corner v="bottom" h="right" />
    </span>
  )
}

function SubstitutesCard({ home, away, events }: { home: TeamLineupData; away: TeamLineupData; events: any[] }) {
  const [side, setSide] = useState<Side>('home')
  const team = side === 'home' ? home : away
  const router = useRouter()
  const cameOn = (p: LineupPlayer) => events.find((e: any) => ['sub', 'substitution'].includes(String(e.type || e.rawType).toLowerCase()) && idOf(e.playerInId || e.relatedPlayerId) === String(p.id))
  const bench = team.bench || []
  return (
    <section className="rounded-2xl bg-[#1B1D25]">
      <div className="p-3">
        <div className="grid grid-cols-2 rounded-full bg-black/30 p-1" role="tablist" aria-label="Team">
          {([['home', home], ['away', away]] as const).map(([s, t]) => (
            <button key={s} role="tab" aria-selected={side === s} onClick={() => setSide(s)} className={`flex items-center justify-center gap-2 rounded-full py-2 ${side === s ? 'bg-white' : ''}`}>
              <TeamBadge name={t.teamName} logoUrl={t.logoUrl} size={22} />
              <span className={`truncate font-body text-[14px] font-semibold ${side === s ? 'text-black' : 'text-white/60'}`}>{t.shortName || t.teamName}</span>
            </button>
          ))}
        </div>
      </div>
      <h3 className="px-4 pb-1 pt-1 text-center font-body text-[15px] font-semibold text-white">Substitutes</h3>
      {bench.length === 0 ? (
        <p className="px-4 pb-5 text-center font-body text-sm text-white/45">No substitutes named.</p>
      ) : (
        <ul className="px-4 pb-1">
          {bench.map((p) => {
            const on = cameOn(p)
            return (
              <li key={p.id} className="border-t border-white/[0.06] first:border-t-0">
                <button type="button" onClick={() => router.push(`/app/player/${p.id}`)} className="flex w-full items-center gap-3 py-2.5 text-left">
                  <Avatar photoUrl={p.photoUrl} size={36} />
                  <span className="w-6 shrink-0 text-right font-body text-[14px] tabular-nums text-white/50">{p.jerseyNumber}</span>
                  <span className="min-w-0 flex-1 truncate font-body text-[15px] font-medium text-white">{p.fullName || p.name}</span>
                  {on && <span className="shrink-0 font-body text-[13px] font-semibold text-[#16A34A]">↑ {on.minute}&apos;</span>}
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
  // The match feed calls every booking "card"; name the colour so the marks and ratings see it
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
  const ratings = new Map<string, number | null>()
  ;[...home.starters, ...away.starters].forEach((p) => ratings.set(String(p.id), ratingOf(p)))
  // The star goes to the single highest-rated starter (none on a tie)
  const entries = Array.from(ratings.entries())
  const values = entries.map(([, r]) => r).filter((r): r is number => r != null)
  const top = values.length ? Math.max(...values) : null
  const bestId = top != null && values.filter((r) => r === top).length === 1 ? entries.find(([, r]) => r === top)?.[0] : undefined

  const homeRows = rowsOf(home)
  const awayRows = rowsOf(away).reverse() // attack nearest the halfway line, goalkeeper at the bottom
  const hasAny = home.starters.length > 0 || away.starters.length > 0

  const Row = ({ players }: { players: LineupPlayer[] }) => (
    <div className="flex h-[104px] items-start justify-evenly">
      {players.map((p) => (
        <PlayerSpot
          key={p.id}
          player={p}
          rating={ratings.get(String(p.id)) ?? null}
          marks={marksFor(p, events)}
          best={bestId === String(p.id)}
          onOpen={() => router.push(`/app/player/${p.id}`)}
        />
      ))}
    </div>
  )

  return (
    <div className="-mx-3 flex flex-col">
      <TeamStrip team={home} />
      {hasAny ? (
        <div className="relative mx-2 bg-[#1B1D25]">
          <PitchMarkings />
          <div className="relative pt-3">
            {home.starters.length ? homeRows.map((r, i) => <Row key={`h${i}`} players={r} />) : <EmptyHalf name={home.teamName} isLive={isLive} />}
          </div>
          <div className="relative">
            {away.starters.length ? awayRows.map((r, i) => <Row key={`a${i}`} players={r} />) : <EmptyHalf name={away.teamName} isLive={isLive} />}
          </div>
        </div>
      ) : (
        <p className="px-4 py-10 text-center font-body text-sm text-white/50">Lineups appear here once the teams are confirmed.</p>
      )}
      <TeamStrip team={away} />
      <div className="mx-3 mt-3">
        <SubstitutesCard home={home} away={away} events={events} />
      </div>
    </div>
  )
}

function EmptyHalf({ name, isLive }: { name: string; isLive: boolean }) {
  return (
    <div className="flex h-[208px] items-center justify-center px-6 text-center font-body text-sm text-white/45">
      {isLive ? `${name}'s lineup hasn't been confirmed yet.` : `${name} hasn't announced a lineup yet.`}
    </div>
  )
}
