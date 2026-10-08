'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function HqLoginPage() {
  const router = useRouter()
  const { login, logout } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(email.trim(), password)
      if (useAuthStore.getState().user?.platformRole !== 'platform_admin') {
        // A normal account logged in: it has no business here, so drop the session instead of leaving it half signed in.
        await logout()
        setError('This account does not have HQ access.')
        return
      }
      router.replace('/hq')
    } catch {
      setError('Email or password is not right.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gaffer-bg flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-gaffer-surface border border-gaffer-border rounded-3xl p-6 space-y-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-white">GAFFER HQ</h1>
          <p className="text-gaffer-muted font-body text-sm mt-1">Sign in with your HQ account.</p>
        </div>
        <label className="block">
          <span className="text-sm font-body text-gaffer-muted">Email</span>
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl bg-gaffer-bg border border-gaffer-border px-3 py-2 text-white font-body"
          />
        </label>
        <label className="block">
          <span className="text-sm font-body text-gaffer-muted">Password</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl bg-gaffer-bg border border-gaffer-border px-3 py-2 text-white font-body"
          />
        </label>
        {error && (
          <p role="alert" className="text-sm font-body text-red-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-gaffer-orange py-3 font-display font-bold text-black disabled:opacity-60"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
