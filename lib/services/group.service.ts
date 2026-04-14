import { api, ApiError } from '@/lib/api'
import type { Team } from './team.service'

export interface Group {
  _id: string
  orgId: string
  name: string
  color: string
  teams: Team[]
  createdAt: string
  updatedAt: string
}

export interface CreateGroupPayload {
  name: string
  color?: string
  teams?: string[] // array of team IDs
}

// GET /orgs/:orgId/groups
// Some backends return 404 when no groups exist yet rather than an empty array.
// We normalise that to [] so callers never have to handle a 404 for an empty list.
export async function listGroups(orgId: string): Promise<Group[]> {
  try {
    const data = await api.get<{ groups: Group[] }>(`/orgs/${orgId}/groups`)
    return data.groups ?? []
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return []
    throw err
  }
}

// POST /orgs/:orgId/groups
export async function createGroup(orgId: string, payload: CreateGroupPayload): Promise<Group> {
  const data = await api.post<{ group: Group }>(`/orgs/${orgId}/groups`, payload)
  return data.group
}

// GET /groups/:groupId
export async function getGroup(groupId: string): Promise<Group> {
  const data = await api.get<{ group: Group }>(`/groups/${groupId}`)
  return data.group
}

// PATCH /groups/:groupId
export async function updateGroup(groupId: string, payload: Partial<CreateGroupPayload>): Promise<Group> {
  const data = await api.patch<{ group: Group }>(`/groups/${groupId}`, payload)
  return data.group
}

// DELETE /groups/:groupId
export async function deleteGroup(groupId: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/groups/${groupId}`)
}
