import { create } from 'zustand'

export type NotifType = 'match' | 'transfer' | 'league' | 'tournament' | 'system'

export interface Notification {
  id: string
  title: string
  body: string
  message: string
  read: boolean
  createdAt: string
  timeAgo: string
  type: NotifType
}

interface NotifState {
  notifications: Notification[]
  unreadCount: number
  markRead: (id: string) => void
  markAllRead: () => void
  clearAll: () => void
}

export const useNotifStore = create<NotifState>((set) => ({
  notifications: [],
  unreadCount: 0,

  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}))
