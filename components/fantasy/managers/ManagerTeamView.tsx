'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getManagerTeam, type ManagerPlayer } from '@/lib/services/fantasy.service'
import { PlayerAvatar } from '@/components/fantasy/PlayerAvatar'
import { asArray } from '@/lib/asArray'

const ROWS: Array<{ pos: string; label: string }> = [
  { pos: 'GK', label: 'Goalkeeper' },
  { pos: 'DEF', label: 'Defence' },
  { pos: 'MID', label: 'Midfield' },
  { pos: 'FWD', label: 'Attack' },
]

function PlayerChip({ p, showPoints }: { p: ManagerPlayer; showPoints: boolean }) {
  return (
    <li className="flex flex-col items-center w-[72px] text-center">
      <div className="relative">
        <PlayerAvatar name={p.name} photoUrl={p.photoUrl ?? undefined} teamCode={p.club?.shortName} teamLogoUrl={p.club?.logoUrl} size={44} />
        {(p.isCaptain || p.isViceCaptain) && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black text-white text-[9px] font-black flex items-center justify-center border border-white/30">
            {p.isCaptain ? 'C' : 'V'}
          </span>
        )}
      </div>
      <span className="text-[10px] text-white font-bold mt-1 leading-tight truncate w-full">{p.name.split(' ').slice(-1)[0]}</span>
      {showPoints && (
        <span className="text-[10px] text-gaffer-orange font-black">
          {p.points}
          {(p.multiplier ?? 1) > 1 && <span className="ml-0.5 text-white/60 font-bold">x{p.multiplier}</span>}
        </span>
      )}
    </li>
  )
}

/**
 * One manager's team: who they picked, and how each gameweek went. Other managers' squads appear once a gameweek's
 * deadline has passed; the manager and organisers always see the current squad.
 */
export function ManagerTeamView({ competitionId, teamId }: { competitionId: string; teamId: string }) {
  const [gameweekId, setGameweekId] = useState<string | null>(null)
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['fantasy-manager', competitionId, teamId, gameweekId],
    queryFn: () => getManagerTeam(competitionId, teamId, gameweekId),
  })

  if (isLoading) return <div className="h-48 rounded-2xl bg-white/5 animate-pulse" />
  if (isError || !data) return <p className="text-sm text-red-300">{(error as Error)?.message ?? 'Could not load this manager.'}</p>

  const { team, squad, history, gameweeks, squadHidden, isAdmin } = data
  const picked = gameweekId ?? squad?.gameweek?.id ?? null

  return (
    <div className="space-y-5">
      <header className="rounded-2xl bg-[#1E2032] border border-white/5 p-4">
        <p className="text-[11px] uppercase tracking-widest text-white/40">{team.isMine ? 'Your team' : 'Manager'}</p>
        <h2 className="text-xl font-display font-black text-white mt-1">{team.teamName}</h2>
        <p className="text-sm text-white/50">{team.manager.name}</p>
        <div className="flex gap-6 mt-3">
          <div><p className="text-2xl font-display font-black text-white">{team.rank ? `#${team.rank}` : '-'}</p><p className="text-[10px] uppercase tracking-widest text-white/40">Rank</p></div>
          <div><p className="text-2xl font-display font-black text-white">{team.totalPoints}</p><p className="text-[10px] uppercase tracking-widest text-white/40">Points</p></div>
          <div><p className="text-2xl font-display font-black text-white">{team.lastGwPoints}</p><p className="text-[10px] uppercase tracking-widest text-white/40">Last gameweek</p></div>
        </div>
      </header>

      {asArray(gameweeks).length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
          {isAdmin || team.isMine ? (
            <button onClick={() => setGameweekId(null)} className={`shrink-0 px-3 h-9 rounded-full text-xs font-bold border ${gameweekId === null ? 'bg-gaffer-orange text-white border-gaffer-orange' : 'bg-white/5 text-white/60 border-white/10'}`}>Now</button>
          ) : null}
          {gameweeks.map((g) => (
            <button key={g.id} onClick={() => setGameweekId(g.id)} className={`shrink-0 px-3 h-9 rounded-full text-xs font-bold border ${picked === g.id && gameweekId !== null ? 'bg-gaffer-orange text-white border-gaffer-orange' : 'bg-white/5 text-white/60 border-white/10'}`}>{g.name}</button>
          ))}
        </div>
      )}

      {squad ? (
        <section className="rounded-2xl bg-[#14301c] border border-white/10 p-4 space-y-4">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>{squad.live ? 'Current team' : squad.gameweek?.name ?? 'Team'}</span>
            <span>{squad.formation}</span>
          </div>
          {ROWS.map(({ pos, label }) => {
            const row = squad.startingXI.filter((p) => p.position === pos)
            if (!row.length) return null
            return (
              <div key={pos}>
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">{label}</p>
                <ul className="flex flex-wrap justify-center gap-x-3 gap-y-3">{row.map((p) => <PlayerChip key={p.id} p={p} showPoints={!squad.live} />)}</ul>
              </div>
            )
          })}
          {squad.bench.length > 0 && (
            <div className="pt-3 border-t border-white/10">
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Bench</p>
              <ul className="flex flex-wrap justify-center gap-x-3 gap-y-3">{squad.bench.map((p) => <PlayerChip key={p.id} p={p} showPoints={!squad.live} />)}</ul>
            </div>
          )}
        </section>
      ) : (
        <p className="rounded-2xl bg-white/5 border border-white/10 p-4 text-sm text-white/60">{squadHidden ?? 'No team to show yet.'}</p>
      )}

      <section className="space-y-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-white/50">History</h3>
        {history.length === 0 ? (
          <p className="text-sm text-white/40">No gameweeks scored yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {history.map((h) => (
              <li key={h.gameweekId}>
                <button onClick={() => setGameweekId(h.gameweekId)} className="w-full flex items-center justify-between rounded-xl bg-[#1a1b2e]/60 border border-white/5 px-3 py-2.5 text-left">
                  <span className="text-sm text-white font-bold">{h.name}
                    {h.benchBoost && <span className="ml-2 text-[9px] text-gaffer-orange font-black uppercase">Bench boost</span>}
                  </span>
                  <span className="text-sm text-white tabular-nums">
                    {h.points} <span className="text-[9px] text-white/40">pts</span>
                    {h.transferHit < 0 && <span className="ml-2 text-xs text-red-300">({h.transferHit} transfers)</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
