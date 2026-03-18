import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  SQUAD,
  GAMEWEEK_INFO,
  type FantasySquadPlayer,
  type BoostType,
} from '@/lib/fantasyMockData'

interface FantasyState {
  // Squad
  players: FantasySquadPlayer[]
  selectedPlayerId: string | null
  substitutingOutId: string | null
  selectedBoost: BoostType
  budget: number
  isSaved: boolean
  hasSeenWelcome: boolean
  hasCreatedTeam: boolean
  hasOrganizedBench: boolean
  hasNamedTeam: boolean
  teamName: string
  // Actions
  selectPlayer: (id: string | null) => void
  setSubstitutingOutId: (id: string | null) => void
  setBoost: (boost: BoostType) => void
  toggleCaptain: (id: string) => void
  performSubstitution: (id1: string, id2: string) => void
  saveTeam: () => void
  resetSaved: () => void
  setHasSeenWelcome: (val: boolean) => void
  setHasCreatedTeam: (val: boolean) => void
  setHasOrganizedBench: (val: boolean) => void
  setHasNamedTeam: (val: boolean) => void
  setTeamName: (name: string) => void
  resetTeam: () => void
}

export const useFantasyStore = create<FantasyState>()(
  persist(
    (set, get) => ({
      players: SQUAD,
      selectedPlayerId: null,
      substitutingOutId: null,
      selectedBoost: null,
      budget: GAMEWEEK_INFO.budget,
      isSaved: false,
      hasSeenWelcome: false,
      hasCreatedTeam: false,
      hasOrganizedBench: false,
      hasNamedTeam: false,
      teamName: '',

      selectPlayer: (id) =>
        set((state) => ({
          selectedPlayerId: state.selectedPlayerId === id ? null : id,
        })),

      setSubstitutingOutId: (id) => set({ substitutingOutId: id }),

      setBoost: (boost) =>
        set((state) => ({
          selectedBoost: state.selectedBoost === boost ? null : boost,
        })),

      toggleCaptain: (id) =>
        set((state) => ({
          players: state.players.map((p) => ({
            ...p,
            isCaptain: p.id === id ? !p.isCaptain : false,
          })),
        })),

      performSubstitution: (id1, id2) =>
        set((state) => {
          const newPlayers = [...state.players]
          const p1Index = newPlayers.findIndex((p) => p.id === id1)
          const p2Index = newPlayers.findIndex((p) => p.id === id2)

          if (p1Index > -1 && p2Index > -1) {
            const p1 = newPlayers[p1Index]
            const p2 = newPlayers[p2Index]

            // FPL Rules: GK can ONLY swap with GK. Field players swap with field players.
            const p1IsGK = p1.position === 'GK'
            const p2IsGK = p2.position === 'GK'

            if (p1IsGK !== p2IsGK) {
              console.warn('Cannot swap Goalkeeper with a field player.')
              return { substitutingOutId: null }
            }

            const p1WasOnPitch = p1.isOnPitch
            const p2WasOnPitch = p2.isOnPitch

            // Swap their pitch status
            newPlayers[p1Index] = { ...p1, isOnPitch: p2WasOnPitch }
            newPlayers[p2Index] = { ...p2, isOnPitch: p1WasOnPitch }

            // Clear substitution mode since we completed the action
            return { players: newPlayers, substitutingOutId: null }
          }
          return state
        }),

      saveTeam: () => set({ isSaved: true }),

      resetSaved: () => set({ isSaved: false }),

      setHasSeenWelcome: (val) => set({ hasSeenWelcome: val }),
      setHasCreatedTeam: (val) => set({ hasCreatedTeam: val }),
      setHasOrganizedBench: (val) => set({ hasOrganizedBench: val }),
      setHasNamedTeam: (val) => set({ hasNamedTeam: val }),
      setTeamName: (name) => set({ teamName: name }),

      resetTeam: () => set({ 
        players: SQUAD, 
        budget: GAMEWEEK_INFO.budget, 
        isSaved: false, 
        hasSeenWelcome: false,
        hasCreatedTeam: false,
        hasOrganizedBench: false,
        hasNamedTeam: false,
        teamName: '' 
      }),
    }),
    {
      name: 'gaffer-fantasy-team',
      partialize: (state) => ({
        players: state.players,
        selectedBoost: state.selectedBoost,
        budget: state.budget,
        substitutingOutId: state.substitutingOutId,
        hasSeenWelcome: state.hasSeenWelcome,
        hasCreatedTeam: state.hasCreatedTeam,
        hasOrganizedBench: state.hasOrganizedBench,
        hasNamedTeam: state.hasNamedTeam,
        teamName: state.teamName,
      }),
    }
  )
)

// ─── Selectors ───────────────────────────────────────────────────────────────

export const selectPitchPlayers = (state: FantasyState) =>
  state.players.filter((p) => p.isOnPitch)

export const selectBenchPlayers = (state: FantasyState) =>
  state.players.filter((p) => !p.isOnPitch)

export const selectPlayerById = (id: string | null) => (state: FantasyState) =>
  id ? state.players.find((p) => p.id === id) ?? null : null
