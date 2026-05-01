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

import { getVapidKey, subscribePush, unsubscribePush } from '@/lib/services/notifications.service'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'

export function usePushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const toast = useToastStore()

  const checkSubscription = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    setIsSubscribed(!!subscription)
  }, [])

  const subscribe = async () => {
    setIsPending(true)
    try {
      const { vapidPublicKey } = await getVapidKey()
      
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource
      })

      // Send to backend
      const p256dh = btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')!) as any))
      const auth = btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth')!) as any))

      await subscribePush({
        endpoint: subscription.endpoint,
        keys: { p256dh, auth }
      })

      setIsSubscribed(true)
      toast.addToast('Notifications enabled!', 'success')
    } catch (err) {
      toast.addToast(getErrorMessage(err), 'error')
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

  useEffect(() => {
    checkSubscription()
  }, [checkSubscription])

  const toggle = () => {
    if (isSubscribed) unsubscribe()
    else subscribe()
  }

  return { isSubscribed, isPending, toggle, subscribe, unsubscribe }
}
