'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { acceptCoachInvite, peekCoachInvite, pendingCoachToken } from '@/lib/services/coach.service'
import { useToast } from '@/store/toastStore'
import { getErrorMessage, getImageUrl } from '@/lib/api'

/** The page a coach invite link opens: who it is for, and one button to accept. */
export default function CoachJoinPage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const { addToast } = useToast()
  const [busy, setBusy] = useState(false)

  const invite = useQuery({ queryKey: ['coach-invite', token], queryFn: () => peekCoachInvite(token), retry: false })

  // Keep the token until it has been accepted, so a coach who still has to sign up can finish afterwards
  useEffect(() => { pendingCoachToken.set(token) }, [token])

  const accept = async () => {
    setBusy(true)
    try {
      await acceptCoachInvite(token)
      pendingCoachToken.clear()
      addToast('You are now the coach.', 'success')
      router.replace('/app/coach')
    } catch (e) {
      addToast(getErrorMessage(e), 'error')
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
          <button onClick={() => { pendingCoachToken.clear(); router.replace('/app/dashboard') }} className="mt-2 px-6 h-12 rounded-full border border-white/20 text-white font-bold text-sm">Go to the app</button>
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
            <li>Before each match, pick your starting lineup. We remind you an hour before kick-off.</li>
          </ul>
          <button onClick={accept} disabled={busy} className="w-full h-12 rounded-full bg-orange-500 text-black font-black text-sm disabled:opacity-50">
            {busy ? 'Joining…' : `Become coach of ${invite.data.teamName}`}
          </button>
          <p className="text-xs text-white/40">You keep your normal player account. Coach mode is a switch inside the app.</p>
        </div>
      )}
    </div>
  )
}
