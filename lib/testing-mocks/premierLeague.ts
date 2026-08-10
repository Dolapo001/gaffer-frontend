// TODO: REMOVE MOCK DATA BEFORE PROD

export const mockCompetition = {
  _id: 'pl-mock-123',
  orgId: 'org-mock-1',
  name: 'Premier League Mock',
  sport: 'Football',
  gender: 'male',
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  bannerUrl: '/images/fantasy_bg.png',
  status: 'live',
  format: 'league_knockout',
  stages: [
    { type: 'groups' },
    { type: 'knockout', startingRound: 'quarterfinal' }
  ],
  rules: {
    winPoints: 3,
    drawPoints: 1,
    lossPoints: 0,
    perGoalPoints: 1,
    cleanSheetPoints: 4,
    structure: 'single'
  },
  createdBy: { fullName: 'Admin', email: 'admin@gaffer.com' },
  joinCode: 'PL-TEST',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const mockTeams = [
  {
    _id: 'team-ars',
    teamId: 'team-ars',
    name: 'Arsenal',
    handle: '@arsenal',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
    sport: 'Football',
    eliminated: false,
  },
  {
    _id: 'team-mci',
    teamId: 'team-mci',
    name: 'Manchester City',
    handle: '@mancity',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
    sport: 'Football',
    eliminated: false,
  },
  {
    _id: 'team-liv',
    teamId: 'team-liv',
    name: 'Liverpool',
    handle: '@liverpool',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
    sport: 'Football',
    eliminated: false,
  },
  {
    _id: 'team-che',
    teamId: 'team-che',
    name: 'Chelsea',
    handle: '@chelsea',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
    sport: 'Football',
    eliminated: true, // Eliminated for testing logic
  }
];

export const mockPlayers = [
  { _id: 'p-1', firstName: 'Bukayo', lastName: 'Saka', teamId: 'team-ars', position: 'Midfielder', price: 9500000 },
  { _id: 'p-2', firstName: 'Martin', lastName: 'Odegaard', teamId: 'team-ars', position: 'Midfielder', price: 8500000 },
  { _id: 'p-3', firstName: 'William', lastName: 'Saliba', teamId: 'team-ars', position: 'Defender', price: 6000000 },
  { _id: 'p-4', firstName: 'David', lastName: 'Raya', teamId: 'team-ars', position: 'Goalkeeper', price: 5500000 },
  { _id: 'p-5', firstName: 'Erling', lastName: 'Haaland', teamId: 'team-mci', position: 'Forward', price: 14000000 },
  { _id: 'p-6', firstName: 'Kevin', lastName: 'De Bruyne', teamId: 'team-mci', position: 'Midfielder', price: 10500000 },
  { _id: 'p-7', firstName: 'Phil', lastName: 'Foden', teamId: 'team-mci', position: 'Midfielder', price: 8500000 },
  { _id: 'p-8', firstName: 'Ruben', lastName: 'Dias', teamId: 'team-mci', position: 'Defender', price: 6500000 },
  { _id: 'p-9', firstName: 'Mohamed', lastName: 'Salah', teamId: 'team-liv', position: 'Forward', price: 13000000 },
  { _id: 'p-10', firstName: 'Trent', lastName: 'Alexander-Arnold', teamId: 'team-liv', position: 'Defender', price: 7000000 },
  { _id: 'p-11', firstName: 'Virgil', lastName: 'van Dijk', teamId: 'team-liv', position: 'Defender', price: 6500000 },
  { _id: 'p-12', firstName: 'Alisson', lastName: 'Becker', teamId: 'team-liv', position: 'Goalkeeper', price: 6000000 },
  { _id: 'p-13', firstName: 'Cole', lastName: 'Palmer', teamId: 'team-che', position: 'Midfielder', price: 8000000 },
  { _id: 'p-14', firstName: 'Reece', lastName: 'James', teamId: 'team-che', position: 'Defender', price: 5500000 },
  { _id: 'p-15', firstName: 'Enzo', lastName: 'Fernandez', teamId: 'team-che', position: 'Midfielder', price: 6500000 },
].map(p => ({ ...p, id: p._id, name: `${p.firstName} ${p.lastName}` }));

export const mockRounds = [
  { _id: 'r-1', competitionId: 'pl-mock-123', name: 'Quarterfinals', order: 1, stageType: 'knockout' },
  { _id: 'r-2', competitionId: 'pl-mock-123', name: 'Semifinals', order: 2, stageType: 'knockout' },
  { _id: 'r-3', competitionId: 'pl-mock-123', name: 'Finals', order: 3, stageType: 'knockout' }
];

export const mockFixtures = [
  // Completed match (Arsenal vs Chelsea)
  {
    _id: 'f-1',
    competitionId: 'pl-mock-123',
    homeTeamId: mockTeams[0], // Arsenal
    awayTeamId: mockTeams[3], // Chelsea
    roundId: mockRounds[0],
    kickoffAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    stageType: 'knockout',
    status: 'completed',
    score: { home: 3, away: 1 },
  },
  // Live match (Man City vs Liverpool) - tests live locking
  {
    _id: 'f-2',
    competitionId: 'pl-mock-123',
    homeTeamId: mockTeams[1], // Man City
    awayTeamId: mockTeams[2], // Liverpool
    roundId: mockRounds[0],
    kickoffAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 mins ago
    stageType: 'knockout',
    status: 'live',
    score: { home: 1, away: 0 },
  },
  // Scheduled match (Semifinal 1)
  {
    _id: 'f-3',
    competitionId: 'pl-mock-123',
    homeTeamId: mockTeams[0], // Arsenal
    awayTeamId: 'team-mci', // Unresolved opponent or Man City
    roundId: mockRounds[1],
    kickoffAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    stageType: 'knockout',
    status: 'scheduled',
    score: { home: 0, away: 0 },
  }
];

export const mockStandingsResponse = {
  standings: [
    { teamId: { _id: 'team-ars', name: 'Arsenal', handle: '@arsenal', shortName: 'ARS', logoUrl: mockTeams[0].logoUrl }, played: 4, won: 3, drawn: 1, lost: 0, goalsFor: 9, goalsAgainst: 3, goalDifference: 6, points: 10 },
    { teamId: { _id: 'team-mci', name: 'Manchester City', handle: '@mancity', shortName: 'MCI', logoUrl: mockTeams[1].logoUrl }, played: 4, won: 3, drawn: 0, lost: 1, goalsFor: 10, goalsAgainst: 5, goalDifference: 5, points: 9 },
    { teamId: { _id: 'team-liv', name: 'Liverpool', handle: '@liverpool', shortName: 'LIV', logoUrl: mockTeams[2].logoUrl }, played: 4, won: 2, drawn: 1, lost: 1, goalsFor: 7, goalsAgainst: 6, goalDifference: 1, points: 7 },
    { teamId: { _id: 'team-che', name: 'Chelsea', handle: '@chelsea', shortName: 'CHE', logoUrl: mockTeams[3].logoUrl }, played: 4, won: 0, drawn: 0, lost: 4, goalsFor: 2, goalsAgainst: 8, goalDifference: -6, points: 0 },
  ],
  total: 4,
  page: 1,
  pageSize: 20,
};

export const mockFantasyTeam = {
  _id: 'ft-123',
  competitionId: 'pl-mock-123',
  ownerId: 'me',
  teamName: 'Saka Potatoes',
  balance: 2000000,
  points: 45,
  rank: 1,
  startingXI: [
    mockPlayers[3]._id, // Raya
    mockPlayers[2]._id, // Saliba
    mockPlayers[9]._id, // TAA
    mockPlayers[10]._id, // VVD
    mockPlayers[0]._id, // Saka
    mockPlayers[1]._id, // Odegaard
    mockPlayers[6]._id, // Foden
    mockPlayers[5]._id, // KDB
    mockPlayers[12]._id, // Palmer
    mockPlayers[4]._id, // Haaland
    mockPlayers[8]._id, // Salah
  ],
  bench: [
    mockPlayers[11]._id, // Alisson
    mockPlayers[7]._id, // Dias
    mockPlayers[14]._id, // Enzo
    mockPlayers[13]._id, // James
  ],
  captainId: mockPlayers[4]._id,
  viceCaptainId: mockPlayers[0]._id,
  chipActive: 'none',
  freeTransfersRemaining: 1,
  transferCostMode: 'coins'
};
