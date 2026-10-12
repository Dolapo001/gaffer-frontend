'use client'

import { useState, useCallback, useEffect } from 'react'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i)
  }
  return output
}

import { getVapidKey, subscribePush, unsubscribePush, sendTestPush } from '@/lib/services/notifications.service'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'

export type PushPermission = NotificationPermission | 'unsupported'

export function pushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function currentPushPermission(): PushPermission {
  return pushSupported() ? Notification.permission : 'unsupported'
}

/** Tells the server about this device's subscription (it is tied to whoever is signed in on it). */
async function register(subscription: PushSubscription) {
  const p256dh = btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')!) as any))
  const auth = btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth')!) as any))
  await subscribePush({ endpoint: subscription.endpoint, keys: { p256dh, auth } })
}

/**
 * When the phone has already allowed notifications, make sure this device is subscribed and registered to the account
 * that is signed in now. Never asks the user anything. Returns whether the device ends up subscribed.
 */
export async function syncPushSubscription(): Promise<boolean> {
  if (!pushSupported() || Notification.permission !== 'granted') return false
  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    const { vapidPublicKey } = await getVapidKey()
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    })
  }
  await register(subscription)
  return true
}

export function usePushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [permission, setPermission] = useState<PushPermission>('default')
  const toast = useToastStore()

  const checkSubscription = useCallback(async () => {
    setPermission(currentPushPermission())
    if (!pushSupported()) return

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    setIsSubscribed(!!subscription)
  }, [])

  const subscribe = async (): Promise<boolean> => {
    setIsPending(true)
    try {
      if (!pushSupported()) {
        toast.addToast('This browser cannot receive alerts. Open the installed Gaffer app on your phone.', 'error')
        return false
      }
      // Asks the phone for permission (must come from a tap)
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result !== 'granted') {
        toast.addToast('Alerts are blocked. Allow notifications for Gaffer in your phone settings, then try again.', 'error')
        return false
      }

      const { vapidPublicKey } = await getVapidKey()
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource
      })
      await register(subscription)

      setIsSubscribed(true)
      toast.addToast('Notifications enabled!', 'success')
      return true
    } catch (err) {
      toast.addToast(getErrorMessage(err), 'error')
      return false
    } finally {
      setIsPending(false)
    }
  }

  const unsubscribe = async () => {
    setIsPending(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
        await unsubscribePush(subscription.endpoint)
      }

      setIsSubscribed(false)
      toast.addToast('Notifications disabled.', 'info')
    } catch (err) {
      toast.addToast(getErrorMessage(err), 'error')
    } finally {
      setIsPending(false)
    }
  }

  /** Sends a test notification to this account's devices and says what happened. */
  const sendTest = async () => {
    setIsPending(true)
    try {
      await syncPushSubscription().catch(() => false)
      const { devices, delivered } = await sendTestPush()
      if (!devices) toast.addToast('No device is set up for alerts yet. Turn alerts on first.', 'error')
      else if (!delivered) toast.addToast('We could not reach your phone. Turn alerts off and on again.', 'error')
      else toast.addToast('Test sent. It should appear on your phone in a moment.', 'success')
    } catch (err) {
      toast.addToast(getErrorMessage(err), 'error')
    } finally {
      setIsPending(false)
    }
  }

  useEffect(() => {
    checkSubscription()
  }, [checkSubscription])

  const toggle = () => {
    if (isSubscribed) unsubscribe()
    else subscribe()
  }

  return { isSubscribed, isPending, permission, toggle, subscribe, unsubscribe, sendTest }
}
