/**
 * recruitment.service.ts
 *
 * Public recruitment-link validation + submission.
 *
 * Endpoint contract:
 *   GET  /recruitment/link/:token  → { link: { teamName, teamId, expiresAt, ... } }
 *   POST /recruitment/submit       → { message }
 *
 * Both are public — no auth token required.
 */

import { api } from '@/lib/api'

// ── Validate ─────────────────────────────────────────────────────────────────

export interface RecruitmentLink {
  token: string
  teamId: string
  teamName: string
  expiresAt?: string
  [key: string]: unknown
}

export interface RecruitmentValidateResponse {
  link: RecruitmentLink
}

export async function validateRecruitmentLink(
  token: string,
): Promise<RecruitmentValidateResponse> {
  return api.get<RecruitmentValidateResponse>(`/recruitment/link/${token}`, {
    public: true,
  })
}

// ── Submit ────────────────────────────────────────────────────────────────────

export interface RecruitmentPayload {
  token: string
  firstName: string
  lastName: string
  age: number
  position: string
  phone?: string
  email?: string
  jerseyNumber?: number
}

export async function submitRecruitment(
  payload: RecruitmentPayload,
): Promise<{ message: string }> {
  return api.post<{ message: string }>('/recruitment/submit', payload, {
    public: true,
  })
}
