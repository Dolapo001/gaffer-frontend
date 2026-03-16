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
  // UI
  selectedPlayerId: string | null
  selectedBoost: BoostType
  budget: number
  isSaved: boolean
  // Actions
  selectPlayer: (id: string | null) => void
  setBoost: (boost: BoostType) => void
  toggleCaptain: (id: string) => void
  saveTeam: () => void
  resetSaved: () => void
}

export const useFantasyStore = create<FantasyState>()(
  persist(
    (set, get) => ({
      players: SQUAD,
      selectedPlayerId: null,
      selectedBoost: null,
      budget: GAMEWEEK_INFO.budget,
      isSaved: false,

      selectPlayer: (id) =>
        set((state) => ({
          selectedPlayerId: state.selectedPlayerId === id ? null : id,
        })),

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

      saveTeam: () => set({ isSaved: true }),

      resetSaved: () => set({ isSaved: false }),
    }),
    {
      name: 'gaffer-fantasy-team',
      partialize: (state) => ({
        players: state.players,
        selectedBoost: state.selectedBoost,
        budget: state.budget,
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
