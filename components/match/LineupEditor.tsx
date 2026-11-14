'use client'

/**
 * Pick one team's starting lineup on a pitch: choose a formation, tap a spot to put a player there, tap a player to
 * swap, move or take them off. Everyone not on the pitch is a substitute. Uses the same formation rules as the
 * organiser's lineup screen (lib/lineupFormation), so a lineup looks the same wherever it is opened.
 */
import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { Avatar, PitchMarkings } from '@/components/match/PitchKit'
import {
  ZONES, ZONE_LABEL, applyFormation, formationString, growZone, moveSlot, parseFormation, shrinkZone, suggestedFormations, zoneOfSlot,
  type Zone, type Zones,
} from '@/lib/lineupFormation'

export interface EditorPlayer {
  id: string
  name: string
  fullName?: string
  position: string | null
  jerseyNumber: number | null
  photoUrl: string | null
}

/** Spot index → player id. Spot 0 is the goalkeeper, then defence, midfield and attack, left to right. */
export type SpotMap = Record<number, string>

const POS_ZONE: Record<string, Zone | 'GK'> = { GK: 'GK', GOA: 'GK', DEF: 'DEF', MID: 'MID', FWD: 'FWD', FOR: 'FWD', ATT: 'FWD', STR: 'FWD' }
const zoneOfPosition = (pos: string | null): Zone | 'GK' | null => POS_ZONE[(pos ?? '').toUpperCase().slice(0, 3)] ?? null
const ROW_LABEL: Record<Zone | 'GK', string> = { GK: 'Goalkeeper', DEF: 'Defender', MID: 'Midfielder', FWD: 'Forward' }

/** "C. Azubuike" style label for a spot on the pitch. */
function pitchName(p: EditorPlayer) {
  const full = (p.fullName || '').trim()
  const parts = full.split(/\s+/)
  if (p.name && p.name !== full) return p.name // a nickname
  return parts.length >= 2 ? `${parts[0][0]}. ${parts.slice(1).join(' ')}` : p.name || full || 'Player'
}

/** Builds the starting spots from what was saved: exact spots if we have them, otherwise by each player's position. */
export function initialSpots(opts: { starters: string[]; slots?: { playerId: string; positionIndex: number }[]; zones: Zones; squad: EditorPlayer[]; playersPerSide: number }): SpotMap {
  const { starters, slots, zones, squad, playersPerSide } = opts
  const spots: SpotMap = {}
  if (slots?.length) {
    for (const s of slots) if (s.positionIndex < playersPerSide && !Object.values(spots).includes(s.playerId)) spots[s.positionIndex] = s.playerId
    return spots
  }
  const byId = new Map(squad.map((p) => [p.id, p]))
  const free = (zone: Zone | 'GK') => {
    if (zone === 'GK') return spots[0] ? [] : [0]
    let start = 1
    for (const z of ZONES) { if (z === zone) break; start += zones[z] }
    return Array.from({ length: zones[zone] }, (_, i) => start + i).filter((i) => !spots[i])
  }
  const leftovers: string[] = []
  for (const id of starters) {
    const z = zoneOfPosition(byId.get(id)?.position ?? null)
    const spot = z ? free(z)[0] : undefined
    if (spot != null) spots[spot] = id
    else leftovers.push(id)
  }
  for (const id of leftovers) {
    const spot = Array.from({ length: playersPerSide }, (_, i) => i).find((i) => !spots[i])
    if (spot != null) spots[spot] = id
  }
  return spots
}

type Sheet =
  | { kind: 'formation' }
  | { kind: 'pick'; spot: number; swapFrom?: number }
  | { kind: 'player'; spot: number }
  | null

export function LineupEditor({
  squad, playersPerSide, formation, spots, onChange, locked = false,
}: {
  squad: EditorPlayer[]
  playersPerSide: number
  formation: string
  spots: SpotMap
  onChange: (next: { formation: string; spots: SpotMap }) => void
  locked?: boolean
}) {
  const [sheet, setSheet] = useState<Sheet>(null)
  const zones = parseFormation(formation, playersPerSide)
  const byId = useMemo(() => new Map(squad.map((p) => [p.id, p])), [squad])

  // The shared formation helpers work on spot → anything; feed them ids and read ids back
  const apply = (r: { lineup: Record<number, any>; zones: Zones }) => {
    const next: SpotMap = {}
    for (const [k, v] of Object.entries(r.lineup)) if (v) next[Number(k)] = String(v)
    onChange({ formation: formationString(r.zones), spots: next })
  }
  const setSpot = (spot: number, playerId: string | null) => {
    const next: SpotMap = { ...spots }
    for (const [k, v] of Object.entries(next)) if (v === playerId) delete next[Number(k)]
    if (playerId) next[spot] = playerId
    else delete next[spot]
    onChange({ formation, spots: next })
  }
  const swap = (a: number, b: number) => {
    const next: SpotMap = { ...spots }
    const pa = next[a], pb = next[b]
    if (pb) next[a] = pb; else delete next[a]
    if (pa) next[b] = pa; else delete next[b]
    onChange({ formation, spots: next })
  }

  // Rows from the attack down to the goalkeeper, each a list of spot indexes
  const rows: { zone: Zone | 'GK'; spots: number[] }[] = []
  let idx = 1
  const zoneSpots: Record<Zone, number[]> = { DEF: [], MID: [], FWD: [] }
  for (const z of ZONES) for (let i = 0; i < zones[z]; i++) zoneSpots[z].push(idx++)
  for (const z of [...ZONES].reverse()) if (zoneSpots[z].length) rows.push({ zone: z, spots: zoneSpots[z] })
  rows.push({ zone: 'GK', spots: [0] })

  const placed = new Set(Object.values(spots))
  const bench = squad.filter((p) => !placed.has(p.id))
  const zoneAt = (spot: number): Zone | 'GK' => zoneOfSlot(zones, spot) ?? 'GK'

  return (
    <div>
      {/* Formation */}
      <div className="mb-3 flex items-center justify-between">
        <span className="font-body text-[14px] text-white/60">Formation</span>
        <button
          type="button"
          disabled={locked}
          onClick={() => setSheet({ kind: 'formation' })}
          className="flex h-10 items-center gap-2 rounded-full bg-white/[0.08] px-4 font-body text-[16px] font-semibold tabular-nums text-white disabled:opacity-50"
        >
          {formationString(zones)}
          {!locked && <span className="text-[12px] text-white/50">Change</span>}
        </button>
      </div>

      {/* Pitch: attack at the top, goalkeeper at the bottom */}
      <div className="relative bg-[#15171e]">
        <PitchMarkings half />
        <div className="relative py-4">
          {rows.map((row) => (
            <div key={row.zone} className="flex h-[96px] items-start justify-evenly">
              {row.spots.map((spot) => {
                const p = spots[spot] ? byId.get(spots[spot]) : undefined
                return (
                  <button
                    key={spot}
                    type="button"
                    disabled={locked}
                    onClick={() => setSheet(p ? { kind: 'player', spot } : { kind: 'pick', spot })}
                    className="flex min-w-0 max-w-[96px] flex-1 flex-col items-center px-0.5"
                    aria-label={p ? `${p.fullName || p.name}, ${ROW_LABEL[row.zone]}` : `Empty ${ROW_LABEL[row.zone].toLowerCase()} spot`}
                  >
                    {p ? (
                      <Avatar photoUrl={p.photoUrl || undefined} size={40} />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-white/35 font-body text-[20px] leading-none text-white/60">+</span>
                    )}
                    <span className="mt-[6px] flex max-w-full items-baseline gap-[3px] font-body text-[12px] font-medium leading-[15px]">
                      {p ? (
                        <>
                          {p.jerseyNumber != null && <span className="shrink-0 tabular-nums text-white/55">{p.jerseyNumber}</span>}
                          <span className="truncate text-white">{pitchName(p)}</span>
                        </>
                      ) : (
                        <span className="text-white/45">{row.zone === 'GK' ? 'GK' : row.zone === 'DEF' ? 'DEF' : row.zone === 'MID' ? 'MID' : 'FWD'}</span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Substitutes: everyone not on the pitch */}
      <section className="mt-4 overflow-hidden rounded-2xl bg-[#1B1D25]">
        <h3 className="px-4 pb-1 pt-3.5 font-body text-[15px] font-semibold text-white">
          Substitutes <span className="font-normal text-white/45">{bench.length}</span>
        </h3>
        {bench.length === 0 ? (
          <p className="px-4 pb-4 font-body text-[13px] text-white/50">Everyone in the squad is on the pitch.</p>
        ) : (
          <ul className="pb-1">
            {bench.map((p) => (
              <li key={p.id} className="flex items-center gap-3 border-t border-white/[0.06] px-4 py-2.5 first:border-t-0">
                <Avatar photoUrl={p.photoUrl || undefined} size={32} />
                <span className="w-6 shrink-0 text-right font-body text-[13px] tabular-nums text-white/50">{p.jerseyNumber ?? ''}</span>
                <span className="min-w-0 flex-1 truncate font-body text-[14px] font-medium text-white">{p.fullName || p.name}</span>
                {p.position && <span className="shrink-0 font-body text-[12px] text-white/45">{ROW_LABEL[zoneOfPosition(p.position) ?? 'MID']}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Sheets */}
      {sheet && !locked && (
        <div className="fixed inset-0 z-[200] flex items-end bg-black/60" onClick={() => setSheet(null)}>
          <div
            className="max-h-[78vh] w-full overflow-y-auto rounded-t-3xl bg-[#1B1D25] pb-[calc(16px+env(safe-area-inset-bottom,0px))]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="sticky top-0 flex items-center justify-between bg-[#1B1D25] px-4 pb-2 pt-4">
              <h3 className="font-body text-[17px] font-semibold text-white">
                {sheet.kind === 'formation' ? 'Formation' : sheet.kind === 'player' ? (byId.get(spots[sheet.spot])?.fullName || byId.get(spots[sheet.spot])?.name) : sheet.swapFrom != null ? 'Swap with' : `Pick a ${ROW_LABEL[zoneAt(sheet.spot)].toLowerCase()}`}
              </h3>
              <button onClick={() => setSheet(null)} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-white"><X size={18} /></button>
            </div>

            {sheet.kind === 'formation' && (
              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-2">
                  {suggestedFormations(playersPerSide).map((f) => (
                    <button
                      key={f}
                      onClick={() => { apply(applyFormation(spots, zones, parseFormation(f, playersPerSide))); setSheet(null) }}
                      className={`h-11 rounded-full px-4 font-body text-[15px] font-semibold tabular-nums ${f === formationString(zones) ? 'bg-white text-black' : 'bg-white/[0.08] text-white'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <p className="mb-2 mt-5 font-body text-[13px] text-white/55">Or set each line yourself</p>
                {ZONES.map((z) => (
                  <div key={z} className="flex items-center justify-between border-t border-white/[0.06] py-2.5">
                    <span className="font-body text-[15px] text-white">{ZONE_LABEL[z]}</span>
                    <span className="flex items-center gap-3">
                      <button aria-label={`Fewer in ${ZONE_LABEL[z]}`} disabled={zones[z] <= 0} onClick={() => apply(shrinkZone(spots, zones, z))} className="h-9 w-9 rounded-full bg-white/[0.08] font-body text-[18px] text-white disabled:opacity-30">−</button>
                      <span className="w-5 text-center font-body text-[16px] font-semibold tabular-nums text-white">{zones[z]}</span>
                      <button aria-label={`More in ${ZONE_LABEL[z]}`} onClick={() => apply(growZone(spots, zones, z))} className="h-9 w-9 rounded-full bg-white/[0.08] font-body text-[18px] text-white">+</button>
                    </span>
                  </div>
                ))}
              </div>
            )}

            {sheet.kind === 'player' && (
              <div className="px-4 pb-2">
                <button onClick={() => setSheet({ kind: 'pick', spot: sheet.spot, swapFrom: sheet.spot })} className="flex h-12 w-full items-center border-t border-white/[0.06] font-body text-[15px] text-white">Swap with another player</button>
                {zoneAt(sheet.spot) !== 'GK' && ZONES.filter((z) => z !== zoneAt(sheet.spot)).map((z) => (
                  <button key={z} onClick={() => { apply(moveSlot(spots, zones, sheet.spot, z)); setSheet(null) }} className="flex h-12 w-full items-center border-t border-white/[0.06] font-body text-[15px] text-white">
                    Move to {ZONE_LABEL[z].toLowerCase()}
                  </button>
                ))}
                <button onClick={() => { setSpot(sheet.spot, null); setSheet(null) }} className="flex h-12 w-full items-center border-t border-white/[0.06] font-body text-[15px] text-[#ef4444]">Take off the pitch</button>
              </div>
            )}

            {sheet.kind === 'pick' && (() => {
              const want = zoneAt(sheet.spot)
              // Swapping offers everyone else; filling an empty spot offers the bench. Players of the right position first.
              const candidates = squad
                .filter((p) => (sheet.swapFrom != null ? p.id !== spots[sheet.swapFrom] : !placed.has(p.id)))
                .sort((a, b) => Number(zoneOfPosition(b.position) === want) - Number(zoneOfPosition(a.position) === want) || (a.jerseyNumber ?? 99) - (b.jerseyNumber ?? 99))
              if (!candidates.length) return <p className="px-4 pb-4 font-body text-[14px] text-white/55">No one else is available.</p>
              return (
                <ul className="pb-2">
                  {candidates.map((p) => {
                    const onPitchAt = Object.entries(spots).find(([, v]) => v === p.id)?.[0]
                    return (
                      <li key={p.id}>
                        <button
                          onClick={() => {
                            if (sheet.swapFrom != null) {
                              if (onPitchAt != null) swap(sheet.swapFrom, Number(onPitchAt))
                              else setSpot(sheet.swapFrom, p.id)
                            } else setSpot(sheet.spot, p.id)
                            setSheet(null)
                          }}
                          className="flex w-full items-center gap-3 border-t border-white/[0.06] px-4 py-2.5 text-left"
                        >
                          <Avatar photoUrl={p.photoUrl || undefined} size={36} />
                          <span className="w-6 shrink-0 text-right font-body text-[13px] tabular-nums text-white/50">{p.jerseyNumber ?? ''}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-body text-[15px] font-medium text-white">{p.fullName || p.name}</span>
                            <span className="block font-body text-[12px] text-white/45">
                              {p.position ? ROW_LABEL[zoneOfPosition(p.position) ?? 'MID'] : 'No position'}{onPitchAt != null ? ' · on the pitch' : ''}
                            </span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

/** Shirt numbers worn by more than one player in the squad, e.g. [{ number: 9, names: ['K. Cyril', 'O. Jesutamilore'] }]. */
export function duplicateNumbers(squad: { name: string; fullName?: string; jerseyNumber: number | null }[]) {
  const by = new Map<number, string[]>()
  for (const p of squad) {
    if (p.jerseyNumber == null) continue
    by.set(p.jerseyNumber, [...(by.get(p.jerseyNumber) ?? []), p.fullName || p.name])
  }
  return Array.from(by.entries()).filter(([, names]) => names.length > 1).map(([number, names]) => ({ number, names }))
}
