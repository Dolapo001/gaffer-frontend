'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { acceptCoachInvite, peekCoachInvite, pendingCoachToken } from '@/lib/services/coach.service'
import { useToast } from '@/store/toastStore'
import { ApiError, getErrorMessage, getImageUrl } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { authUrlForInvite } from '@/lib/afterAuth'
import { isIOS, isStandalone } from '@/lib/pwa'

/** The page a coach invite link opens: who it is for, and one button to accept. */
export default function CoachJoinPage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const { addToast } = useToast()
  const [busy, setBusy] = useState(false)
  const [wrongEmail, setWrongEmail] = useState<string | null>(null)
  const signedIn = useAuthStore((st) => st.isAuthenticated)
  const myEmail = useAuthStore((st) => st.user?.email ?? null)

  // Opened in a browser tab (a shared link never opens the installed app on iPhone): everything is finished right here
  const [inBrowser, setInBrowser] = useState(false)
  useEffect(() => { setInBrowser(!isStandalone()) }, [])

  const invite = useQuery({ queryKey: ['coach-invite', token], queryFn: () => peekCoachInvite(token), retry: false })

  // Keep the token until it has been accepted, so a coach who still has to sign up can finish afterwards
  useEffect(() => { pendingCoachToken.set(token) }, [token])

  // A used, expired or withdrawn invite must not stay waiting: it would pull the next sign-in back to this dead page
  useEffect(() => { if (invite.isError) pendingCoachToken.clear() }, [invite.isError])

  const accept = async () => {
    setBusy(true)
    try {
      await acceptCoachInvite(token)
      pendingCoachToken.clear()
      addToast('You are now the coach.', 'success')
      router.replace('/coach')
    } catch (e) {
      if (e instanceof ApiError && e.code === 'INVITE_EMAIL_MISMATCH') setWrongEmail(e.message)
      else addToast(getErrorMessage(e), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#181928] flex flex-col items-center justify-center px-6 text-center">
      {invite.isLoading && <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-orange-500 animate-spin" aria-label="Loading" />}

      {invite.isError && (
        <div className="max-w-sm space-y-3">
          <h1 className="text-white text-xl font-black">This invite is not valid</h1>
          <p className="text-white/60 text-sm">{getErrorMessage(invite.error)}</p>
          {inBrowser ? (
            <p className="text-white/40 text-xs">Ask the organiser to send you a new invite link. You can close this page.</p>
          ) : (
            <button onClick={() => { pendingCoachToken.clear(); router.replace('/app/dashboard') }} className="mt-2 px-6 h-12 rounded-full border border-white/20 text-white font-bold text-sm">Go to the app</button>
          )}
        </div>
      )}

      {invite.data && (
        <div className="max-w-sm w-full space-y-5">
          <div className="w-24 h-24 mx-auto rounded-full bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center text-3xl font-black text-white">
            {invite.data.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getImageUrl(invite.data.logoUrl)} alt="" className="w-full h-full object-contain" />
            ) : invite.data.teamName[0]}
          </div>
          <div>
            <p className="text-white/50 text-sm">{invite.data.orgName ? `${invite.data.orgName} invited you` : 'You have been invited'}</p>
            <h1 className="text-white text-2xl font-black mt-1">Coach {invite.data.teamName}</h1>
          </div>
          <ul className="text-left text-sm text-white/70 space-y-2 bg-white/5 rounded-2xl p-4">
            <li>Send your players the recruitment link and watch your squad fill up.</li>
            <li>Confirm your squad when it is complete.</li>
            <li>Before each match, pick your starting lineup. We remind you from 3 hours before kick-off until it is in, and the match can&apos;t start without one.</li>
          </ul>
          {invite.data.emailHint && (
            <p className="text-sm text-white/60">This invite is for <span className="text-white font-semibold">{invite.data.emailHint}</span>.</p>
          )}
          {signedIn ? (
            <>
              {wrongEmail && <p role="alert" className="text-sm text-red-400">{wrongEmail}{myEmail ? ` You are signed in as ${myEmail}.` : ''}</p>}
              <button onClick={accept} disabled={busy} className="w-full h-12 rounded-full bg-orange-500 text-black font-black text-sm disabled:opacity-50">
                {busy ? 'Joining…' : `Become coach of ${invite.data.teamName}`}
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <button onClick={() => router.push(authUrlForInvite('/auth/login', `/coach/join/${token}`))} className="w-full h-12 rounded-full bg-orange-500 text-black font-black text-sm">I have a Gaffer account: sign in</button>
              <button onClick={() => router.push(authUrlForInvite('/auth/signup', `/coach/join/${token}`))} className="w-full h-12 rounded-full border border-white/20 text-white font-bold text-sm">I&apos;m new: create an account</button>
              <p className="text-xs text-white/40">{invite.data.emailHint ? 'Use the email address the invite was sent to. ' : ''}You come straight back here afterwards.</p>
            </div>
          )}
          {inBrowser && isIOS() && (
            <p className="text-xs text-white/50 rounded-xl bg-white/5 p-3">Opened in Safari: that is fine. Coaching works right here in your browser. Later, open the Gaffer app from your home screen and sign in with the same account to find coach mode in the menu.</p>
          )}
          <p className="text-xs text-white/40">If you already have a Gaffer account with this email, coaching is added to it. You can switch between your personal account and coach mode from the menu.</p>
        </div>
      )}
    </div>
  )
}
