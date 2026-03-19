import { api } from '@/lib/api'

export interface UserProfile {
  _id: string
  email: string
  fullName: string | null
  username: string | null
  avatarUrl: string | null
  phone: string | null
  status: 'active' | 'pending' | 'suspended' | 'deleted'
  emailVerified: boolean
  phoneVerified: boolean
  lastLoginAt: string | null
  isPersonalActive: boolean
  isOrgActive: boolean
  lastRole: 'personal' | 'organization' | null
  createdAt: string
  updatedAt: string
}

export interface UpdateProfilePayload {
  fullName?: string
  username?: string
  avatarUrl?: string
  phone?: string
  isPersonalActive?: boolean
  isOrgActive?: boolean
  lastRole?: 'personal' | 'organization'
}

// GET /users — authenticated user's profile
export async function getProfile(): Promise<UserProfile> {
  return api.get<UserProfile>('/users')
}

// PUT /users — update profile
export async function updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  return api.put<UserProfile>('/users', payload)
}

// DELETE /users — soft-delete account
export async function deleteAccount(): Promise<{ message: string }> {
  return api.delete<{ message: string }>('/users')
}
