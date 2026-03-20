export type Player = {
  id: string
  name: string
  position: string
  price: string
  photo?: string
  isSelected: boolean
  role?: 'player' | 'captain' | 'coach'
  status?: 'active' | 'injured' | 'suspended'
}

export type Team = {
  id: string
  name: string
  handle?: string
  playerCount: string
  logo: string
}

export type Group = {
  id: string
  name: string
  color: string
  teams: Team[]
}

export type OrganiseView = 'list' | 'create' | 'details' | 'share' | 'select_team'
