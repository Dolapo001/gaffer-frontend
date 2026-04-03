import { create } from 'zustand'

export type SportType = 'football' | 'basketball' | 'cricket' | 'tennis' | 'other'
export type TournamentFormat = 'league' | 'knockout' | 'group+knockout'

export interface Player {
  id: string
  name: string
  position: string
  jerseyNumber: number
  nationality: string
  age: number
  tournamentIds?: string[]
}

export interface Tournament {
  id: string
  name: string
  sport: string
  startDate: string
  endDate: string
  status: 'upcoming' | 'ongoing' | 'completed'
  participants: number
  maxParticipants: number
  registeredTeams: number
  maxTeams: number
  location: string
  description?: string
  format: string
  prizePool: string
  createdBy?: string
}

interface TournamentState {
  players: Player[]
  tournaments: Tournament[]
  isLoading: boolean
  error: string | null

  addPlayer: (player: Omit<Player, 'id'>) => void
  removePlayer: (id: string) => void
  setTournaments: (tournaments: Tournament[]) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addTournament: (tournament: any) => void
  updateTournament: (id: string, updates: Partial<Tournament>) => void
  removeTournament: (id: string) => void
  deleteTournament: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useTournamentStore = create<TournamentState>((set) => ({
  players: [],
  tournaments: [],
  isLoading: false,
  error: null,

  addPlayer: (player) =>
    set((state) => ({
      players: [...state.players, { ...player, id: crypto.randomUUID() }],
    })),

  removePlayer: (id) =>
    set((state) => ({ players: state.players.filter((p) => p.id !== id) })),

  setTournaments: (tournaments) => set({ tournaments }),

  addTournament: (tournament) =>
    set((state) => ({
      tournaments: [
        ...state.tournaments,
        {
          participants: 0,
          maxParticipants: tournament.maxTeams ?? 16,
          registeredTeams: 0,
          maxTeams: tournament.maxTeams ?? 16,
          prizePool: tournament.prizePool ?? '',
          ...tournament,
          id: crypto.randomUUID(),
        } as Tournament,
      ],
    })),

  updateTournament: (id, updates) =>
    set((state) => ({
      tournaments: state.tournaments.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  removeTournament: (id) =>
    set((state) => ({
      tournaments: state.tournaments.filter((t) => t.id !== id),
    })),

  // alias for removeTournament
  deleteTournament: (id) =>
    set((state) => ({
      tournaments: state.tournaments.filter((t) => t.id !== id),
    })),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}))
