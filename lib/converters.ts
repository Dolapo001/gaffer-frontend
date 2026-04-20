import { FantasyPlayer, FantasyTeam } from './services/fantasy.service'
import { FantasySquadPlayer, Position, NextFixture } from './fantasyMockData'
import { Fixture } from './services/fixture.service'
import { getImageUrl } from '@/lib/api'

/**
 * Maps API FantasyPlayer to internal FantasySquadPlayer
 */
export function mapApiPlayer(
  p: FantasyPlayer,
  startingXIIds: string[] = [],
  benchIds: string[] = [],
  captainId: string | null = null,
  viceCaptainId: string | null = null,
  fixtures: Fixture[] = []
): FantasySquadPlayer {
  if (!p || !p.playerId || typeof p.playerId !== 'object') {
    const fallbackTeamObj = (p?.teamId && typeof p.teamId === 'object') ? (p.teamId as any) : null
    const fallbackJersey = fallbackTeamObj?.homeJersey || fallbackTeamObj?.jersey || undefined
    return {
      id: p?._id || '',
      name: 'Unknown Player',
      shortName: 'Unknown',
      teamName: p?.teamId?.name || 'Unknown',
      teamCode: (p?.teamId as any)?.handle || 'unk',
      teamColor: fallbackJersey?.primaryColor || '#4a5568',
      jersey: fallbackJersey,
      position: (p?.position as Position) || 'FWD',
      points: 0,
      price: p?.price || 0,
      pitchRow: 1,
      isOnPitch: false,
      isCaptain: false,
      isViceCaptain: false,
      goals: 0,
      assists: 0,
      form: 0,
      gwHistory: [],
      nextFixtures: []
    }
  }

  const posMap: Record<string, number> = { GK: 3, DEF: 2, MID: 1, FWD: 0 };
  const firstName = (p.playerId as any).firstName || ''
  const lastName = (p.playerId as any).lastName || ''

  const isOnPitch = startingXIIds.includes(p._id)
  const isCaptain = captainId === p._id
  const isViceCaptain = viceCaptainId === p._id

  const teamObj = (p.teamId && typeof p.teamId === 'object') ? (p.teamId as any) : null
  const playerTeamId = teamObj?._id || (typeof p.teamId === 'string' ? p.teamId : '')
  const playerTeamHandle = teamObj?.shortName || teamObj?.handle || ''

  // Extract jersey config from team — always home kit
  const teamJersey = teamObj?.homeJersey || teamObj?.jersey
    ? {
        primaryColor: (teamObj?.homeJersey?.primaryColor || teamObj?.jersey?.primaryColor) as string,
        secondaryColor: (teamObj?.homeJersey?.secondaryColor || teamObj?.jersey?.secondaryColor) as string,
        jerseyPattern: (teamObj?.homeJersey?.jerseyPattern || teamObj?.jersey?.jerseyPattern) as import('@/components/jersey/jerseyUtils').JerseyPattern,
      }
    : undefined

  // Find next scheduled/live fixture for this team
  const playerFixtures: NextFixture[] = fixtures
    .filter(f => {
      // Only show upcoming or live matches
      if (f.status !== 'scheduled' && f.status !== 'live') return false;

      const homeId = (f.homeTeamId && typeof f.homeTeamId === 'object') ? (f.homeTeamId as any)._id : f.homeTeamId
      const awayId = (f.awayTeamId && typeof f.awayTeamId === 'object') ? (f.awayTeamId as any)._id : f.awayTeamId

      const isMatch = (homeId === playerTeamId || awayId === playerTeamId)
      return isMatch;
    })
    .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
    .map(f => {
      const home = (f.homeTeamId && typeof f.homeTeamId === 'object') ? f.homeTeamId : { name: 'Home', handle: 'HOM' }
      const away = (f.awayTeamId && typeof f.awayTeamId === 'object') ? f.awayTeamId : { name: 'Away', handle: 'AWA' }

      const homeId = (f.homeTeamId && typeof f.homeTeamId === 'object') ? (f.homeTeamId as any)._id : f.homeTeamId
      const isHome = homeId === playerTeamId

      return {
        homeTeam: (home as any).name,
        awayTeam: (away as any).name,
        homeCode: (home as any).shortName || (home as any).handle?.slice(0, 3).toUpperCase() || 'HOM',
        awayCode: (away as any).shortName || (away as any).handle?.slice(0, 3).toUpperCase() || 'AWA',
        kickoff: f.kickoffAt,
        gameweek: typeof f.roundId === 'object' ? (f.roundId as any).order : 1
      }
    })

  if (fixtures.length > 0 && playerFixtures.length === 0) {
    console.debug(`No fixtures found for player ${p.playerId?.lastName} (Team: ${playerTeamId}) among ${fixtures.length} competition fixtures.`);
  }
  return {
    id: p._id,
    name: `${firstName} ${lastName}`.trim() || 'Unknown Player',
    shortName: lastName || 'Unknown',
    teamName: (p.teamId as any)?.name || 'Unknown',
    teamCode: playerTeamHandle,
    // Use team's primary jersey colour for backward-compat teamColor field
    teamColor: teamJersey?.primaryColor || '#4a5568',
    // Pass full jersey config so JerseySvg can render the correct home kit
    jersey: teamJersey,
    position: p.position as Position,
    points: p.totalPoints || 0,
    price: p.price,
    pitchRow: posMap[p.position] ?? 1,
    isOnPitch,
    isCaptain,
    isViceCaptain,
    goals: 0,
    assists: 0,
    form: 0,
    gwHistory: [],
    nextFixtures: playerFixtures,
    avatarUrl: getImageUrl((p.playerId as any)?.picture || ''),
    teamLogoUrl: getImageUrl(teamObj?.logoUrl || '')
  };
}

/**
 * Maps full API FantasyTeam to an array of FantasySquadPlayer
 */
export function mapApiTeamToSquad(team: FantasyTeam, fixtures: Fixture[] = []): FantasySquadPlayer[] {
  // Backend returns populated objects in startingXI/bench, not a squad array
  const rawStarting: any[] = (team as any).startingXI || []
  const rawBench: any[]    = (team as any).bench || []

  // squad may be pre-built, or we combine startingXI + bench
  const allPlayers: any[] = (team.squad && team.squad.length > 0)
    ? team.squad
    : [...rawStarting, ...rawBench]

  if (allPlayers.length === 0) return []

  // Extract IDs whether the entries are populated objects or plain strings
  const toId = (v: any): string => (v && typeof v === 'object' ? v._id || v.id : v) ?? ''
  const startingIds = rawStarting.map(toId)
  const benchIds    = rawBench.map(toId)
  const captainId   = toId((team as any).captainId)
  const viceCaptainId = toId((team as any).viceCaptainId)

  return allPlayers.map(p =>
    mapApiPlayer(p, startingIds, benchIds, captainId, viceCaptainId, fixtures)
  )
}
