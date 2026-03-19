import { create } from 'zustand'

interface UIState {
  isNavbarHidden: boolean
  hideNavbar: () => void
  showNavbar: () => void
}

export const useUIStore = create<UIState>((set) => ({
  isNavbarHidden: false,
  hideNavbar: () => set({ isNavbarHidden: true }),
  showNavbar: () => set({ isNavbarHidden: false }),
}))
