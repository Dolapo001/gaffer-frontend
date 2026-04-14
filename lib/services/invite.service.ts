/**
 * invite.service.ts
 *
 * Unified invite validation + acceptance for both player and organisation
 * onboarding flows.
 *
 * Endpoint contract (spec-driven):
 *   POST /invite/validate  { token, type }
 *   POST /invite/accept    { token, type, payload }
 *
 * Both endpoints are public (no auth token required).
 */

import { api } from '@/lib/api'

export type InviteType = 'player' | 'organization'

// ── Validate ─────────────────────────────────────────────────────────────────

export interface InviteValidateResponse {
  invite: {
    _id: string
    email: string
    /** Present on player invites */
    teamId?: string
    teamName?: string
    /** Present on organisation invites */
    orgId?: string
    orgName?: string
    role?: string
    [key: string]: unknown
  }
}

export async function validateInvite(
  token: string,
  type: InviteType,
): Promise<InviteValidateResponse> {
  return api.post<InviteValidateResponse>(
    '/invite/validate',
    { token, type },
    { public: true },
  )
}

// ── Accept ────────────────────────────────────────────────────────────────────

export async function acceptInvite(
  token: string,
  type: InviteType,
  payload: Record<string, unknown>,
): Promise<{ message: string }> {
  return api.post<{ message: string }>(
    '/invite/accept',
    { token, type, payload },
    { public: true },
  )
}
