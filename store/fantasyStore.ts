import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import {
  SQUAD,
  GAMEWEEK_INFO,
  type FantasySquadPlayer,
  type BoostType,
} from '@/lib/fantasyMockData'
import {
  createFantasyTeam,
  setSquad,
  makeTransfer,
  activateChip,
  getMyFantasyTeam,
  SQUAD_RULES,
} from '@/lib/services/fantasy.service'

interface FantasyState {
  // Competition context
  competitionId: string | null

  // Squad
  players: FantasySquadPlayer[]
  selectedPlayerId: string | null
  substitutingOutId: string | null
  selectedBoost: BoostType
  budget: number
  isSaved: boolean
  isSaving: boolean
  saveError: string | null

  // Onboarding flow flags
  hasSeenWelcome: boolean
  hasCreatedTeam: boolean
  hasOrganizedBench: boolean
  hasNamedTeam: boolean
  teamName: string

  // API team data
  apiTeamId: string | null
  totalPoints: number

  // Actions
  setCompetitionId: (id: string | null) => void
  selectPlayer: (id: string | null) => void
  setSubstitutingOutId: (id: string | null) => void
  setBoost: (boost: BoostType) => void
  toggleCaptain: (id: string) => void
  performSubstitution: (id1: string, id2: string) => void
  saveTeam: () => void
  saveTeamToApi: () => Promise<void>
  createTeamOnApi: (name: string) => Promise<void>
  resetSaved: () => void
  setHasSeenWelcome: (val: boolean) => void
  setHasCreatedTeam: (val: boolean) => void
  setHasOrganizedBench: (val: boolean) => void
  setHasNamedTeam: (val: boolean) => void
  setTeamName: (name: string) => void
  setPlayers: (players: FantasySquadPlayer[]) => void
  resetTeam: () => void
}

export const useFantasyStore = create<FantasyState>()(
  persist(
    (set, get) => ({
      competitionId: null,
      players: [],
      selectedPlayerId: null,
      substitutingOutId: null,
      selectedBoost: null,
      budget: 100,
      isSaved: false,
      isSaving: false,
      saveError: null,
      hasSeenWelcome: false,
      hasCreatedTeam: false,
      hasOrganizedBench: false,
      hasNamedTeam: false,
      teamName: '',
      apiTeamId: null,
      totalPoints: 0,

      setCompetitionId: (id) => set({ competitionId: id }),

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

            // GK can only swap with GK
            if ((p1.position === 'GK') !== (p2.position === 'GK')) {
              console.warn('Cannot swap Goalkeeper with a field player.')
              return { substitutingOutId: null }
            }

            const p1WasOnPitch = p1.isOnPitch
            const p2WasOnPitch = p2.isOnPitch

            newPlayers[p1Index] = { ...p1, isOnPitch: p2WasOnPitch }
            newPlayers[p2Index] = { ...p2, isOnPitch: p1WasOnPitch }

            return { players: newPlayers, substitutingOutId: null }
          }
          return state
        }),

      // Local save (marks isSaved)
      saveTeam: () => set({ isSaved: true }),

      // API save — PUT /fantasy/:competitionId/team/squad
      saveTeamToApi: async () => {
        const state = get()
        if (!state.competitionId) {
          set({ saveError: 'No competition selected' })
          return
        }
        set({ isSaving: true, saveError: null })
        try {
          const pitchPlayers = state.players.filter((p) => p.isOnPitch)
          const benchPlayers = state.players.filter((p) => !p.isOnPitch)
          const captain = state.players.find((p) => p.isCaptain)
          const viceCaptain = state.players.find((p) => p.isViceCaptain)

          if (!captain || !viceCaptain) {
            throw new Error('Please select a captain and vice-captain before saving')
          }

          await setSquad(state.competitionId, {
            startingXI: pitchPlayers.map((p) => p.id),
            bench: benchPlayers.map((p) => p.id),
            captainId: captain.id,
            viceCaptainId: viceCaptain.id,
          })

          set({ isSaved: true })
        } catch (err: any) {
          set({ saveError: err?.message ?? 'Failed to save team' })
          throw err
        } finally {
          set({ isSaving: false })
        }
      },

      // Create team on API — POST /fantasy/:competitionId/team
      createTeamOnApi: async (name: string) => {
        const state = get()
        if (!state.competitionId) {
          // No competition context — save name locally only
          set({ teamName: name, hasNamedTeam: true })
          return
        }
        set({ isSaving: true, saveError: null })
        try {
          const team = await createFantasyTeam(state.competitionId, name)
          set({ apiTeamId: team._id, teamName: name, hasNamedTeam: true })
        } catch (err: any) {
          // If team already exists, still proceed locally
          if (err?.code === 'TEAM_EXISTS') {
            set({ teamName: name, hasNamedTeam: true })
            return
          }
          set({ saveError: err?.message ?? 'Failed to create team' })
          throw err
        } finally {
          set({ isSaving: false })
        }
      },

      resetSaved: () => set({ isSaved: false }),

      setHasSeenWelcome: (val) => set({ hasSeenWelcome: val }),
      setHasCreatedTeam: (val) => set({ hasCreatedTeam: val }),
      setHasOrganizedBench: (val) => set({ hasOrganizedBench: val }),
      setHasNamedTeam: (val) => set({ hasNamedTeam: val }),
      setTeamName: (name) => set({ teamName: name }),
      setPlayers: (players) => set({ players }),

      resetTeam: () =>
        set({
          players: [],
          budget: 100,
          isSaved: false,
          hasSeenWelcome: true,
          hasCreatedTeam: false,
          hasOrganizedBench: false,
          hasNamedTeam: false,
          teamName: '',
          apiTeamId: null,
          totalPoints: 0,
          saveError: null,
        }),
    }),
    {
      name: 'gaffer-fantasy-team',
      partialize: (state) => ({
        competitionId: state.competitionId,
        players: state.players,
        selectedBoost: state.selectedBoost,
        budget: state.budget,
        substitutingOutId: state.substitutingOutId,
        hasSeenWelcome: state.hasSeenWelcome,
        hasCreatedTeam: state.hasCreatedTeam,
        hasOrganizedBench: state.hasOrganizedBench,
        hasNamedTeam: state.hasNamedTeam,
        teamName: state.teamName,
        apiTeamId: state.apiTeamId,
        totalPoints: state.totalPoints,
      }),
    },
  ),
)

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectPitchPlayers = (state: FantasyState) =>
  state.players.filter((p) => p.isOnPitch)

export const selectBenchPlayers = (state: FantasyState) =>
  state.players.filter((p) => !p.isOnPitch)

export const selectPlayerById = (id: string | null) => (state: FantasyState) =>
  id ? state.players.find((p) => p.id === id) ?? null : null

// ─── Memoised hooks (shallow-compare array results to prevent extra renders) ──

export const usePitchPlayers = () =>
  useFantasyStore(useShallow(selectPitchPlayers))

export const useBenchPlayers = () =>
  useFantasyStore(useShallow(selectBenchPlayers))

export { SQUAD_RULES }
