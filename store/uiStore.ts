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

// hideNavbar/showNavbar are reference-counted rather than a plain toggle:
// nested callers (e.g. a player drawer opened on top of the onboarding gate)
// each hide independently, so one closing early doesn't reveal the navbar
// while an outer caller still wants it hidden.
let navbarHideCount = 0

export const useUIStore = create<UIState>((set) => ({
  isNavbarHidden: false,
  hideNavbar: () => {
    navbarHideCount += 1
    set({ isNavbarHidden: true })
  },
  showNavbar: () => {
    navbarHideCount = Math.max(0, navbarHideCount - 1)
    set({ isNavbarHidden: navbarHideCount > 0 })
  },

  activeCompetitionId: null,
  activeOrgId: null,
  setActiveCompetition: (competitionId, orgId) =>
    set({ activeCompetitionId: competitionId, activeOrgId: orgId }),
  clearActiveCompetition: () =>
    set({ activeCompetitionId: null, activeOrgId: null }),
}))
