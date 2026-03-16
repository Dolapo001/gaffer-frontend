// League & Fantasy Mock Data — replace with Firestore in production

export interface Team {
  id: string
  name: string
  shortName: string
  badge: string // emoji placeholder
  color: string
}

export interface GoalScorer {
  name: string
  team: 'home' | 'away'
  minute: number
  type: 'goal' | 'penalty' | 'own-goal'
}

export interface MatchEvent {
  id: string
  minute: number
  type: 'goal' | 'yellow-card' | 'red-card' | 'substitution' | 'penalty'
  playerName: string
  teamId: string
  detail?: string
}

export interface MatchStats {
  possession: [number, number]
  shots: [number, number]
  shotsOnTarget: [number, number]
  corners: [number, number]
  fouls: [number, number]
  yellowCards: [number, number]
  redCards: [number, number]
}

export interface Match {
  id: string
  leagueId: string
  homeTeam: Team
  awayTeam: Team
  homeScore?: number
  awayScore?: number
  matchDate: string
  matchTime: string
  matchweek: number
  status: 'scheduled' | 'live' | 'finished'
  goalScorers?: GoalScorer[]
  events?: MatchEvent[]
  stats?: MatchStats
}

export interface Standing {
  position: number
  team: Team
  played: number
  wins: number
  draws: number
  losses: number
  points: number
  form: ('W' | 'D' | 'L')[]
}

export interface Player {
  id: string
  name: string
  position: 'GK' | 'DEF' | 'MID' | 'FWD'
  teamId: string
  teamName: string
  points: number
  goals: number
  assists: number
  price: number
}

export interface FantasyPlayer extends Player {
  isOnPitch: boolean
  pitchRow?: number // 0=GK, 1=DEF, 2=MID, 3=FWD
  pitchCol?: number
}

export interface SocialPost {
  id: string
  author: { name: string; handle: string; verified?: boolean }
  text: string
  image?: string
  likes: number
  timeAgo: string
}

export interface LeagueDetail {
  id: string
  name: string
  season: string
  currentMatchweek: number
  totalTeams: number
  badge: string
}

// ─── Teams ─────────────────────────────────────────────────────────────────

export const TEAMS: Team[] = [
  { id: 'barca', name: 'Barcelona', shortName: 'BAR', badge: '🔴🔵', color: '#A50044' },
  { id: 'mancity', name: 'Manchester City', shortName: 'MCI', badge: '🔵', color: '#6CABDD' },
  { id: 'cococ', name: 'COCOC', shortName: 'COC', badge: '🟠', color: '#FF6B00' },
  { id: 'coaks', name: 'COAKS', shortName: 'COA', badge: '🟢', color: '#00AA44' },
  { id: 'cobas', name: 'COBAS', shortName: 'COB', badge: '🔷', color: '#0055CC' },
  { id: 'cojun', name: 'COJUN', shortName: 'COJ', badge: '🟡', color: '#FFD700' },
  { id: 'engineering', name: 'Engineering', shortName: 'ENG', badge: '⚙️', color: '#FF4400' },
  { id: 'coake', name: 'COAKE', shortName: 'COE', badge: '🟣', color: '#8800CC' },
]

const [barca, mancity, cococ, coaks, cobas, cojun, engineering, coake] = TEAMS

// ─── League Detail ─────────────────────────────────────────────────────────

export const LEAGUE_DETAIL: LeagueDetail = {
  id: '1',
  name: 'Bowen Fans League',
  season: '2023/24',
  currentMatchweek: 5,
  totalTeams: 8,
  badge: '🏆',
}

// ─── Matches ───────────────────────────────────────────────────────────────

const MATCH_STATS_SAMPLE: MatchStats = {
  possession: [62, 38],
  shots: [14, 8],
  shotsOnTarget: [6, 3],
  corners: [7, 4],
  fouls: [9, 12],
  yellowCards: [1, 2],
  redCards: [0, 0],
}

export const MATCHES: Match[] = [
  {
    id: 'm1',
    leagueId: '1',
    homeTeam: barca,
    awayTeam: mancity,
    homeScore: 3,
    awayScore: 3,
    matchDate: 'Sat 14 Feb',
    matchTime: '14:30',
    matchweek: 5,
    status: 'finished',
    goalScorers: [
      { name: 'Omabo', team: 'home', minute: 12, type: 'goal' },
      { name: 'Pascall', team: 'home', minute: 34, type: 'goal' },
      { name: 'Da Jong', team: 'home', minute: 78, type: 'goal' },
      { name: 'Neymar', team: 'away', minute: 20, type: 'goal' },
      { name: 'Haaland', team: 'away', minute: 55, type: 'penalty' },
      { name: 'De Bruyne', team: 'away', minute: 88, type: 'goal' },
    ],
    events: [
      { id: 'e1', minute: 12, type: 'goal', playerName: 'Omabo', teamId: 'barca', detail: 'Left foot shot from the centre' },
      { id: 'e2', minute: 20, type: 'goal', playerName: 'Neymar', teamId: 'mancity', detail: 'Header from corner' },
      { id: 'e3', minute: 34, type: 'goal', playerName: 'Pascall', teamId: 'barca', detail: 'Counter-attack' },
      { id: 'e4', minute: 45, type: 'yellow-card', playerName: 'De Bruyne', teamId: 'mancity' },
      { id: 'e5', minute: 55, type: 'penalty', playerName: 'Haaland', teamId: 'mancity', detail: 'Penalty' },
      { id: 'e6', minute: 60, type: 'substitution', playerName: 'Gavi → Pedri', teamId: 'barca' },
      { id: 'e7', minute: 72, type: 'yellow-card', playerName: 'Raphinha', teamId: 'barca' },
      { id: 'e8', minute: 78, type: 'goal', playerName: 'Da Jong', teamId: 'barca', detail: 'Volley from 20 yards' },
      { id: 'e9', minute: 88, type: 'goal', playerName: 'De Bruyne', teamId: 'mancity', detail: 'Long range effort' },
    ],
    stats: MATCH_STATS_SAMPLE,
  },
  {
    id: 'm2',
    leagueId: '1',
    homeTeam: engineering,
    awayTeam: cococ,
    matchDate: 'Sat 21 Feb',
    matchTime: '14:00',
    matchweek: 6,
    status: 'scheduled',
  },
  {
    id: 'm3',
    leagueId: '1',
    homeTeam: coaks,
    awayTeam: cobas,
    matchDate: 'Sat 21 Feb',
    matchTime: '16:30',
    matchweek: 6,
    status: 'scheduled',
  },
  {
    id: 'm4',
    leagueId: '1',
    homeTeam: cojun,
    awayTeam: coake,
    matchDate: 'Sun 22 Feb',
    matchTime: '14:00',
    matchweek: 6,
    status: 'live',
    homeScore: 1,
    awayScore: 0,
  },
  {
    id: 'm5',
    leagueId: '1',
    homeTeam: cococ,
    awayTeam: coaks,
    homeScore: 4,
    awayScore: 0,
    matchDate: 'Sat 7 Feb',
    matchTime: '14:00',
    matchweek: 4,
    status: 'finished',
  },
  {
    id: 'm6',
    leagueId: '1',
    homeTeam: cobas,
    awayTeam: engineering,
    homeScore: 1,
    awayScore: 1,
    matchDate: 'Sat 7 Feb',
    matchTime: '14:00',
    matchweek: 4,
    status: 'finished',
  },
]

// ─── Standings ─────────────────────────────────────────────────────────────

export const STANDINGS: Standing[] = [
  { position: 1, team: cococ, played: 5, wins: 4, draws: 0, losses: 1, points: 12, form: ['W', 'W', 'W', 'D', 'L'] },
  { position: 2, team: coaks, played: 5, wins: 3, draws: 1, losses: 1, points: 10, form: ['W', 'W', 'D', 'L', 'W'] },
  { position: 3, team: cobas, played: 5, wins: 3, draws: 1, losses: 1, points: 10, form: ['W', 'D', 'W', 'W', 'L'] },
  { position: 4, team: cojun, played: 5, wins: 2, draws: 1, losses: 2, points: 7, form: ['L', 'W', 'D', 'W', 'L'] },
  { position: 5, team: coake, played: 5, wins: 2, draws: 1, losses: 2, points: 7, form: ['W', 'L', 'W', 'D', 'L'] },
  { position: 6, team: barca, played: 5, wins: 1, draws: 1, losses: 3, points: 4, form: ['L', 'D', 'L', 'W', 'L'] },
  { position: 7, team: engineering, played: 5, wins: 1, draws: 0, losses: 4, points: 3, form: ['L', 'L', 'W', 'L', 'L'] },
  { position: 8, team: mancity, played: 5, wins: 0, draws: 1, losses: 4, points: 1, form: ['L', 'L', 'L', 'D', 'L'] },
]

// ─── Players ───────────────────────────────────────────────────────────────

export const TOP_PLAYERS: Player[] = [
  { id: 'p1', name: 'Jimskin', position: 'FWD', teamId: 'cococ', teamName: 'COCOC', points: 508, goals: 12, assists: 5, price: 9.5 },
  { id: 'p2', name: 'Dahood', position: 'MID', teamId: 'coaks', teamName: 'COAKS', points: 480, goals: 8, assists: 9, price: 8.8 },
  { id: 'p3', name: 'Noba', position: 'FWD', teamId: 'cobas', teamName: 'COBAS', points: 468, goals: 10, assists: 4, price: 9.0 },
  { id: 'p4', name: 'Chnox', position: 'MID', teamId: 'cojun', teamName: 'COJUN', points: 444, goals: 6, assists: 11, price: 8.2 },
  { id: 'p5', name: 'Wesdom', position: 'DEF', teamId: 'coake', teamName: 'COAKE', points: 442, goals: 2, assists: 3, price: 6.5 },
  { id: 'p6', name: 'Tabbra', position: 'GK', teamId: 'cococ', teamName: 'COCOC', points: 440, goals: 0, assists: 0, price: 5.5 },
  { id: 'p7', name: 'Alfreda', position: 'DEF', teamId: 'coaks', teamName: 'COAKS', points: 398, goals: 3, assists: 2, price: 6.0 },
  { id: 'p8', name: 'Jakota', position: 'MID', teamId: 'cobas', teamName: 'COBAS', points: 375, goals: 5, assists: 7, price: 7.8 },
  { id: 'p9', name: 'Edomsb', position: 'FWD', teamId: 'barca', teamName: 'Barcelona', points: 360, goals: 9, assists: 2, price: 8.5 },
  { id: 'p10', name: 'Brenden Vassouv', position: 'DEF', teamId: 'mancity', teamName: 'Man City', points: 330, goals: 1, assists: 4, price: 5.8 },
]

export const ALL_PLAYERS: Player[] = [
  ...TOP_PLAYERS,
  { id: 'p11', name: 'Omorede', position: 'GK', teamId: 'coaks', teamName: 'COAKS', points: 290, goals: 0, assists: 0, price: 4.5 },
  { id: 'p12', name: 'Sunfield', position: 'DEF', teamId: 'cojun', teamName: 'COJUN', points: 270, goals: 1, assists: 1, price: 5.0 },
  { id: 'p13', name: 'Ademoye', position: 'MID', teamId: 'coake', teamName: 'COAKE', points: 260, goals: 4, assists: 3, price: 7.0 },
  { id: 'p14', name: 'Bankole', position: 'FWD', teamId: 'engineering', teamName: 'Engineering', points: 250, goals: 6, assists: 1, price: 7.5 },
  { id: 'p15', name: 'Tochukwu', position: 'GK', teamId: 'cobas', teamName: 'COBAS', points: 240, goals: 0, assists: 0, price: 4.0 },
]

// ─── Fantasy Team ───────────────────────────────────────────────────────────

export const FANTASY_TEAM: FantasyPlayer[] = [
  // GK (row 0)
  { ...TOP_PLAYERS[5], isOnPitch: true, pitchRow: 0, pitchCol: 0 }, // Tabbra GK
  // DEF (row 1)
  { ...TOP_PLAYERS[4], isOnPitch: true, pitchRow: 1, pitchCol: 0 }, // Wesdom DEF
  { ...TOP_PLAYERS[6], isOnPitch: true, pitchRow: 1, pitchCol: 1 }, // Alfreda DEF
  { ...TOP_PLAYERS[9], isOnPitch: true, pitchRow: 1, pitchCol: 2 }, // Brenden DEF
  // MID (row 2)
  { ...TOP_PLAYERS[1], isOnPitch: true, pitchRow: 2, pitchCol: 0 }, // Dahood MID
  { ...TOP_PLAYERS[3], isOnPitch: true, pitchRow: 2, pitchCol: 1 }, // Chnox MID
  { ...TOP_PLAYERS[7], isOnPitch: true, pitchRow: 2, pitchCol: 2 }, // Jakota MID
  // FWD (row 3)
  { ...TOP_PLAYERS[0], isOnPitch: true, pitchRow: 3, pitchCol: 0 }, // Jimskin FWD
  { ...TOP_PLAYERS[2], isOnPitch: true, pitchRow: 3, pitchCol: 1 }, // Noba FWD
  { ...TOP_PLAYERS[8], isOnPitch: true, pitchRow: 3, pitchCol: 2 }, // Edomsb FWD
  // Bench
  { ...ALL_PLAYERS[10], isOnPitch: false }, // Omorede GK bench
]

// ─── Social Feed ───────────────────────────────────────────────────────────

export const SOCIAL_POSTS: SocialPost[] = [
  {
    id: 's1',
    author: { name: 'BOWEN FANS LEAGUE', handle: '@bowenfans', verified: true },
    text: 'Barcelona 3-3 Manchester City: Omabo and Pascall on the Scoresheet',
    image: '/images/news-hero.jpg',
    likes: 247,
    timeAgo: '2h',
  },
  {
    id: 's2',
    author: { name: 'Bowen Fans League', handle: '@bowenfans', verified: true },
    text: 'New Winning AFC manager Niece is repeatedly interested in making Merge11. Affordable Bonsai Alexei for the signing in the June transfer window.',
    likes: 84,
    timeAgo: '4h',
  },
  {
    id: 's3',
    author: { name: 'Bowen Fans League', handle: '@bowenfans', verified: true },
    text: 'As is known, the 24 year old player has returned to be an important part of the BCR throughout the 2023/2024 season. He has made 40 appearances in all competitions, contributing two goals and five assists.',
    likes: 53,
    timeAgo: '6h',
  },
]

// ─── Fantasy Stats ──────────────────────────────────────────────────────────

export const FANTASY_STATS = {
  averagePoints: 34,
  gameweekPoints: 114,
  totalPoints: 132,
  teamName: 'Bowen Fans League',
  gameweek: 1,
  transfersLeft: 1,
  deadline: 'Sat 14 Feb, 14:30',
}
