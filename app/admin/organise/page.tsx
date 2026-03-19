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

const INITIAL_TEAMS: Team[] = [
  {
    id: '1',
    name: 'COCCS',
    playerCount: '11/22',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/1200px-Manchester_City_FC_badge.svg.png',
  },
  {
    id: '2',
    name: 'COAES',
    playerCount: '11/22',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1200px-FC_Barcelona_%28crest%29.svg.png',
  },
]

const INITIAL_GROUPS: Group[] = [
  {
    id: '1',
    name: 'GROUP A',
    color: '#A855F7',
    teams: [
      { id: '1', name: 'COCCS', playerCount: '11/22', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/1200px-Manchester_City_FC_badge.svg.png' },
      { id: '101', name: 'COSMS', playerCount: '11/22', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/1200px-Manchester_City_FC_badge.svg.png' },
      { id: '2', name: 'COAES', playerCount: '11/22', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1200px-FC_Barcelona_%28crest%29.svg.png' },
    ],
  },
  {
    id: '2',
    name: 'GROUP B',
    color: '#3B82F6',
    teams: [
      { id: '1', name: 'COCCS', playerCount: '11/22', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/1200px-Manchester_City_FC_badge.svg.png' },
      { id: '101', name: 'COSMS', playerCount: '11/22', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/1200px-Manchester_City_FC_badge.svg.png' },
      { id: '2', name: 'COAES', playerCount: '11/22', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1200px-FC_Barcelona_%28crest%29.svg.png' },
    ],
  },
]

const INITIAL_PLAYERS: Player[] = [
  { id: '1', name: 'Olaniyi Ojedokun', position: 'THE GAFFER', price: '7.5M', isSelected: true },
  { id: '2', name: 'Ayomide Lawal', position: 'Goalkeeper', price: '7.5M', isSelected: false },
  { id: '3', name: 'Ojedokun Olaniyi', position: 'Center-Back', price: '7.5M', isSelected: false },
  { id: '4', name: 'Ikpi David', position: 'Center-Back', price: '7.5M', isSelected: false },
  { id: '5', name: 'Ayomide Lawal', position: 'Center-Back', price: '7.5M', isSelected: true },
  { id: '6', name: 'Ayomide Lawal', position: 'Center-Back', price: '7.5M', isSelected: true },
  { id: '7', name: 'Ayomide Lawal', position: 'Left-back', price: '7.5M', isSelected: true },
  { id: '8', name: 'Ayomide Lawal', position: 'Goalkeeper', price: '7.5M', isSelected: true },
  { id: '9', name: 'Ayomide Lawal', position: 'Goalkeeper', price: '7.5M', isSelected: true },
  { id: '10', name: 'Ayomide Lawal', position: 'Goalkeeper', price: '7.5M', isSelected: true },
]

export default function OrganizePage() {
  const [activeTab, setActiveTab] = useState<'Teams' | 'Groups'>('Teams')
  const [view, setView] = useState<OrganiseView>('list')
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)

  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS)
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS)
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS)

  // Create form state
  const [teamName, setTeamName] = useState('Chelsea')
  const [maxPlayers, setMaxPlayers] = useState('11')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState('#A855F7')
  const [selectedTeamsForGroup, setSelectedTeamsForGroup] = useState<string[]>([])

  // Hide the bottom nav bar while the create sheet is open.
  const isCreateOpen = view === 'create'

  const getUnassignedTeams = () => {
    const assignedIds = new Set(groups.flatMap((g) => g.teams.map((t) => t.id)))
    return teams.filter((t) => !assignedIds.has(t.id))
  }

  const handleCreate = () => {
    if (!teamName) return

    if (activeTab === 'Teams') {
      const newTeam: Team = {
        id: crypto.randomUUID(),
        name: teamName,
        playerCount: `0/${maxPlayers}`,
        logo: logoPreview || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
      }
      setTeams((prev) => [...prev, newTeam])
      setSelectedTeam(newTeam)
      setSelectedGroup(null)
      setView('details')
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
      setTeamName('Chelsea')
      setSelectedTeamsForGroup([])
      setLogoPreview(null)
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
