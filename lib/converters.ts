import { FantasyPlayer, FantasyTeam } from './services/fantasy.service'
import { FantasySquadPlayer, Position, NextFixture } from './fantasyMockData'
import { Fixture } from './services/fixture.service'

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
    return {
      id: p?._id || '',
      name: 'Unknown Player',
      shortName: 'Unknown',
      teamName: p?.teamId?.name || 'Unknown',
      teamCode: (p?.teamId as any)?.handle || 'unk',
      teamColor: '#ff6b00',
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

  const teamObj = typeof p.teamId === 'object' ? (p.teamId as any) : null
  const playerTeamId = teamObj?._id || (typeof p.teamId === 'string' ? p.teamId : '')
  const playerTeamHandle = teamObj?.shortName || teamObj?.handle || ''

  // Find next scheduled/live fixture for this team
  const playerFixtures: NextFixture[] = fixtures
    .filter(f => {
      // Only show upcoming or live matches
      if (f.status !== 'scheduled' && f.status !== 'live') return false;
      
      const homeId = typeof f.homeTeamId === 'object' ? (f.homeTeamId as any)._id : f.homeTeamId
      const awayId = typeof f.awayTeamId === 'object' ? (f.awayTeamId as any)._id : f.awayTeamId
      
      const isMatch = (homeId === playerTeamId || awayId === playerTeamId)
      return isMatch;
    })
    .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
    .map(f => {
      const home = typeof f.homeTeamId === 'object' ? f.homeTeamId : { name: 'Home', handle: 'HOM' }
      const away = typeof f.awayTeamId === 'object' ? f.awayTeamId : { name: 'Away', handle: 'AWA' }
      
      const homeId = typeof f.homeTeamId === 'object' ? (f.homeTeamId as any)._id : f.homeTeamId
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
    teamColor: '#ff6b00',
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
    avatarUrl: (p.playerId as any)?.picture || '',
    teamLogoUrl: teamObj?.logoUrl || ''
  };
}

/**
 * Maps full API FantasyTeam to an array of FantasySquadPlayer
 */
export function mapApiTeamToSquad(team: FantasyTeam, fixtures: Fixture[] = []): FantasySquadPlayer[] {
  const allPlayers = team.squad || []
  return allPlayers.map(p => mapApiPlayer(p, team.startingXI, team.bench, team.captainId, team.viceCaptainId, fixtures))
}
