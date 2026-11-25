import type { JerseyPattern } from '@/components/jersey/jerseyUtils'

export type { JerseyPattern }

export type JerseyFormConfig = {
  home: {
    primaryColor: string
    secondaryColor: string
    jerseyPattern: JerseyPattern
  }
  away: {
    primaryColor: string
    secondaryColor: string
    jerseyPattern: JerseyPattern
  }
}

/** The kit a new team starts with in the editor. */
export const DEFAULT_JERSEY_FORM: JerseyFormConfig = {
  home: { primaryColor: '#1D4ED8', secondaryColor: '#ffffff', jerseyPattern: 'solid' },
  away: { primaryColor: '#ffffff', secondaryColor: '#1D4ED8', jerseyPattern: 'solid' },
}

export type Player = {
  id: string
  name: string
  position: string
  price: string
  photo?: string
  isSelected: boolean
  role?: 'player' | 'captain' | 'coach'
  status?: 'active' | 'injured' | 'suspended'
  jerseyNumber?: string | number
}

export type Team = {
  id: string
  name: string
  handle?: string
  playerCount: string
  logo: string
  competitionId?: string
  maxPlayers?: number
  homeJersey?: {
    primaryColor: string
    secondaryColor: string
    jerseyPattern: JerseyPattern
  }
  awayJersey?: {
    primaryColor: string
    secondaryColor: string
    jerseyPattern: JerseyPattern
  }
}

export type Group = {
  id: string
  name: string
  color: string
  teams: Team[]
}

export type OrganiseView = 'list' | 'create' | 'details' | 'share' | 'select_team'
