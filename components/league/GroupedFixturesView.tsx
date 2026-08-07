'use client'

import { useMemo, useState } from 'react'
import type { Fixture } from '@/lib/services/fixture.service'
import type { CompetitionTeam } from '@/lib/services/competition.service'
import { CompactFixtureRow } from '@/components/league/CompactFixtureRow'

type FilterMode = 'round' | 'date' | 'group' | 'team'

// Admin-assigned group names may already read "Group A" verbatim, or just
// "A" — never double-prefix, only add "Group " when it isn't already there.
function groupTitle(groupName: string) {
  if (groupName === 'Ungrouped') return 'Matches'
  return /^group\b/i.test(groupName) ? groupName : `Group ${groupName}`
}

function GroupedList({
  title,
  fixtures,
  onClick,
  renderRow,
}: {
  title: string
  fixtures: Fixture[]
  onClick: (id: string) => void
  renderRow: (fixture: Fixture, onClick: () => void) => React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-gaffer-muted text-[11px] font-black uppercase tracking-widest px-1">{title}</h3>
      {fixtures.map((f) => (
        <div key={f._id}>{renderRow(f, () => onClick(f._id))}</div>
      ))}
    </div>
  )
}

interface GroupedFixturesViewProps {
  fixtures?: Fixture[]
  compTeams?: CompetitionTeam[]
  isLoading?: boolean
  onFixtureClick: (fixtureId: string) => void
  /** Override the default compact row (e.g. to add admin actions like Go Live / delete). */
  renderRow?: (fixture: Fixture, onClick: () => void) => React.ReactNode
}

// Shared fixtures list: By round (Round → Group → matches, the real
// structure for a group tournament) / By date / By group / By team.
// Used by the League Matches tab, the Fantasy Fixtures tab, and the admin
// Schedule page (via the renderRow override for admin-only actions).
export function GroupedFixturesView({ fixtures, compTeams, isLoading, onFixtureClick, renderRow }: GroupedFixturesViewProps) {
  const row = renderRow ?? ((f: Fixture, onClick: () => void) => <CompactFixtureRow fixture={f} onClick={onClick} />)
  const [mode, setMode] = useState<FilterMode>('round')
  const [teamId, setTeamId] = useState<string | null>(null)

  const allFixtures = fixtures ?? []

  const byDate = useMemo(
    () => [...allFixtures].sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime()),
    [allFixtures],
  )

  const byRoundThenGroup = useMemo(() => {
    const rounds = new Map<string, { order: number; groups: Map<string, Fixture[]> }>()
    for (const f of allFixtures as any[]) {
      const roundName = f.roundId?.name || 'Other'
      const roundOrder = f.roundId?.order ?? 999
      const groupName = f.groupName || 'Ungrouped'
      if (!rounds.has(roundName)) rounds.set(roundName, { order: roundOrder, groups: new Map() })
      const round = rounds.get(roundName)!
      if (!round.groups.has(groupName)) round.groups.set(groupName, [])
      round.groups.get(groupName)!.push(f)
    }
    return Array.from(rounds.entries())
      .sort((a, b) => a[1].order - b[1].order)
      .map(([roundName, { groups }]) => ({
        roundName,
        groups: Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0])),
      }))
  }, [allFixtures])

  const byGroup = useMemo(() => {
    const groups: Record<string, Fixture[]> = {}
    for (const f of allFixtures as any[]) {
      const key = f.groupName || 'Ungrouped'
      if (!groups[key]) groups[key] = []
      groups[key].push(f)
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [allFixtures])

  const byTeam = useMemo(() => {
    if (!teamId) return []
    return allFixtures.filter((f: any) => f.homeTeamId?._id === teamId || f.awayTeamId?._id === teamId)
  }, [allFixtures, teamId])

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 rounded-full border-2 border-gaffer-orange border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex overflow-x-auto no-scrollbar gap-2 px-4 pt-4 pb-2">
        {(['round', 'date', 'group', 'team'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wide ${
              mode === m ? 'bg-gaffer-orange text-white' : 'bg-gaffer-card text-gaffer-muted border border-gaffer-border'
            }`}
          >
            By {m}
          </button>
        ))}
      </div>

      {mode === 'round' && (
        <div className="flex flex-col w-full px-4 py-4 gap-8">
          {byRoundThenGroup.length === 0 ? (
            <p className="text-center py-10 text-gaffer-muted text-xs uppercase tracking-widest">No fixtures found.</p>
          ) : (
            byRoundThenGroup.map(({ roundName, groups }) => (
              <div key={roundName} className="flex flex-col gap-4">
                <h2 className="text-white text-[15px] font-bold tracking-tight px-1">{roundName}</h2>
                {groups.map(([groupName, groupFixtures]) => (
                  <GroupedList key={groupName} title={groupTitle(groupName)} fixtures={groupFixtures} onClick={onFixtureClick} renderRow={row} />
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {mode === 'date' && (
        <div className="flex flex-col w-full px-4 py-4 gap-3">
          {byDate.length === 0 ? (
            <p className="text-center py-10 text-gaffer-muted text-xs uppercase tracking-widest">No fixtures found.</p>
          ) : (
            byDate.map((f) => <div key={f._id}>{row(f, () => onFixtureClick(f._id))}</div>)
          )}
        </div>
      )}

      {mode === 'group' && (
        <div className="flex flex-col w-full px-4 py-4 gap-6">
          {byGroup.length === 0 ? (
            <p className="text-center py-10 text-gaffer-muted text-xs uppercase tracking-widest">No fixtures found.</p>
          ) : (
            byGroup.map(([groupName, groupFixtures]) => (
              <GroupedList key={groupName} title={groupTitle(groupName)} fixtures={groupFixtures} onClick={onFixtureClick} renderRow={row} />
            ))
          )}
        </div>
      )}

      {mode === 'team' && (
        <div className="flex flex-col w-full px-4 py-4 gap-3">
          <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
            {(compTeams ?? []).map((t) => (
              <button
                key={t.teamId}
                onClick={() => setTeamId(t.teamId)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                  teamId === t.teamId ? 'bg-gaffer-orange text-white' : 'bg-gaffer-card text-gaffer-muted border border-gaffer-border'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
          {!teamId ? (
            <p className="text-center py-10 text-gaffer-muted text-xs uppercase tracking-widest">Pick a team to see its fixtures.</p>
          ) : byTeam.length === 0 ? (
            <p className="text-center py-10 text-gaffer-muted text-xs uppercase tracking-widest">No fixtures found for this team.</p>
          ) : (
            byTeam.map((f) => <div key={f._id}>{row(f, () => onFixtureClick(f._id))}</div>)
          )}
        </div>
      )}
    </div>
  )
}
