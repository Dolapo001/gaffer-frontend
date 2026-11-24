'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { joinStaffLink, peekStaffLink, pendingStaffCode } from '@/lib/services/member.service'
import { updateProfile } from '@/lib/services/user.service'
import { activeOrg } from '@/lib/services/org.service'
import { useToast } from '@/store/toastStore'
import { getErrorMessage, getImageUrl } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { authUrlForInvite } from '@/lib/afterAuth'

const ROLE_TEXT: Record<string, string> = {
  admin: 'Admin: run everything, including the staff list',
  manager: 'Manager: run tournaments, teams, fixtures and live matches',
  staff: 'Staff: record lineups and match events',
  viewer: 'Viewer: see everything, change nothing',
}

/** The page a staff invite link opens: who invited you, then join (signing in or up first if needed). */
export default function StaffJoinPage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const { addToast } = useToast()
  const signedIn = useAuthStore((st) => st.isAuthenticated)
  const { setRole, updateUser } = useAuthStore()
  const [step, setStep] = useState<'invite' | 'account'>('invite')
  const [busy, setBusy] = useState(false)
  const autoTried = useRef(false)
  const qc = useQueryClient()

  const invite = useQuery({ queryKey: ['staff-link', code], queryFn: () => peekStaffLink(code), retry: false })

  const join = useCallback(async () => {
    setBusy(true)
    try {
      const res = await joinStaffLink(code)
      pendingStaffCode.clear()
      activeOrg.set(res.orgId)
      qc.removeQueries({ queryKey: ['orgs'] })
      updateUser({ isOrgActive: true, lastRole: 'organization' })
      setRole('organization')
      updateProfile({ lastRole: 'organization' }).catch(() => { /* the role is already set here */ })
      addToast(res.alreadyMember ? `You're already part of ${res.orgName}.` : `Welcome to ${res.orgName}.`, 'success')
      router.replace('/admin')
    } catch (e) {
      addToast(getErrorMessage(e), 'error')
      setBusy(false)
    }
  }, [code, router, addToast, setRole, updateUser, qc])

  // Back from signing in or up with this link waiting: join straight away
  useEffect(() => {
    if (!signedIn || !invite.data || autoTried.current) return
    if (pendingStaffCode.get() === code) { autoTried.current = true; join() }
  }, [signedIn, invite.data, code, join])

  const goAuth = (path: '/auth/login' | '/auth/signup') => {
    pendingStaffCode.set(code)
    // The invite is also named in the address, so it survives browsers that drop storage between pages
    router.push(authUrlForInvite(path, `/join/${code}`))
  }

  return (
    <div className="min-h-screen bg-[#181928] flex flex-col items-center justify-center px-6 py-10 text-center">
      {invite.isLoading && <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-orange-500 animate-spin" aria-label="Loading" />}

      {invite.isError && (
        <div className="max-w-sm space-y-3">
          <h1 className="text-white text-xl font-black">This invite link is not valid</h1>
          <p className="text-white/60 text-sm">{getErrorMessage(invite.error)}</p>
          <button onClick={() => { pendingStaffCode.clear(); router.replace(signedIn ? '/app/dashboard' : '/') }} className="mt-2 px-6 h-12 rounded-full border border-white/20 text-white font-bold text-sm">Go to Gaffer</button>
        </div>
      )}

      {invite.data && (
        <div className="max-w-sm w-full space-y-6">
          <div className="w-24 h-24 mx-auto rounded-full bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center text-3xl font-black text-white">
            {invite.data.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getImageUrl(invite.data.logoUrl)} alt="" className="w-full h-full object-cover" />
            ) : invite.data.orgName[0]}
          </div>

          {step === 'invite' && (
            <>
              <div className="space-y-2">
                <p className="text-white/50 text-sm">{invite.data.invitedBy ? `${invite.data.invitedBy} from ${invite.data.orgName} invited you` : `${invite.data.orgName} invited you`}</p>
                <h1 className="text-white text-2xl font-black leading-tight">Join the {invite.data.orgName} team on Gaffer</h1>
                <p className="text-white/60 text-sm">Help run their tournaments.</p>
              </div>
              <p className="text-sm text-white/70 bg-white/5 rounded-2xl p-4 text-left">{ROLE_TEXT[invite.data.role] || invite.data.role}</p>
              <button
                onClick={() => (signedIn ? join() : setStep('account'))}
                disabled={busy}
                className="w-full h-12 rounded-full bg-orange-500 text-black font-black text-sm disabled:opacity-50"
              >
                {busy ? 'Joining…' : 'Join'}
              </button>
              <p className="text-xs text-white/40">You keep your own Gaffer account. Switch between it and {invite.data.orgName} from the menu.</p>
            </>
          )}

          {step === 'account' && (
            <>
              <h1 className="text-white text-2xl font-black">Do you have a Gaffer account?</h1>
              <div className="space-y-3">
                <button onClick={() => goAuth('/auth/login')} className="w-full h-12 rounded-full bg-orange-500 text-black font-black text-sm">Yes, sign in</button>
                <button onClick={() => goAuth('/auth/signup')} className="w-full h-12 rounded-full border border-white/20 text-white font-bold text-sm">No, create one</button>
              </div>
              <p className="text-xs text-white/40">You come straight back here and join {invite.data.orgName}.</p>
              <button onClick={() => setStep('invite')} className="text-sm text-white/60 underline">Back</button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
