// ─── Fantasy Team Selection Mock Data ────────────────────────────────────────

export type Position = 'GK' | 'DEF' | 'MID' | 'FWD'
export type BoostType = 'benchBoost' | 'tripleCaptain' | 'wildcard' | 'freePlay' | null

export interface GWResult {
  gw: number
  pts: number
  opponent: string
  result: 'W' | 'D' | 'L'
}

export interface NextFixture {
  homeTeam: string
  awayTeam: string
  homeCode: string
  awayCode: string
  kickoff: string
  gameweek: number
}

export interface FantasySquadPlayer {
  id: string
  name: string
  shortName: string
  teamName: string
  teamCode: string
  teamColor: string
  position: Position
  points: number
  price: number
  /** 0=GK, 1=DEF, 2=MID, 3=FWD */
  pitchRow: number
  isOnPitch: boolean
  isCaptain: boolean
  isViceCaptain: boolean
  goals: number
  assists: number
  form: number
  gwHistory: GWResult[]
  nextFixtures: NextFixture[]
  avatarUrl?: string
  teamLogoUrl?: string
  status?: 'fit' | 'injured' | 'warning'
}

export interface BoostOption {
  id: NonNullable<BoostType>
  label: string
  shortLabel: string
  description: string
}

// ─── Boost Options ───────────────────────────────────────────────────────────

export const BOOST_OPTIONS: BoostOption[] = [
  {
    id: 'benchBoost',
    label: 'Bench Boost',
    shortLabel: 'Bench Boost',
    description: 'Score points with all 15 players this gameweek',
  },
  {
    id: 'tripleCaptain',
    label: 'Triple Captain',
    shortLabel: 'Triple Captain',
    description: "Your captain's points are tripled this gameweek",
  },
  {
    id: 'wildcard',
    label: 'Wildcard',
    shortLabel: 'Wildcard',
    description: 'Make unlimited free transfers this gameweek',
  },
  {
    id: 'freePlay',
    label: 'Free',
    shortLabel: 'Free Play',
    description: 'All transfers are free this gameweek',
  },
]

// ─── Mock Squad ──────────────────────────────────────────────────────────────

const TEAMS = [
  { name: 'Engineering', code: 'ENG', color: '#1D4ED8' },
  { name: 'Law', code: 'LAW', color: '#DC2626' },
  { name: 'Medicine', code: 'MED', color: '#16A34A' },
  { name: 'Sciences', code: 'SCI', color: '#9333EA' },
  { name: 'Business', code: 'BUS', color: '#EA580C' },
]

export const getJerseyUrl = (teamCode: string, position: string) => {
  let teamId = 1; // Arsenal
  switch (teamCode) {
    case 'ironclad-athletic': teamId = 1; break; // Arsenal
    case 'crimson-rovers':     teamId = 2; break; // Aston Villa
    case 'emerald-city-fc':    teamId = 3; break; // Bournemouth
    case 'golden-strikers':    teamId = 4; break; // Brentford
    case 'northgate-united':   teamId = 6; break; // Brighton
    case 'harbour-wolves':     teamId = 8; break; // Chelsea
    case 'delta-phoenix':      teamId = 9; break; // Palace
    case 'coastal-titans':     teamId = 10; break; // Everton
    // Mock legacy codes
    case 'ENG': teamId = 11; break; // Fulham
    case 'LAW': teamId = 12; break; // Liverpool
    case 'MED': teamId = 13; break; // Man City
    case 'SCI': teamId = 14; break; // Man Utd
    case 'BUS': teamId = 15; break; // Newcastle
    default: teamId = (Math.abs(teamCode.length * 7) % 20) + 1;
  }
  const isGk = position === 'GK' || position === 'GKP';
  return `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamId}${isGk ? '_1' : ''}-66.webp`;
}

function gwHistory(base: number, opponent = 'Engineering'): GWResult[] {
  return [
    { gw: 1, pts: Math.round(base * 0.28), opponent, result: 'W' },
    { gw: 2, pts: Math.round(base * 0.24), opponent, result: 'D' },
    { gw: 3, pts: Math.round(base * 0.20), opponent, result: 'W' },
  ]
}

const NEXT: NextFixture[] = [
  {
    homeTeam: 'Engineering',
    awayTeam: 'Law',
    homeCode: 'ENG',
    awayCode: 'LAW',
    kickoff: 'SAT 14:00',
    gameweek: 4,
  },
  {
    homeTeam: 'Medicine',
    awayTeam: 'Sciences',
    homeCode: 'MED',
    awayCode: 'SCI',
    kickoff: 'SAT 14:00',
    gameweek: 4,
  },
]

export const SQUAD: FantasySquadPlayer[] = [
  // ── GK (pitch row 0) ──
  {
    id: 'gk1',
    name: 'Taiwo Okafor',
    shortName: 'Okafor',
    teamName: 'Engineering',
    teamCode: 'ENG',
    teamColor: '#1D4ED8',
    position: 'GK',
    points: 52,
    price: 5.5,
    pitchRow: 0,
    isOnPitch: true,
    isCaptain: false,
    isViceCaptain: false,
    goals: 0,
    assists: 2,
    form: 7.2,
    gwHistory: gwHistory(52),
    nextFixtures: NEXT,
    avatarUrl: '',
  },

  // ── DEF (pitch row 1) ──
  {
    id: 'def1',
    name: 'Emeka Nwosu',
    shortName: 'Nwosu',
    teamName: 'Law',
    teamCode: 'LAW',
    teamColor: '#DC2626',
    position: 'DEF',
    points: 48,
    price: 5.0,
    pitchRow: 1,
    isOnPitch: true,
    isCaptain: false,
    isViceCaptain: false,
    goals: 1,
    assists: 3,
    form: 6.8,
    gwHistory: gwHistory(48, 'Sciences'),
    nextFixtures: NEXT,
    avatarUrl: '',
  },
  {
    id: 'def2',
    name: 'Biodun Adeleke',
    shortName: 'Adeleke',
    teamName: 'Medicine',
    teamCode: 'MED',
    teamColor: '#16A34A',
    position: 'DEF',
    points: 44,
    price: 4.8,
    pitchRow: 1,
    isOnPitch: true,
    isCaptain: false,
    isViceCaptain: false,
    goals: 0,
    assists: 4,
    form: 5.5,
    gwHistory: gwHistory(44, 'Business'),
    nextFixtures: NEXT,
    avatarUrl: '',
  },
  {
    id: 'def3',
    name: 'Segun Balogun',
    shortName: 'Balogun',
    teamName: 'Sciences',
    teamCode: 'SCI',
    teamColor: '#9333EA',
    position: 'DEF',
    points: 50,
    price: 5.2,
    pitchRow: 1,
    isOnPitch: true,
    isCaptain: false,
    isViceCaptain: true,
    goals: 2,
    assists: 1,
    form: 7.0,
    gwHistory: gwHistory(50, 'Law'),
    nextFixtures: NEXT,
    avatarUrl: '',
  },
  {
    id: 'def4',
    name: 'Femi Adeyemi',
    shortName: 'Adeyemi',
    teamName: 'Business',
    teamCode: 'BUS',
    teamColor: '#EA580C',
    position: 'DEF',
    points: 38,
    price: 4.5,
    pitchRow: 1,
    isOnPitch: true,
    isCaptain: false,
    isViceCaptain: false,
    goals: 0,
    assists: 2,
    form: 4.8,
    gwHistory: gwHistory(38, 'Medicine'),
    nextFixtures: NEXT,
    avatarUrl: '',
  },

  // ── MID (pitch row 2) ──
  {
    id: 'mid1',
    name: 'Akinbiyi Omoba',
    shortName: 'Omoba',
    teamName: 'Engineering',
    teamCode: 'ENG',
    teamColor: '#1D4ED8',
    position: 'MID',
    points: 72,
    price: 9.5,
    pitchRow: 2,
    isOnPitch: true,
    isCaptain: true,
    isViceCaptain: false,
    goals: 5,
    assists: 8,
    form: 9.4,
    gwHistory: [
      { gw: 1, pts: 14, opponent: 'Engineering', result: 'W' },
      { gw: 2, pts: 14, opponent: 'Engineering', result: 'W' },
      { gw: 3, pts: 14, opponent: 'Engineering', result: 'W' },
    ],
    nextFixtures: NEXT,
    avatarUrl: '',
  },
  {
    id: 'mid2',
    name: 'Marc Duru',
    shortName: 'Duru',
    teamName: 'Law',
    teamCode: 'LAW',
    teamColor: '#DC2626',
    position: 'MID',
    points: 61,
    price: 8.0,
    pitchRow: 2,
    isOnPitch: true,
    isCaptain: false,
    isViceCaptain: false,
    goals: 4,
    assists: 6,
    form: 8.2,
    gwHistory: gwHistory(61, 'Sciences'),
    nextFixtures: NEXT,
    avatarUrl: '',
  },
  {
    id: 'mid3',
    name: 'Tunde Fashola',
    shortName: 'Fashola',
    teamName: 'Medicine',
    teamCode: 'MED',
    teamColor: '#16A34A',
    position: 'MID',
    points: 55,
    price: 7.5,
    pitchRow: 2,
    isOnPitch: true,
    isCaptain: false,
    isViceCaptain: false,
    goals: 3,
    assists: 5,
    form: 7.6,
    gwHistory: gwHistory(55, 'Business'),
    nextFixtures: NEXT,
    avatarUrl: '',
  },
  {
    id: 'mid4',
    name: 'Chidi Okeke',
    shortName: 'Okeke',
    teamName: 'Sciences',
    teamCode: 'SCI',
    teamColor: '#9333EA',
    position: 'MID',
    points: 47,
    price: 6.5,
    pitchRow: 2,
    isOnPitch: true,
    isCaptain: false,
    isViceCaptain: false,
    goals: 2,
    assists: 7,
    form: 6.5,
    gwHistory: gwHistory(47, 'Law'),
    nextFixtures: NEXT,
    avatarUrl: '',
  },

  // ── FWD (pitch row 3) ──
  {
    id: 'fwd1',
    name: 'Babatunde Lawal',
    shortName: 'Lawal',
    teamName: 'Law',
    teamCode: 'LAW',
    teamColor: '#DC2626',
    position: 'FWD',
    points: 83,
    price: 11.5,
    pitchRow: 3,
    isOnPitch: true,
    isCaptain: false,
    isViceCaptain: false,
    goals: 10,
    assists: 4,
    form: 9.8,
    gwHistory: gwHistory(83, 'Engineering'),
    nextFixtures: NEXT,
    avatarUrl: '',
  },
  {
    id: 'fwd2',
    name: 'Olu Adegoke',
    shortName: 'Adegoke',
    teamName: 'Engineering',
    teamCode: 'ENG',
    teamColor: '#1D4ED8',
    position: 'FWD',
    points: 69,
    price: 10.0,
    pitchRow: 3,
    isOnPitch: true,
    isCaptain: false,
    isViceCaptain: false,
    goals: 8,
    assists: 3,
    form: 8.5,
    gwHistory: gwHistory(69, 'Sciences'),
    nextFixtures: NEXT,
    avatarUrl: '',
  },

  // ── BENCH ──
  {
    id: 'bench_gk',
    name: 'Kola Adesanya',
    shortName: 'Adesanya',
    teamName: 'Business',
    teamCode: 'BUS',
    teamColor: '#EA580C',
    position: 'GK',
    points: 28,
    price: 4.0,
    pitchRow: 0,
    isOnPitch: false,
    isCaptain: false,
    isViceCaptain: false,
    goals: 0,
    assists: 0,
    form: 3.5,
    gwHistory: gwHistory(28, 'Medicine'),
    nextFixtures: NEXT,
    avatarUrl: '',
  },
  {
    id: 'bench_def',
    name: 'Wale Odunsi',
    shortName: 'Odunsi',
    teamName: 'Medicine',
    teamCode: 'MED',
    teamColor: '#16A34A',
    position: 'DEF',
    points: 22,
    price: 4.0,
    pitchRow: 1,
    isOnPitch: false,
    isCaptain: false,
    isViceCaptain: false,
    goals: 0,
    assists: 1,
    form: 3.2,
    gwHistory: gwHistory(22, 'Business'),
    nextFixtures: NEXT,
    avatarUrl: '',
  },
  {
    id: 'bench_mid',
    name: 'Nonso Obi',
    shortName: 'Obi',
    teamName: 'Sciences',
    teamCode: 'SCI',
    teamColor: '#9333EA',
    position: 'MID',
    points: 30,
    price: 4.5,
    pitchRow: 2,
    isOnPitch: false,
    isCaptain: false,
    isViceCaptain: false,
    goals: 1,
    assists: 2,
    form: 4.0,
    gwHistory: gwHistory(30, 'Law'),
    nextFixtures: NEXT,
    avatarUrl: '',
  },
  {
    id: 'bench_fwd',
    name: 'Dayo Bankole',
    shortName: 'Bankole',
    teamName: 'Law',
    teamCode: 'LAW',
    teamColor: '#DC2626',
    position: 'FWD',
    points: 18,
    price: 4.5,
    pitchRow: 3,
    isOnPitch: false,
    isCaptain: false,
    isViceCaptain: false,
    goals: 2,
    assists: 0,
    form: 3.8,
    gwHistory: gwHistory(18, 'Engineering'),
    nextFixtures: NEXT,
    avatarUrl: '',
  },
]

export const GAMEWEEK_INFO = {
  number: 1,
  deadlineLabel: 'Sat 14 Feb, 14:30',
  deadlineDate: new Date('2026-02-14T14:30:00'),
  averagePoints: 34,
  yourScore: 114,
  highestScore: 132,
  budget: 100.0,
  transfersAvailable: 2,
}
