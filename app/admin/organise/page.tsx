'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Plus, Menu, ShieldCheck } from 'lucide-react'
import { BrowserProtection } from '@/components/BrowserProtection'
import { OrganiseList } from './components/OrganiseList'
import { OrganiseCreateSheet } from './components/OrganiseCreateSheet'
import { OrganiseDetails } from './components/OrganiseDetails'
import { OrganiseShare } from './components/OrganiseShare'
import { OrganiseSelectTeam } from './components/OrganiseSelectTeam'
import type { Team, Group, Player, OrganiseView } from './types'
import { useUIStore } from '@/store/uiStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listTeams, createTeam, listPlayers, updatePlayer, addPlayer, Team as BackendTeam } from '@/lib/services/team.service'
import { listOrgs } from '@/lib/services/org.service'
import { listGroups, createGroup, updateGroup, Group as BackendGroup } from '@/lib/services/group.service'
import { listCompetitions, registerTeams, Competition } from '@/lib/services/competition.service'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'
import { useRouter } from 'next/navigation'

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
  const { data: backendPlayers } = useQuery({
    queryKey: ['players', selectedTeam?.id],
    queryFn: () => listPlayers(selectedTeam!.id),
    enabled: !!selectedTeam?.id
  })

  // 4. Fetch Groups
  const { data: backendGroups, isLoading: isLoadingGroups } = useQuery({
    queryKey: ['groups', orgId],
    queryFn: () => listGroups(orgId!),
    enabled: !!orgId
  })

  // 5. Fetch Competitions (Tournaments)
  const { data: competitions, isLoading: isLoadingCompetitions } = useQuery({
    queryKey: ['competitions', orgId],
    queryFn: () => listCompetitions(orgId!),
    enabled: !!orgId
  })

  // Mutations
  const createTeamMutation = useMutation({
    mutationFn: (data: any) => createTeam(orgId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', orgId] })
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  })

  const createGroupMutation = useMutation({
    mutationFn: (data: any) => createGroup(orgId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', orgId] })
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  })

  const updateGroupMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateGroup(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['groups', orgId] })
      addToast('Group updated!', 'success')
      // Update local selected group if needed
      if (selectedGroup?.id === updated._id) {
         setSelectedGroup({
            id: updated._id,
            name: updated.name,
            color: updated.color,
            teams: updated.teams.map((t: any) => ({
              id: t._id,
              name: t.name,
              handle: t.handle,
              playerCount: `${t.playerCount ?? 0}/${t.maxPlayers ?? 22}`,
              logo: t.logoUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + t.name
            }))
         })
      }
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  })

  // Create form state
  const [teamName, setTeamName] = useState('')
  const [maxPlayers, setMaxPlayers] = useState('11')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState('#A855F7')
  const [selectedTeamsForGroup, setSelectedTeamsForGroup] = useState<string[]>([])
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>('')

  // Map backend teams to UI teams
  const teams: Team[] = backendTeams?.map((t: BackendTeam) => ({
    id: t._id,
    name: t.name,
    handle: t.handle,
    playerCount: `${t.playerCount ?? 0}/${t.maxPlayers ?? 22}`,
    logo: t.logoUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + t.name,
  })) || []

  // Map backend players to UI players
  const players: Player[] = backendPlayers?.map((p: any) => {
    const playerData = p.playerId || p
    return {
      id: playerData._id,
      name: (playerData.firstName || playerData.lastName) ? `${playerData.firstName || ''} ${playerData.lastName || ''}`.trim() : (playerData.name || 'Unknown'),
      position: playerData.position || 'Player',
      price: (p.price ?? 7.5).toFixed(1) + 'M', 
      isSelected: p.squadStatus === 'active',
      role: p.role || 'player',
      status: p.squadStatus === 'removed' ? 'suspended' : (p.squadStatus || 'active'),
      photo: playerData.photoUrl || playerData.profilePhoto || playerData.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${playerData._id}`
    }
  }) || []

  // Map backend groups to UI groups
  const groups: Group[] = backendGroups?.map((g: BackendGroup) => ({
    id: g._id,
    name: g.name,
    color: g.color,
    teams: (g.teams || []).filter(Boolean).map((t: any) => ({
      id: t._id,
      name: t.name,
      handle: t.handle,
      playerCount: `${t.playerCount ?? 0}/${t.maxPlayers ?? 22}`,
      logo: t.logoUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + t.name
    }))
  })) || []

  const isCreateOpen = view === 'create'

  const getUnassignedTeams = () => {
    const assignedIds = new Set(groups.flatMap((g) => g.teams.map((t) => t.id)))
    return teams.filter((t) => !assignedIds.has(t.id))
  }

  const handleCreate = async () => {
    if (!teamName) {
      addToast('Please enter a name', 'error')
      return
    }
    if (!orgId) {
      addToast('No organization found', 'error')
      return
    }

    try {
      if (activeTab === 'Teams') {
        let logoUrl = logoPreview || undefined
        
        // If we have a local file, upload it to Cloudinary first
        if (logoFile) {
          const { uploadOrgAsset } = await import('@/lib/services/org.service')
          const result = await uploadOrgAsset(orgId!, logoFile)
          logoUrl = result.url
        }

        const team = await createTeamMutation.mutateAsync({
          name: teamName,
          handle: teamName.toLowerCase().replace(/\s+/g, '-'),
          sport: 'Football',
          logoUrl,
          maxPlayers: parseInt(maxPlayers) || 11
        })

        // If a competition is selected, auto-register the team
        if (selectedCompetitionId && team?._id) {
          await registerTeams(selectedCompetitionId, [{ teamId: team._id }])
          queryClient.invalidateQueries({ queryKey: ['competition-teams', selectedCompetitionId] })
        }

        addToast('Team created successfully!', 'success')
      } else {
        await createGroupMutation.mutateAsync({
          name: teamName,
          color: selectedColor,
          teams: selectedTeamsForGroup
        })
        addToast('Group created successfully!', 'success')
      }

      // Reset state
      setView('list')
      setTeamName('')
      setLogoPreview(null)
      setSelectedCompetitionId('')
      setSelectedTeamsForGroup([])
    } catch (err) {
      addToast(getErrorMessage(err), 'error')
    }
  }

  const handleRegisterTeamToTournament = async (teamId: string, competitionId: string) => {
    try {
      await registerTeams(competitionId, [{ teamId }])
      queryClient.invalidateQueries({ queryKey: ['competition-teams', competitionId] })
      addToast('Team added to tournament!', 'success')
    } catch (err) {
      addToast(getErrorMessage(err), 'error')
    }
  }

  const { hideNavbar } = useUIStore()

  // Double-ensure navbar is hidden when creating
  useEffect(() => {
    if (view === 'create') {
      hideNavbar()
    }
  }, [view, hideNavbar])

  const handleTogglePlayer = (id: string) => {
    if (!selectedTeam) return
    const p = players.find(x => x.id === id)
    if (!p) return
    
    // Toggle between active and suspended (or injured) to match backend supported enums
    const newStatus = p.status === 'active' ? 'suspended' : 'active'
    updatePlayerMutation.mutate({
      teamId: selectedTeam.id,
      playerId: id,
      payload: { squadStatus: newStatus }
    })
  }

  const handleRoleChange = (id: string, role: 'player' | 'captain' | 'coach') => {
    if (!selectedTeam) return
    updatePlayerMutation.mutate({
      teamId: selectedTeam.id,
      playerId: id,
      payload: { role }
    })
  }

  const handleStatusChange = (id: string, squadStatus: 'active' | 'injured' | 'suspended') => {
    if (!selectedTeam) return
    updatePlayerMutation.mutate({
      teamId: selectedTeam.id,
      playerId: id,
      payload: { squadStatus }
    })
  }

  const updatePlayerMutation = useMutation({
    mutationFn: ({ teamId, playerId, payload }: { teamId: string, playerId: string, payload: any }) => updatePlayer(teamId, playerId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players', selectedTeam?.id] })
    },
    onError: (err) => addToast(getErrorMessage(err), 'error')
  })

  const addPlayerMutation = useMutation({
    mutationFn: ({ teamId, data }: { teamId: string, data: any }) => addPlayer(teamId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players', selectedTeam?.id] })
      addToast('Player added to squad!', 'success')
    },
    onError: (err) => addToast(getErrorMessage(err), 'error')
  })

  const handleManualAddPlayer = (data: any) => {
    if (!selectedTeam) return
    addPlayerMutation.mutate({ teamId: selectedTeam.id, data })
  }

  const handlePriceChange = (id: string, increment: boolean) => {
    if (!selectedTeam) return
    const p = backendPlayers?.find((bp: any) => (bp.playerId?._id === id || bp._id === id))
    if (!p) return
    
    const currentPrice = p.price ?? 7.5
    // Ensure accurate decimal addition and subtraction
    const newPrice = increment ? Math.round((currentPrice + 0.5) * 10) / 10 : Math.round((currentPrice - 0.5) * 10) / 10
    if (newPrice < 0) return
    
    updatePlayerMutation.mutate({
      teamId: selectedTeam.id,
      playerId: id,
      payload: { price: newPrice }
    })
  }

  const handleAddTeamsToGroup = (newTeams: Team[]) => {
    if (!selectedGroup) return
    const teamIds = [
      ...selectedGroup.teams.map(t => t.id),
      ...newTeams.map(t => t.id)
    ]
    console.log('Updating group teams:', { groupId: selectedGroup.id, teamIds });
    updateGroupMutation.mutate({
      id: selectedGroup.id,
      payload: { teams: teamIds }
    })
    setView('list')
  }

  if (isLoadingOrgs || isLoadingTeams || isLoadingGroups) {
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
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center space-y-8">
            <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center">
              <ShieldCheck size={40} className="text-orange-500" />
            </div>
            <div className="space-y-3">
              <h2 className="text-white font-chakra font-black text-2xl uppercase tracking-tighter">Complete Your Setup</h2>
              <p className="text-white/40 text-sm font-chakra max-w-[280px] leading-relaxed">
                Your manager account is active, but your club profile is missing its name. Finish. your setup to start managing tournaments.
              </p>
            </div>
            <button
              onClick={() => router.push('/auth/signup/organization')}
              className="w-full py-4 rounded-xl font-chakra font-black text-lg bg-gradient-to-r from-[#FF8904] to-[#E7000B] text-white uppercase tracking-wider shadow-lg active:scale-[0.98] transition-all"
            >
              Finish Setup
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
        {/* Header - Hidden in details view to avoid duplication with the team's own back button and title */}
        {view !== 'details' && (
          <div className="flex items-center px-6 pt-12 pb-4 text-white border-b border-white/10 shrink-0">
            <button
              aria-label="Toggle menu"
              onClick={() => (view !== 'list' ? setView('list') : undefined)}
              className="mr-4 hover:opacity-70 transition-opacity"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-semibold tracking-tight">Organize</h1>
          </div>
        )}

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
                onLogoChange={(preview, error, file) => {
                  setLogoPreview(preview)
                  setLogoError(error)
                  if (file) setLogoFile(file)
                }}
                onColorChange={setSelectedColor}
                onToggleTeamForGroup={(id) =>
                  setSelectedTeamsForGroup((prev) =>
                    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
                  )
                }
                onCreate={handleCreate}
                getUnassignedTeams={getUnassignedTeams}
                isSubmitting={createTeamMutation.isPending || createGroupMutation.isPending}
                competitions={competitions || []}
                selectedCompetitionId={selectedCompetitionId}
                onCompetitionChange={setSelectedCompetitionId}
              />
            )}

            {view === 'details' && (
              <OrganiseDetails
                selectedTeam={selectedTeam}
                selectedGroup={selectedGroup || groups.find(g => g.teams.some(t => t.id === selectedTeam?.id)) || null}
                players={players}
                competitions={competitions || []}
                onBack={() => setView('list')}
                onShare={() => setView('list')}
                onAddTeams={() => setView('select_team')}
                onTogglePlayer={handleTogglePlayer}
                onPriceChange={handlePriceChange}
                onRoleChange={handleRoleChange}
                onStatusChange={handleStatusChange}
                onAddToTournament={handleRegisterTeamToTournament}
                onAddPlayerManual={handleManualAddPlayer}
                orgName={orgs?.[0]?.name}
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
                teams={getUnassignedTeams()}
                onBack={() => setView('list')}
                onAddTeams={handleAddTeamsToGroup}
                onCreateNew={() => {
                  setActiveTab('Teams')
                  setView('create')
                }}
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
