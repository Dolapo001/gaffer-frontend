'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Plus, Menu, Trophy } from 'lucide-react'
import { BrowserProtection } from '@/components/BrowserProtection'
import { OrganiseList } from './components/OrganiseList'
import { OrganiseCreateSheet } from './components/OrganiseCreateSheet'
import { OrganiseDetails } from './components/OrganiseDetails'
import { OrganiseShare } from './components/OrganiseShare'
import { OrganiseSelectTeam } from './components/OrganiseSelectTeam'
import type { Team, Group, Player, OrganiseView } from './types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listTeams, createTeam, listPlayers, Team as BackendTeam } from '@/lib/services/team.service'
import { listOrgs } from '@/lib/services/org.service'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'Teams' | 'Groups'>('Teams')
  const [view, setView] = useState<OrganiseView>('list')
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)

  // 1. Fetch Organization
  const { data: orgs, isLoading: isLoadingOrgs, error: orgsError } = useQuery({
    queryKey: ['orgs'],
    queryFn: listOrgs,
    enabled: !!user,
    retry: 2,
  })

  useEffect(() => {
    if (orgsError) {
      addToast(`Failed to load organization: ${getErrorMessage(orgsError)}`, 'error')
    }
  }, [orgsError, addToast])

  const orgId = orgs?.[0]?._id

  // 2. Fetch Teams
  const { data: backendTeams, isLoading: isLoadingTeams } = useQuery({
    queryKey: ['teams', orgId],
    queryFn: () => listTeams(orgId!),
    enabled: !!orgId
  })

  // 3. Fetch Players (when a team is selected)
  const { data: backendPlayers, isLoading: isLoadingPlayers } = useQuery({
    queryKey: ['players', selectedTeam?.id],
    queryFn: () => listPlayers(selectedTeam!.id),
    enabled: !!selectedTeam?.id
  })

  // Local state for groups (saved locally for now till backend group module is ready)
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS)

  // Create form state
  const [teamName, setTeamName] = useState('')
  const [maxPlayers, setMaxPlayers] = useState('11')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState('#A855F7')
  const [selectedTeamsForGroup, setSelectedTeamsForGroup] = useState<string[]>([])

  // Map backend teams to UI teams
  const teams: Team[] = backendTeams?.map((t: BackendTeam) => ({
    id: t._id,
    name: t.name,
    playerCount: '0/22', 
    logo: t.logoUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + t.name,
  })) || []

  // Map backend players to UI players
  const players: Player[] = backendPlayers?.map((p: any) => ({
    id: p._id,
    name: `${p.firstName} ${p.lastName}`,
    position: p.position || 'Player',
    price: '7.5M', 
    isSelected: true
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
    if (!teamName) {
      addToast('Please enter a name', 'error')
      return
    }
    if (!orgId) {
      addToast('No organization found. Please make sure you are logged in correctly.', 'error')
      return
    }

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
    addToast('Player status update not yet implemented in backend', 'info')
  }

  const handlePriceChange = (id: string, increment: boolean) => {
    addToast('Price updates not yet implemented in backend', 'info')
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

  if (isLoadingOrgs) {
    return (
      <div className="min-h-screen bg-[#181928] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/10 border-t-orange-500 rounded-full animate-spin" />
      </div>
    )
  }

  // No organization found — show setup CTA instead of a broken empty page
  if (!orgId && !isLoadingOrgs) {
    return (
      <BrowserProtection>
        <div className="fixed inset-0 bg-[#181928] text-white flex flex-col font-inter overflow-hidden">
          <div className="flex items-center px-6 pt-12 pb-4 border-b border-white/10 shrink-0">
            <Menu size={24} className="mr-4 text-white/60" />
            <h1 className="text-lg font-semibold tracking-tight">Organize</h1>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center space-y-6">
            <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center">
              <Trophy size={40} className="text-orange-500" />
            </div>
            <div className="space-y-2">
              <p className="text-white font-chakra font-bold text-xl uppercase tracking-tight">No Organization Found</p>
              <p className="text-white/40 text-sm font-chakra max-w-[260px]">
                {orgsError
                  ? 'Could not load your organization. Please try again.'
                  : 'You need an organization to manage teams and groups.'}
              </p>
            </div>
            <button
              onClick={() => router.push('/auth/signup/organization')}
              className="w-full py-4 rounded-xl font-chakra font-black text-lg bg-gradient-to-r from-[#FF8904] to-[#E7000B] text-white uppercase tracking-wider shadow-lg"
            >
              Create Organization
            </button>
          </div>
        </div>
      </BrowserProtection>
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
                hasOrg={!!orgId}
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
                isSubmitting={createTeamMutation.isPending}
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

        {/* Floating Action Button — only visible on list/share views when org is ready */}
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
