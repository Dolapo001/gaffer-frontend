'use client'

import { Bell, BellOff } from 'lucide-react'

interface CompactFixtureRowProps {
  fixture: any
  onClick?: () => void
}

function TeamMini({ team }: { team: { name?: string; logoUrl?: string } }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
        {team.logoUrl ? (
          <img src={team.logoUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-white/40 text-[8px] font-black">{team.name?.charAt(0) ?? '?'}</span>
        )}
      </div>
      <span className="text-white text-[13px] font-semibold truncate">{team.name}</span>
    </div>
  )
}

// A slim, scannable fixture row — date/status, two stacked team rows, score,
// mute/notify toggle — for use inside round+group grouped lists.
export function CompactFixtureRow({ fixture, onClick }: CompactFixtureRowProps) {
  const home = fixture.homeTeamId && typeof fixture.homeTeamId === 'object' ? fixture.homeTeamId : { name: 'Home' }
  const away = fixture.awayTeamId && typeof fixture.awayTeamId === 'object' ? fixture.awayTeamId : { name: 'Away' }
  const kickoff = fixture.kickoffAt ? new Date(fixture.kickoffAt) : new Date()
  const dateLabel = kickoff.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
  const isFinished = fixture.status === 'completed'
  const isLive = fixture.status === 'live'
  const time = kickoff.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 bg-gaffer-surface border border-gaffer-border rounded-xl px-3 py-2.5 text-left hover:border-gaffer-orange/30 transition-colors"
    >
      <div className="w-11 flex-shrink-0 flex flex-col items-start gap-0.5">
        <span className="text-gaffer-muted text-[9px] font-black">{dateLabel}</span>
        <span className={`text-[9px] font-black uppercase ${isLive ? 'text-gaffer-orange' : 'text-gaffer-muted'}`}>
          {isFinished ? 'FT' : isLive ? 'LIVE' : time}
        </span>
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <TeamMini team={home} />
        <TeamMini team={away} />
      </div>

      <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
        <span className="text-white text-[13px] font-black">{isFinished || isLive ? fixture.score?.home ?? 0 : ''}</span>
        <span className="text-white text-[13px] font-black">{isFinished || isLive ? fixture.score?.away ?? 0 : ''}</span>
      </div>

      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-gaffer-muted">
        <BellOff size={12} />
      </div>
    </button>
  )
}
