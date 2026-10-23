import { create } from 'zustand'

/** Who the signed-in person follows, as far as this screen knows. Shared so every Follow button agrees. */
interface FollowState {
  known: Record<string, boolean>
  set: (key: string, following: boolean) => void
  merge: (type: string, map: Record<string, boolean>) => void
}

export const followKey = (type: string, id: string) => `${type}:${id}`

export const useFollowStore = create<FollowState>((set) => ({
  known: {},
  set: (key, following) => set((s) => ({ known: { ...s.known, [key]: following } })),
  merge: (type, map) => set((s) => ({ known: { ...s.known, ...Object.fromEntries(Object.entries(map).map(([id, v]) => [followKey(type, id), v])) } })),
}))
