import { create } from 'zustand'

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

export const useUIStore = create<UIState>((set) => ({
  isNavbarHidden: false,
  hideNavbar: () => set({ isNavbarHidden: true }),
  showNavbar: () => set({ isNavbarHidden: false }),

  activeCompetitionId: null,
  activeOrgId: null,
  setActiveCompetition: (competitionId, orgId) =>
    set({ activeCompetitionId: competitionId, activeOrgId: orgId }),
  clearActiveCompetition: () =>
    set({ activeCompetitionId: null, activeOrgId: null }),
}))
