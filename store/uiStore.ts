import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  isNavbarHidden: boolean
  hideNavbar: () => void
  showNavbar: () => void

  /** The competition the user is currently "inside" — drives contextual nav + news feed */
  activeCompetitionId: string | null
  /** The org that owns the active competition — used to fetch org-scoped news */
  activeOrgId: string | null
  setActiveCompetition: (competitionId: string, orgId: string) => void
  clearActiveCompetition: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isNavbarHidden: false,
      hideNavbar: () => set({ isNavbarHidden: true }),
      showNavbar: () => set({ isNavbarHidden: false }),

      activeCompetitionId: null,
      activeOrgId: null,
      setActiveCompetition: (competitionId, orgId) =>
        set({ activeCompetitionId: competitionId, activeOrgId: orgId }),
      clearActiveCompetition: () =>
        set({ activeCompetitionId: null, activeOrgId: null }),
    }),
    {
      name: 'gaffer-ui',
      // Only persist the competition context — isNavbarHidden is transient UI state
      partialize: (state) => ({
        activeCompetitionId: state.activeCompetitionId,
        activeOrgId: state.activeOrgId,
      }),
    },
  ),
)
