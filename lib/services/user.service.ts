import { api } from '@/lib/api'

export interface UserProfile {
  _id: string
  email: string
  fullName: string | null
  /** The name the person asked to be called */
  displayName?: string | null
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
  displayName?: string
  username?: string
  avatarUrl?: string
  phone?: string
  isPersonalActive?: boolean
  isOrgActive?: boolean
  lastRole?: 'personal' | 'organization'
}

// GET /users — authenticated user's profile
export async function getProfile(): Promise<UserProfile> {
  // The server wraps the profile as { user }; the update call returns it bare
  const r = await api.get<UserProfile | { user: UserProfile }>('/users')
  return 'user' in r && r.user ? r.user : (r as UserProfile)
}

// PUT /users — update profile
export async function updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  return api.put<UserProfile>('/users', payload)
}

// DELETE /users — soft-delete account
export async function deleteAccount(): Promise<{ message: string }> {
  return api.delete<{ message: string }>('/users')
}

// PATCH /users/avatar — upload avatar via Cloudinary
export async function uploadAvatar(file: File): Promise<{ success: boolean; data: { imageUrl: string; publicId: string } }> {
  const formData = new FormData()
  formData.append('file', file)
  return api.patch('/users/avatar', formData)
}
