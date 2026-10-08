import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import {
  type FantasySquadPlayer,
  type BoostType,
} from '@/lib/fantasyMockData'
import {
  createFantasyTeam,
  setSquad,
  makeTransfer,
  getMyFantasyTeam,
  SQUAD_RULES,
} from '@/lib/services/fantasy.service'
import type { ChipType } from '@/lib/services/chip.service'

interface FantasyState {
  // Competition context
  competitionId: string | null

  // Squad
  players: FantasySquadPlayer[]
  selectedPlayerId: string | null
  substitutingOutId: string | null
  /** @deprecated superseded by real chip.service.ts data — see ChipStoreDrawer/ActiveChipBanner */
  selectedBoost: BoostType
  budget: number
  /** The single source of truth for the user's available bank balance, provided by the backend. */
  baseBankBalance: number
  /** Total squad budget for the active competition (from FantasySeason.squadBudget). Defaults to 100 until loaded. */
  squadBudget: number
  /** Chip currently active for the open gameweek, if any — drives the My Team active-chip banner. */
  activeChipType: ChipType | null
  isSaved: boolean
  isSaving: boolean
  saveError: string | null
  substituteError: string | null

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
  /** @deprecated superseded by real chip.service.ts data */
  setBoost: (boost: BoostType) => void
  setSquadBudget: (budget: number) => void
  setActiveChipType: (chipType: ChipType | null) => void
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
  setBaseBankBalance: (balance: number) => void
  adjustBudget: (delta: number) => void
  resetTeam: () => void
  /** Wipes all persisted fantasy state — called on logout / account switch. */
  clearUserData: () => void
}

/**
 * Captain and vice-captain have to be on the pitch. When a swap sends one of them to the bench the
 * armband moves on: a benched captain hands over to the vice-captain, and the save picks a new vice.
 * Without this the save was refused with "Captain must be in the starting XI" and the swap looked broken.
 */
export function withArmbandsOnPitch(players: FantasySquadPlayer[]): FantasySquadPlayer[] {
  const captain = players.find((p) => p.isCaptain)
  const vice = players.find((p) => p.isViceCaptain)
  const captainBenched = !!captain && !captain.isOnPitch
  const viceBenched = !!vice && !vice.isOnPitch
  if (!captainBenched && !viceBenched) return players
  return players.map((p) => {
    if (captainBenched && p.id === captain!.id) return { ...p, isCaptain: false }
    if (viceBenched && p.id === vice!.id) return { ...p, isViceCaptain: false }
    if (captainBenched && !viceBenched && vice && p.id === vice.id) return { ...p, isCaptain: true, isViceCaptain: false }
    return p
  })
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
      baseBankBalance: 100,
      squadBudget: 100,
      activeChipType: null,
      isSaved: false,
      isSaving: false,
      saveError: null,
      substituteError: null,
      hasSeenWelcome: false,
      hasCreatedTeam: false,
      hasOrganizedBench: false,
      hasNamedTeam: false,
      teamName: '',
      apiTeamId: null,
      totalPoints: 0,

      setCompetitionId: (id) => {
        const state = get()
        if (state.competitionId && state.competitionId !== id) {
          // If switching to a completely new competition, fully reset the store's
          // game state and onboarding flow so the user can start fresh for this league.
          set({
            competitionId: id,
            players: [],
            selectedPlayerId: null,
            substitutingOutId: null,
            selectedBoost: null,
            budget: 100,
            baseBankBalance: 100,
            squadBudget: 100,
            activeChipType: null,
            isSaved: false,
            isSaving: false,
            hasSeenWelcome: false,
            hasCreatedTeam: false,
            hasOrganizedBench: false,
            hasNamedTeam: false,
            teamName: '',
            apiTeamId: null,
            totalPoints: 0,
            saveError: null,
            substituteError: null,
          })
        } else {
          set({ competitionId: id })
        }
      },

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
              return { substitutingOutId: null, substituteError: 'Goalkeeper can only swap with another goalkeeper.' }
            }

            // Simulate the swap and check position min/max on the pitch
            const MIN: Record<string, number> = { GK: 1, DEF: 3, MID: 3, FWD: 1 }
            const MAX: Record<string, number> = { GK: 1, DEF: 5, MID: 5, FWD: 3 }

            const pitchAfter: Record<string, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 }
            newPlayers.forEach((p, i) => {
              let onPitch = p.isOnPitch
              if (i === p1Index) onPitch = p2.isOnPitch
              if (i === p2Index) onPitch = p1.isOnPitch
              if (onPitch) pitchAfter[p.position] = (pitchAfter[p.position] ?? 0) + 1
            })

            for (const pos of ['DEF', 'MID', 'FWD']) {
              const count = pitchAfter[pos] ?? 0
              if (count < MIN[pos]) {
                return { substitutingOutId: null, substituteError: `You need at least ${MIN[pos]} ${pos} on the pitch.` }
              }
              if (count > MAX[pos]) {
                return { substitutingOutId: null, substituteError: `You can have at most ${MAX[pos]} ${pos} on the pitch.` }
              }
            }

            const p1WasOnPitch = p1.isOnPitch
            const p2WasOnPitch = p2.isOnPitch

            newPlayers[p1Index] = { ...p1, isOnPitch: p2WasOnPitch }
            newPlayers[p2Index] = { ...p2, isOnPitch: p1WasOnPitch }

            return { players: withArmbandsOnPitch(newPlayers), substitutingOutId: null, substituteError: null }
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
          let captain = state.players.find((p) => p.isCaptain)
          let viceCaptain = state.players.find((p) => p.isViceCaptain)

          // Auto-assign captain and vice-captain by price if not set
          if (!captain || !viceCaptain) {
            const sorted = [...pitchPlayers].sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
            captain = captain ?? sorted[0]
            viceCaptain = viceCaptain ?? sorted.find((p) => p.id !== captain?.id)
            if (captain || viceCaptain) {
              set({
                players: state.players.map((p) => ({
                  ...p,
                  isCaptain: p.id === captain?.id,
                  isViceCaptain: p.id === viceCaptain?.id,
                })),
              })
            }
          }

          if (!captain || !viceCaptain) {
            throw new Error('Not enough players on pitch to assign captain and vice-captain')
          }

          // Backend requires GK at bench slot index 3 — sort outfield first, GK last
          const benchSorted = [
            ...benchPlayers.filter((p) => p.position !== 'GK'),
            ...benchPlayers.filter((p) => p.position === 'GK'),
          ]

          await setSquad(state.competitionId, {
            startingXI: pitchPlayers.map((p) => p.id),
            bench: benchSorted.map((p) => p.id),
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
        if (get().isSaving) return
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
      setBaseBankBalance: (balance) => set({ baseBankBalance: balance }),
      adjustBudget: (delta) => set((state) => ({ budget: Math.max(0, state.budget + delta) })),
      setSquadBudget: (budget) => set({ squadBudget: budget }),
      setActiveChipType: (chipType) => set({ activeChipType: chipType }),

      // squadBudget is season config (set by the competition layout), not team
      // state, so it is deliberately not reset here.
      resetTeam: () =>
        set({
          players: [],
          budget: 100,
          baseBankBalance: 100,
          activeChipType: null,
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

      clearUserData: () =>
        set({
          competitionId: null,
          players: [],
          selectedPlayerId: null,
          substitutingOutId: null,
          selectedBoost: null,
          budget: 100,
          baseBankBalance: 100,
          squadBudget: 100,
          activeChipType: null,
          isSaved: false,
          isSaving: false,
          saveError: null,
          substituteError: null,
          hasSeenWelcome: false,
          hasCreatedTeam: false,
          hasOrganizedBench: false,
          hasNamedTeam: false,
          teamName: '',
          apiTeamId: null,
          totalPoints: 0,
        }),
    }),
    {
      name: 'gaffer-fantasy-team',
      partialize: (state) => ({
        competitionId: state.competitionId,
        players: state.players,
        selectedBoost: state.selectedBoost,
        budget: state.budget,
        baseBankBalance: state.baseBankBalance,
        squadBudget: state.squadBudget,
        activeChipType: state.activeChipType,
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

export const selectRemainingBudget = (state: FantasyState) => {
  // If the user has completed onboarding, baseBankBalance is the single source of truth
  // and already accounts for the squad cost.
  if (state.apiTeamId || state.hasCreatedTeam) {
    return state.baseBankBalance ?? 0;
  }

  // During initial PickTeamOnboarding, we calculate the remaining budget by subtracting 
  // the cost of the currently selected squad from the starting budget.
  return Math.max(0, state.squadBudget - state.players.reduce((s, p) => s + (p.purchasePrice ?? p.price ?? 0), 0))
}

// ─── Memoised hooks (shallow-compare array results to prevent extra renders) ──

export const usePitchPlayers = () =>
  useFantasyStore(useShallow(selectPitchPlayers))

export const useBenchPlayers = () =>
  useFantasyStore(useShallow(selectBenchPlayers))

export { SQUAD_RULES }
