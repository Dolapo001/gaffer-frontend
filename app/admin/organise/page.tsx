'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Plus, Menu } from 'lucide-react'
import { BrowserProtection } from '@/components/BrowserProtection'
import { OrganiseList } from './components/OrganiseList'
import { OrganiseCreateSheet } from './components/OrganiseCreateSheet'
import { OrganiseDetails } from './components/OrganiseDetails'
import { OrganiseShare } from './components/OrganiseShare'
import { OrganiseSelectTeam } from './components/OrganiseSelectTeam'
import type { Team, Group, Player, OrganiseView } from './types'

import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listTeams, createTeam, Team as BackendTeam } from '@/lib/services/team.service'
import { listOrgs } from '@/lib/services/org.service'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/store/toastStore'
const INITIAL_GROUPS: Group[] = [
  {
    id: '1',
    name: 'GROUP A',
    color: '#A855F7',
    teams: [],
  },
]

const INITIAL_PLAYERS: Player[] = [
  { id: '1', name: 'Olaniyi Ojedokun', position: 'THE GAFFER', price: '7.5M', isSelected: true },
  { id: '2', name: 'Ayomide Lawal', position: 'Goalkeeper', price: '7.5M', isSelected: false },
]

export default function OrganizePage() {
  const { user } = useAuthStore()
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'Teams' | 'Groups'>('Teams')
  const [view, setView] = useState<OrganiseView>('list')
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)

  // 1. Fetch Organization
  const { data: orgs, isLoading: isLoadingOrgs } = useQuery({
    queryKey: ['orgs'],
    queryFn: listOrgs,
    enabled: !!user
  })

  const orgId = orgs?.[0]?._id

  // 2. Fetch Teams
  const { data: backendTeams, isLoading: isLoadingTeams } = useQuery({
    queryKey: ['teams', orgId],
    queryFn: () => listTeams(orgId!),
    enabled: !!orgId
  })

  // Local state for UI components (Groups/Players currently mostly local)
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS)
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS)

  // Create form state
  const [teamName, setTeamName] = useState('')
  const [maxPlayers, setMaxPlayers] = useState('11')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState('#A855F7')
  const [selectedTeamsForGroup, setSelectedTeamsForGroup] = useState<string[]>([])

  // Map backend teams to UI teams
  const teams: Team[] = backendTeams?.map(t => ({
    id: t._id,
    name: t.name,
    playerCount: '0/22', // Backend doesn't return count directly yet
    logo: t.logoUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + t.name,
  })) || []

  // Mutate: Create Team
  const createTeamMutation = useMutation({
    mutationFn: (payload: any) => createTeam(orgId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', orgId] })
      addToast('Team created successfully!', 'success')
      setView('list')
      setTeamName('')
      setLogoPreview(null)
    },
    onError: (err: any) => {
      addToast(err?.message || 'Failed to create team', 'error')
    }
  })

  const isCreateOpen = view === 'create'

  const getUnassignedTeams = () => {
    const assignedIds = new Set(groups.flatMap((g) => g.teams.map((t) => t.id)))
    return teams.filter((t) => !assignedIds.has(t.id))
  }

  const handleCreate = () => {
    if (!teamName || !orgId) return

    if (activeTab === 'Teams') {
      createTeamMutation.mutate({
        name: teamName,
        handle: teamName.toLowerCase().replace(/\s+/g, '-'),
        sport: 'Football',
        logoUrl: logoPreview || undefined
      })
    } else {
      const selectedTeamObjects = teams.filter((t) => selectedTeamsForGroup.includes(t.id))
      const newGroup: Group = {
        id: crypto.randomUUID(),
        name: teamName,
        color: selectedColor,
        teams: selectedTeamObjects,
      }
      setGroups((prev) => [...prev, newGroup])
      setSelectedGroup(newGroup)
      setSelectedTeam(null)
      setView('details')
      setTeamName('')
      setSelectedTeamsForGroup([])
    }
  }

  const handleTogglePlayer = (id: string) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, isSelected: !p.isSelected } : p)))
  }

  const handlePriceChange = (id: string, increment: boolean) => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const current = parseFloat(p.price) || 7.5
        const next = Math.max(0.5, current + (increment ? 0.5 : -0.5))
        return { ...p, price: `${next.toFixed(1)}M` }
      }),
    )
  }

  const handleAddTeamToGroup = (team: Team) => {
    if (!selectedGroup) return
    setGroups((prev) =>
      prev.map((g) =>
        g.id === selectedGroup.id ? { ...g, teams: [...g.teams, team] } : g,
      ),
    )
    setSelectedGroup((prev) => (prev ? { ...prev, teams: [...prev.teams, team] } : null))
    setView('list')
  }

  if (isLoadingOrgs || isLoadingTeams) {
    return (
      <div className="min-h-screen bg-[#181928] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/10 border-t-orange-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <BrowserProtection>
      <div
        className="fixed inset-0 bg-[#181928] text-white flex flex-col font-inter overflow-hidden pb-4"
        data-nav-hidden={isCreateOpen ? 'true' : undefined}
      >
        {/* Header */}
        <div className="flex items-center px-6 pt-12 pb-4 text-white border-b border-white/10 shrink-0">
          <button
            aria-label="Go back"
            onClick={() => (view !== 'list' ? setView('list') : undefined)}
            className="mr-4 hover:opacity-70 transition-opacity"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-semibold tracking-tight">Organize</h1>
        </div>

        <div className="flex-1 relative">
          <AnimatePresence mode="wait">
            {view === 'list' && (
              <OrganiseList
                activeTab={activeTab}
                teams={teams}
                groups={groups}
                onTabChange={setActiveTab}
                onTeamClick={(team) => {
                  setSelectedTeam(team)
                  setSelectedGroup(null)
                  setView('details')
                }}
                onGroupClick={(group) => {
                  setSelectedGroup(group)
                  setSelectedTeam(null)
                  setView('details')
                }}
                onAddTeamsToGroup={(group) => {
                  setSelectedGroup(group)
                  setView('select_team')
                }}
              />
            )}

            {view === 'create' && (
              <OrganiseCreateSheet
                activeTab={activeTab}
                teams={teams}
                teamName={teamName}
                maxPlayers={maxPlayers}
                logoPreview={logoPreview}
                logoError={logoError}
                selectedColor={selectedColor}
                selectedTeamsForGroup={selectedTeamsForGroup}
                onClose={() => setView('list')}
                onTeamNameChange={setTeamName}
                onMaxPlayersChange={setMaxPlayers}
                onLogoChange={(preview, error) => {
                  setLogoPreview(preview)
                  setLogoError(error)
                }}
                onColorChange={setSelectedColor}
                onToggleTeamForGroup={(id) =>
                  setSelectedTeamsForGroup((prev) =>
                    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
                  )
                }
                onCreate={handleCreate}
                getUnassignedTeams={getUnassignedTeams}
              />
            )}

            {view === 'details' && (
              <OrganiseDetails
                selectedTeam={selectedTeam}
                selectedGroup={selectedGroup}
                players={players}
                onBack={() => setView('list')}
                onShare={() => setView('share')}
                onAddTeams={() => setView('select_team')}
                onTogglePlayer={handleTogglePlayer}
                onPriceChange={handlePriceChange}
              />
            )}

            {view === 'share' && (
              <OrganiseShare
                selectedTeam={selectedTeam}
                selectedGroup={selectedGroup}
                logoPreview={logoPreview}
                onBack={() => setView('list')}
              />
            )}

            {view === 'select_team' && (
              <OrganiseSelectTeam
                selectedGroup={selectedGroup}
                teams={teams}
                onBack={() => setView('list')}
                onAddTeam={handleAddTeamToGroup}
                onCreateNew={() => setView('create')}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Floating Action Button */}
        {(view === 'list' || view === 'share') && (
          <button
            onClick={() => setView('create')}
            className="fixed bottom-[130px] right-6 w-16 h-16 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#FF2400] flex items-center justify-center text-white shadow-2xl z-40 active:scale-95 transition-transform"
          >
            <Plus size={32} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </BrowserProtection>
  )
}
