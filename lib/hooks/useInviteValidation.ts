'use client'

/**
 * useInviteValidation
 *
 * Shared hook that drives the invite-onboarding state machine for both
 * player and organisation flows.
 *
 * States
 * ──────
 *  loading  – validation in progress
 *  valid    – token OK, invite data available
 *  invalid  – token missing, malformed, or not found (404)
 *  expired  – token found but past expiry date (410)
 *  used     – token already consumed (400 / INVITE_ALREADY_USED)
 *
 * The hook is called once on mount and caches the result — no duplicate
 * network calls on re-renders.
 */

import { useEffect, useRef, useState } from 'react'
import { ApiError } from '@/lib/api'
import {
  validateInvite,
  type InviteType,
  type InviteValidateResponse,
} from '@/lib/services/invite.service'

export type InviteStatus = 'loading' | 'valid' | 'invalid' | 'expired' | 'used'

export type InviteValidationState =
  | { status: 'loading' }
  | { status: 'valid'; invite: InviteValidateResponse['invite'] }
  | { status: 'invalid'; message: string }
  | { status: 'expired'; message: string }
  | { status: 'used'; message: string }

export function useInviteValidation(
  token: string | undefined,
  type: InviteType,
): InviteValidationState {
  const [state, setState] = useState<InviteValidationState>({ status: 'loading' })
  // Prevent duplicate calls in React Strict Mode double-invoke
  const calledRef = useRef(false)

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    if (!token) {
      setState({
        status: 'invalid',
        message: 'No invite token was found in the link. Please check the URL and try again.',
      })
      return
    }

    validateInvite(token, type)
      .then((res) => setState({ status: 'valid', invite: res.invite }))
      .catch((err: unknown) => {
        if (err instanceof ApiError) {
          switch (err.status) {
            case 404:
              setState({
                status: 'invalid',
                message: 'This invite link is invalid or does not exist.',
              })
              return
            case 410:
              setState({
                status: 'expired',
                message: 'This invite link has expired. Please ask for a new one.',
              })
              return
            case 400:
              setState({
                status: 'used',
                message: 'This invite link has already been used.',
              })
              return
          }
        }
        // Catch-all (network error, 5xx, etc.)
        setState({
          status: 'invalid',
          message: 'Unable to validate this invite link. Please try again later.',
        })
      })
  }, [token, type])

  return state
}
