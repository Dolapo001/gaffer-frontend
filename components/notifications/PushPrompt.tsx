'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { BellRing } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { currentPushPermission, pushSupported, syncPushSubscription, usePushNotifications } from '@/hooks/usePushNotifications'

const DISMISSED_KEY = 'gaffer-push-prompt-dismissed'
const SYNCED_KEY = 'gaffer-push-synced-for'

const read = (store: Storage | undefined, key: string) => { try { return store?.getItem(key) ?? null } catch { return null } }
const write = (store: Storage | undefined, key: string, value: string) => { try { store?.setItem(key, value) } catch { /* private mode: fine */ } }

/**
 * Gets phones ready for goal alerts without anyone hunting for a hidden toggle.
 *  - Phone already allowed notifications: quietly makes sure this device is registered to the signed-in account.
 *  - Not asked yet: shows a small card above the bottom bar with an Enable button (the phone only shows its own
 *    permission box after a tap). "Not now" hides it for a week.
 */
export function PushPrompt() {
  const pathname = usePathname()
  const userId = useAuthStore((s) => s.user?.id)
  const { subscribe, isPending } = usePushNotifications()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!userId || !pushSupported()) return
    const permission = currentPushPermission()

    if (permission === 'granted') {
      // Once per sign-in on this device: re-tie the subscription to this account
      const key = `${userId}`
      if (read(window.sessionStorage, SYNCED_KEY) !== key) {
        syncPushSubscription().then(() => write(window.sessionStorage, SYNCED_KEY, key)).catch(() => {})
      }
      return
    }

    if (permission === 'default') {
      const until = Number(read(window.localStorage, DISMISSED_KEY) ?? 0)
      if (Date.now() > until) setShow(true)
    }
  }, [userId])

  if (!show || pathname.startsWith('/app/notifications')) return null

  const hide = (days: number) => {
    write(window.localStorage, DISMISSED_KEY, String(Date.now() + days * 86_400_000))
    setShow(false)
  }

  return (
    <div role="dialog" aria-label="Turn on goal alerts" className="fixed left-4 right-4 bottom-24 z-40 rounded-2xl bg-[#1E2032] border border-gaffer-orange/30 shadow-2xl p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-gaffer-orange/20 flex items-center justify-center shrink-0">
        <BellRing className="text-gaffer-orange" size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-bold">Get goal alerts for your league</p>
        <p className="text-white/50 text-xs mt-0.5">Goals, kick-offs and results, even when the app is closed.</p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={async () => { if (await subscribe()) setShow(false); else hide(1) }}
            disabled={isPending}
            className="px-4 h-9 rounded-xl bg-gaffer-orange text-white text-xs font-black uppercase tracking-widest disabled:opacity-60"
          >
            {isPending ? 'Turning on…' : 'Turn on'}
          </button>
          <button onClick={() => hide(7)} className="px-4 h-9 rounded-xl text-white/60 text-xs font-bold">Not now</button>
        </div>
      </div>
    </div>
  )
}
