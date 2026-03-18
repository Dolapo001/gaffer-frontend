'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Menu, ChevronDown, ChevronLeft, ChevronRight, 
  ChevronUp, Copy, Check, User, Minus
} from 'lucide-react'
import { GradientButton } from '@/components/GradientButton'
import { BrowserProtection } from '@/components/BrowserProtection'
import { TournamentBracket } from '@/components/admin/TournamentBracket'

type Player = {
  id: string
  name: string
  position: string
  price: string
  photo?: string
  isSelected: boolean
}

type Team = {
  id: string
  name: string
  playerCount: string
  logo: string
}

type Group = {
  id: string
  name: string
  color: string
  teams: Team[]
}

export default function OrganizePage() {
  const [activeTab, setActiveTab] = useState<'Teams' | 'Groups'>('Teams')
  const [view, setView] = useState<'list' | 'create' | 'details' | 'share' | 'select_team'>('list')
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [selectedGroupForTeams, setSelectedGroupForTeams] = useState<Group | null>(null)
  
  const groupColors = [
    '#A855F7', '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#EC4899',
    '#06B6D4', '#F97316', '#84CC16', '#14B8A6', '#6366F1', '#D946EF'
  ]
  const [selectedColor, setSelectedColor] = useState(groupColors[0])
  const [selectedTeamsForGroup, setSelectedTeamsForGroup] = useState<string[]>([])
  
  const [teams, setTeams] = useState<Team[]>([
    {
      id: '1',
      name: 'COCCS',
      playerCount: '11/22',
      logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/1200px-Manchester_City_FC_badge.svg.png'
    },
    {
      id: '2',
      name: 'COAES',
      playerCount: '11/22',
      logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1200px-FC_Barcelona_%28crest%29.svg.png'
    }
  ])
  const [teamName, setTeamName] = useState('Chelsea')
  const [maxPlayers, setMaxPlayers] = useState('11')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  
  const [players, setPlayers] = useState<Player[]>([
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
  ])

  const [groups, setGroups] = useState<Group[]>([
    {
      id: '1',
      name: 'GROUP A',
      color: '#A855F7',
      teams: [
        { id: '1', name: 'COCCS', playerCount: '11/22', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/1200px-Manchester_City_FC_badge.svg.png' },
        { id: '101', name: 'COSMS', playerCount: '11/22', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/1200px-Manchester_City_FC_badge.svg.png' },
        { id: '2', name: 'COAES', playerCount: '11/22', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1200px-FC_Barcelona_%28crest%29.svg.png' },
      ]
    },
    {
      id: '2',
      name: 'GROUP B',
      color: '#3B82F6',
      teams: [
        { id: '1', name: 'COCCS', playerCount: '11/22', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/1200px-Manchester_City_FC_badge.svg.png' },
        { id: '101', name: 'COSMS', playerCount: '11/22', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/1200px-Manchester_City_FC_badge.svg.png' },
        { id: '2', name: 'COAES', playerCount: '11/22', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1200px-FC_Barcelona_%28crest%29.svg.png' },
      ]
    }
  ])

  const togglePlayerSelection = (id: string) => {
    setPlayers(prev => prev.map(p => p.id === id ? {...p, isSelected: !p.isSelected} : p))
  }

  const handlePriceChange = (id: string, increment: boolean) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === id) {
        const current = parseFloat(p.price) || 7.5
        const next = Math.max(0.5, current + (increment ? 0.5 : -0.5)) // Minimum price 0.5M
        return { ...p, price: `${next.toFixed(1)}M` }
      }
      return p
    }))
  }
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handleCreate = () => {
    if (!teamName) return
    
    if (activeTab === 'Teams') {
      const newTeam: Team = { 
        id: Date.now().toString(), 
        name: teamName, 
        playerCount: `0/${maxPlayers}`, 
        logo: logoPreview || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' 
      }
      setTeams([...teams, newTeam])
      setSelectedTeam(newTeam)
      setSelectedGroup(null) // Clear selected group
      setView('details')
    } else {
      const selectedTeamObjects = teams.filter(t => selectedTeamsForGroup.includes(t.id))
      const newGroup: Group = {
        id: Date.now().toString(),
        name: teamName,
        color: selectedColor,
        teams: selectedTeamObjects
      }
      setGroups([...groups, newGroup])
      setSelectedGroup(newGroup) // Set the newly created group as selected
      setSelectedTeam(null) // Clear selected team
      setView('details') // Navigate to details view for the new group
      // Reset form
      setTeamName('Chelsea')
      setSelectedTeamsForGroup([])
      setLogoPreview(null)
    }
  }

  const getUnassignedTeams = () => {
    const assignedTeamIds = new Set(groups.flatMap(g => g.teams.map(t => t.id)))
    return teams.filter(t => !assignedTeamIds.has(t.id))
  }

  const toggleTeamForGroup = (teamId: string) => {
    setSelectedTeamsForGroup(prev => 
      prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
    )
  }

  useEffect(() => {
    const navBar = document.getElementById('admin-nav-bar')
    if (!navBar) return
    
    // Only hide navbar when the generic create modal/sheet is open
    const isModalOpen = (view === 'create')
    if (isModalOpen) {
      navBar.style.opacity = '0'
      navBar.style.pointerEvents = 'none'
      navBar.style.transform = 'translate(-50%, 20px)'
    } else {
      navBar.style.opacity = '1'
      navBar.style.pointerEvents = 'auto'
      navBar.style.transform = 'translate(-50%, 0)'
    }
  }, [view])

  return (
    <BrowserProtection>
      <div className="fixed inset-0 bg-[#181928] text-white flex flex-col font-inter overflow-hidden pb-4">
        {/* Header */}
        <div className="flex items-center px-6 pt-12 pb-4 text-white border-b border-white/10 shrink-0">
          <button className="mr-4">
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-semibold tracking-tight">Organize</h1>
        </div>

        <div className="flex-1 relative">
          <AnimatePresence mode="wait">
            {view === 'list' && (
              <motion.div 
                key="list" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="absolute inset-0 flex flex-col space-y-4 px-6 pt-2"
              >
                {/* Tab Switcher */}
                <div className="bg-white/5 p-1.5 rounded-xl flex border border-white/5">
                  <button
                    onClick={() => setActiveTab('Teams')}
                    className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all flex flex-col items-center justify-center relative ${
                      activeTab === 'Teams' ? 'bg-[#2F3342] text-white shadow-lg' : 'text-gray-500'
                    }`}
                  >
                    Teams
                    {activeTab === 'Teams' && (
                      <div className="w-4 h-0.5 bg-orange-500 rounded-full mt-1" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('Groups')}
                    className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all flex flex-col items-center justify-center relative ${
                      activeTab === 'Groups' ? 'bg-[#2F3342] text-white shadow-lg' : 'text-gray-500'
                    }`}
                  >
                    Groups
                    {activeTab === 'Groups' && (
                      <div className="w-4 h-0.5 bg-orange-500 rounded-full mt-1" />
                    )}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pb-40 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <AnimatePresence mode="wait">
                    {activeTab === 'Teams' ? (
                      <motion.div 
                        key="teams-list"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col"
                      >
                        {teams.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center px-8 pb-32 text-center">
                            <h3 className="text-white text-[17px] font-semibold mb-2">Add New Team</h3>
                            <p className="text-[14px] text-[#A1A1AA] max-w-[300px] leading-[1.4]">
                              Manage your schedule for matches ,ceremonies , Schedule now and for later
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {teams.map((team) => (
                              <div 
                                key={team.id}
                                onClick={() => {
                                  setSelectedTeam(team)
                                  setSelectedGroup(null) // Clear selected group
                                  setView('details')
                                }}
                                className="bg-[#1C2130] border border-white/5 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-all group"
                              >
                                <div className="w-14 h-14 shrink-0 rounded-full overflow-hidden bg-black/20">
                                  <img src={team.logo} className="w-full h-full object-cover" alt="" />
                                </div>
                                <div className="flex-1 justify-center flex flex-col">
                                  <h4 className="font-bold text-[17px] text-white tracking-[0.05em] mb-1">
                                    {team.name}
                                  </h4>
                                  <p className="text-[12px] text-[#A1A1AA]">
                                    {team.playerCount} players
                                  </p>
                                </div>
                                <div className="w-5 h-5 rounded-full border border-white flex items-center justify-center shrink-0">
                                  <ChevronRight size={12} strokeWidth={2.5} className="text-white" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="groups-list"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col space-y-4"
                      >
                        {groups.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center px-8 pb-32 text-center">
                            <h3 className="text-white text-[28px] font-bold mb-3 tracking-tight">Create Group</h3>
                            <p className="text-[14px] text-[#A1A1AA] max-w-[320px] leading-[1.5]">
                              Manage your schedule for matches ,ceremonies , Schedule now and for later
                            </p>
                          </div>
                        ) : (
                          groups.map((group) => (
                            <div 
                              key={group.id}
                              onClick={() => {
                                setSelectedGroup(group)
                                setSelectedTeam(null) // Clear selected team
                                setView('details')
                              }}
                              className="bg-[#1C2130] border border-white/5 rounded-[24px] p-6 flex flex-col gap-6 cursor-pointer hover:bg-white/10 transition-all group"
                            >
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-5 h-5 rounded-full" 
                                  style={{ backgroundColor: group.color }}
                                />
                                <h4 className="font-bold text-[18px] text-white tracking-[0.05em]">
                                  {group.name}
                                </h4>
                              </div>

                              <div className="space-y-4">
                                {group.teams.map((team) => (
                                  <div key={team.id} className="flex items-center gap-4 py-1 border-b border-white/5 last:border-0">
                                    <div className="w-6 h-6 shrink-0 rounded-full overflow-hidden bg-black/20">
                                      <img src={team.logo} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <span className="text-white text-[15px] font-bold tracking-[0.05em] uppercase">
                                      {team.name}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              <button 
                                onClick={(e) => {
                                  e.stopPropagation() // Prevent group card onClick from firing
                                  setSelectedGroup(group)
                                  setView('select_team')
                                }}
                                className="mt-2 w-full max-w-[160px] mx-auto py-2.5 px-4 rounded-full border border-white/60 flex items-center justify-center gap-2 text-white text-[13px] font-semibold hover:bg-white/5 transition-all"
                              >
                                <Plus size={16} />
                                Add Teams
                              </button>
                            </div>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* Create Team/Group Sheet */}
            {view === 'create' && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-[#FFFFFF78] backdrop-blur-[7.8px] z-[45]" // Blurry white overlay
                  onClick={() => setView('list')}
                />
                <motion.div 
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
                  className="fixed bottom-0 left-0 right-0 z-50 h-[70%] flex flex-col px-8 pt-6 pb-6 overflow-hidden bg-[#0F172BB0] backdrop-blur-[20px] rounded-t-[30px] border-t-[1.23px] border-white/10 shadow-[0_-20px_80px_rgba(0,0,0,0.4)] before:absolute before:inset-0 before:rounded-t-[30px] before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none"
                >
                  {/* Drag Handle (Essential for the "Sheet" look) */}
                  <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 shrink-0 relative z-10" />

                  <h2 className="text-white text-center text-lg font-bold mb-0.5 relative z-10">
                    {activeTab === 'Teams' ? 'Create Team' : 'Create Group'}
                  </h2>
                  
                  {/* Subtext */}
                  <div className="text-center px-4 mb-2 flex-shrink-0 relative z-10">
                    <h3 className="text-gray-400 text-base font-semibold">
                      {activeTab === 'Teams' ? 'Add New Team' : 'Add New Group'}
                    </h3>
                    <p className="text-gray-500 text-[13px] leading-tight mt-0.5">
                      Manage your schedule for matches, ceremonies, Schedule now and for later
                    </p>
                  </div>

                  {/* Color Selection (for Groups only) */}
                  {activeTab === 'Groups' ? (
                    <div className="flex flex-col items-center mb-4 shrink-0 relative z-10 w-full px-2">
                      <label className="text-gray-400 text-[10px] font-bold mb-2 uppercase tracking-widest opacity-80">Select Group Color</label>
                      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 max-w-[280px]">
                        {groupColors.map((color) => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`w-8 h-8 rounded-full transition-all flex items-center justify-center shrink-0 ${
                              selectedColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#111827] scale-110 shadow-lg' : 'opacity-60 hover:opacity-100 scale-90'
                            }`}
                            style={{ backgroundColor: color }}
                          >
                            {selectedColor === color && <Check size={14} className="text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Logo Upload (for Teams only) */
                    <div className="flex flex-col items-center mb-2 shrink-0 relative z-10">
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleLogoChange}
                        className="hidden"
                        accept="image/*"
                      />
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 mb-1 cursor-pointer active:scale-95 transition-transform bg-black/20 flex items-center justify-center"
                      >
                        {logoPreview ? (
                          <img 
                            src={logoPreview} 
                            alt="Avatar" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" className="w-full h-full object-cover" alt="" />
                        )
                      }
                      </div>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-gray-400 text-xs font-medium"
                      >
                        Choose Photo
                      </button>
                    </div>
                  )}

                  {/* Form Content */}
                  <div className="space-y-3 shrink-0 relative z-10 w-full pb-1">
                    <div className="space-y-1">
                      <label className="block text-gray-300 text-sm font-medium ml-1">
                        {activeTab === 'Teams' ? 'Team Name' : 'Group Name'}
                      </label>
                      <input 
                        type="text" 
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder={activeTab === 'Teams' ? 'Chelsea' : 'Tournament Group A'}
                        className="w-full bg-[#1C2237] text-white px-5 py-3.5 rounded-xl border border-white/5 focus:outline-none focus:border-white/20 placeholder-gray-500 text-sm"
                      />
                    </div>

                    {activeTab === 'Teams' ? (
                      <div className="space-y-1">
                        <label className="block text-gray-300 text-sm font-medium ml-1">Max Number of Players</label>
                        <div className="relative">
                          <select 
                            value={maxPlayers}
                            onChange={(e) => setMaxPlayers(e.target.value)}
                            className="w-full bg-[#1C2237] text-white px-5 py-3.5 rounded-xl border border-white/5 focus:outline-none appearance-none text-sm"
                          >
                            {[1, 2, 3, 4, 5, 11, 22].map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-5 pointer-events-none">
                            <ChevronDown size={18} className="text-white/60" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 flex-1 flex flex-col min-h-0">
                        <label className="block text-gray-300 text-[13px] font-medium ml-1">Add Teams</label>
                        <div className="flex-1 overflow-y-auto bg-[#1C2237] rounded-xl border border-white/5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                          {getUnassignedTeams().length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-xs">All teams are already assigned to groups</div>
                          ) : (
                            getUnassignedTeams().map((team) => (
                              <div 
                                key={team.id}
                                onClick={() => toggleTeamForGroup(team.id)}
                                className="px-5 py-3 flex items-center justify-between border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20">
                                    <img src={team.logo} className="w-full h-full object-cover" alt="" />
                                  </div>
                                  <span className="text-white text-xs font-bold uppercase tracking-widest">{team.name}</span>
                                </div>
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                  selectedTeamsForGroup.includes(team.id) 
                                    ? 'bg-[#FF7A00] border-[#FF7A00]' 
                                    : 'border-white/20'
                                }`}>
                                  {selectedTeamsForGroup.includes(team.id) && <Check size={12} className="text-white" />}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <div className="mt-2 shrink-0 relative z-10">
                    <button 
                      onClick={handleCreate}
                      className="w-full bg-gradient-to-r from-[#FF7A00] to-[#FF0000] text-white font-bold py-3.5 rounded-2xl active:scale-[0.98] transition-all text-base shadow-[0_4px_14px_rgba(255,0,0,0.3)]"
                    >
                      {activeTab === 'Teams' ? 'Create Team' : 'Create Group'}
                    </button>
                  </div>
                </motion.div>
              </>
            )}
            {view === 'details' && (
              <motion.div 
                key="details" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }}
                className="absolute inset-0 z-20 bg-[#181928] flex flex-col"
              >
                {/* Header */}
                <div className="flex flex-col items-center pt-12 pb-6 px-6 relative shrink-0">
                  <button 
                    onClick={() => setView('list')} 
                    className="absolute left-6 top-[52px] w-6 h-6 rounded-full border border-white flex items-center justify-center"
                  >
                    <ChevronLeft size={14} strokeWidth={2.5} />
                  </button>
                  <h2 className="text-[17px] font-bold tracking-[0.05em] mb-4">{selectedTeam?.name || selectedGroup?.name}</h2>
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-black/20">
                    <img src={selectedTeam?.logo || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'} alt="" className="w-full h-full object-cover" />
                  </div>
                </div>

                {/* Content based on selected item */}
                {selectedTeam && (
                  // Player List for Team Details
                  <div className="flex-1 overflow-y-auto px-6 pb-40 space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {players.map((player, i) => (
                      <div className="flex items-center gap-4 border-b border-white/5 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0" key={player.id}>
                        <div 
                          className={`flex-1 bg-[#1C1F2D] rounded-[24px] p-4 flex items-center gap-4 border border-white/5 shadow-xl transition-all hover:bg-white/[0.04] ${
                            player.isSelected ? 'border-orange-500/30 bg-orange-500/[0.02]' : ''
                          }`}
                        >
                          <div className={`w-14 h-14 rounded-full flex flex-col items-center justify-center shrink-0 overflow-hidden shadow-inner ${
                            i === 0 ? 'bg-sky-500/20 text-sky-400 border border-sky-500/20' : 'bg-white/5 text-white/20 border border-white/5'
                          }`}>
                            <User size={24} />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-chakra font-black text-[16px] leading-tight mb-1 uppercase italic tracking-tight text-white/90">
                              {player.name}
                            </h5>
                            <p className="text-[10px] uppercase font-black tracking-[0.15em] text-white/40 italic">
                              {player.position}
                            </p>
                          </div>
                          
                          {/* Price Section */}
                          <div className="flex items-center gap-3 bg-black/20 rounded-2xl p-2 px-3 border border-white/5">
                            {i === 0 ? (
                              <span className="text-orange-500 text-[10px] font-black uppercase tracking-widest italic">Add Price</span>
                            ) : (
                              <div className="flex items-center gap-3">
                                <button 
                                  onClick={() => handlePriceChange(player.id, false)} 
                                  className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="text-[14px] font-chakra font-black text-white px-1 leading-none w-[36px] text-center italic">
                                  {player.price}
                                </span>
                                <button 
                                  onClick={() => handlePriceChange(player.id, true)} 
                                  className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Checkbox */}
                        {i !== 0 && (
                          <div 
                            onClick={() => togglePlayerSelection(player.id)}
                            className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all active:scale-90 ${
                            !player.isSelected 
                              ? 'border-white/10 bg-white/5 text-transparent' 
                              : 'border-orange-600 bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.3)]'
                          }`}>
                            <Check size={18} strokeWidth={4} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {selectedGroup && (
                  // Team List for Group Details
                  <div className="flex-1 overflow-y-auto px-6 pb-40 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div className="bg-[#1C2130] border border-white/5 rounded-[24px] p-6 flex flex-col gap-6">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-5 h-5 rounded-full" 
                          style={{ backgroundColor: selectedGroup.color }}
                        />
                        <h4 className="font-bold text-[18px] text-white tracking-[0.05em]">
                          {selectedGroup.name}
                        </h4>
                      </div>

                      <div className="space-y-4">
                        {selectedGroup.teams.map((team) => (
                          <div key={team.id} className="flex items-center gap-4 py-1 border-b border-white/5 last:border-0">
                            <div className="w-6 h-6 shrink-0 rounded-full overflow-hidden bg-black/20">
                              <img src={team.logo} className="w-full h-full object-cover" alt="" />
                            </div>
                            <span className="text-white text-[15px] font-bold tracking-[0.05em] uppercase">
                              {team.name}
                            </span>
                          </div>
                        ))}
                      </div>

                      <button 
                        onClick={() => {
                          setSelectedGroup(selectedGroup) // Ensure selectedGroup is set for select_team view
                          setView('select_team')
                        }}
                        className="mt-2 w-full max-w-[160px] mx-auto py-2.5 px-4 rounded-full border border-white/60 flex items-center justify-center gap-2 text-white text-[13px] font-semibold hover:bg-white/5 transition-all"
                      >
                        <Plus size={16} />
                        Add Teams
                      </button>
                    </div>
                  </div>
                )}

                {/* Fixed Bottom Action area */}
                <div className="absolute bottom-[104px] left-0 right-0 px-6 pt-4 pb-4 bg-gradient-to-t from-[#181928] via-[#181928] to-transparent z-30">
                  <button 
                    onClick={() => setView('share')}
                    className="w-full bg-gradient-to-r from-[#FF7A00] to-[#FF0000] text-white font-bold text-[17px] py-4 rounded-[16px] shadow-[0_4px_14px_rgba(255,0,0,0.3)] active:scale-[0.98] transition-all"
                  >
                    Save
                  </button>
                </div>
              </motion.div>
            )}

            {view === 'share' && (
              <motion.div 
                key="share" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }}
                className="absolute inset-0 z-20 bg-[#181928] flex flex-col items-center pt-12 px-6 text-center"
              >
                <button 
                  onClick={() => setView('list')} 
                  className="absolute left-6 top-[52px] w-6 h-6 rounded-full border border-white flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"
                  style={{ pointerEvents: 'auto' }}
                >
                  <ChevronLeft size={14} strokeWidth={2.5} />
                </button>
                
                <h2 className="text-[17px] font-bold tracking-[0.05em] mb-10 mt-1">{selectedTeam?.name || selectedGroup?.name}</h2>
                
                <div className="w-[60px] h-[60px] shrink-0 rounded-full overflow-hidden bg-black/20 mb-8 border border-white/5 shadow-xl">
                  <img src={selectedTeam?.logo || logoPreview || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'} className="w-full h-full object-cover" alt="" />
                </div>
                
                <h1 className="text-[32px] font-bold tracking-[0.05em] uppercase mb-4">{selectedTeam?.name || selectedGroup?.name}</h1>
                
                <p className="text-[#E2E8F0] text-[13.5px] leading-[1.6] max-w-[280px] mb-8">
                  Copy the Link and Share the link wth Capture Player&apos;s data
                </p>

                <div className="w-full max-w-[340px] bg-[#1C2130] rounded-[16px] p-4 flex items-center justify-between border border-[#2C3140]">
                  <span className="text-[13px] text-white/80 truncate pr-4 text-left">http://www.gaffer.com/bowenfansleague/{selectedTeam?.name?.toLowerCase().replace(/\s+/g, '') || selectedGroup?.name?.toLowerCase().replace(/\s+/g, '')}1</span>
                  <button className="shrink-0 p-1 hover:bg-white/10 rounded transition-colors">
                    <Copy size={18} className="text-white" />
                  </button>
                </div>
              </motion.div>
            )}

            {view === 'select_team' && (
              <motion.div 
                key="select_team" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }}
                className="absolute inset-0 z-20 bg-[#181928] flex flex-col"
              >
                {/* Header */}
                <div className="flex flex-col items-center pt-12 pb-6 px-6 relative shrink-0">
                  <button 
                    onClick={() => setView('list')} 
                    className="absolute left-6 top-[52px] w-6 h-6 rounded-full border border-white flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <ChevronLeft size={14} strokeWidth={2.5} />
                  </button>
                  <h2 className="text-[17px] font-bold tracking-[0.05em] mb-4">Add Team to {selectedGroup?.name}</h2>
                </div>

                {/* Selection List */}
                <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-20">
                  <div className="bg-[#1C2130] border border-white/5 rounded-[24px] overflow-hidden">
                    <div className="p-5 border-b border-white/5 bg-white/5">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Available Teams</h3>
                    </div>
                    {teams.map((team) => (
                      <div 
                        key={team.id}
                        onClick={() => {
                          // Logic to add team to selectedGroup
                            if (selectedGroup) {
                              setGroups((prevGroups: Group[]) => prevGroups.map(g => 
                                g.id === selectedGroup.id 
                                  ? { ...g, teams: [...g.teams, team] } 
                                  : g
                              ))
                              setSelectedGroup((prev: Group | null) => prev ? { ...prev, teams: [...prev.teams, team] } : null) 
                            }
                          setView('list')
                        }}
                        className="px-6 py-4 flex items-center justify-between border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-black/20">
                            <img src={team.logo} className="w-full h-full object-cover" alt="" />
                          </div>
                          <span className="text-white text-sm font-bold uppercase tracking-widest">{team.name}</span>
                        </div>
                        <Plus size={20} className="text-gray-500" />
                      </div>
                    ))}
                    
                    {/* Create New Team Action */}
                    <button 
                      onClick={() => setView('create')}
                      className="w-full py-6 text-[#FF7A00] text-sm font-bold hover:bg-white/5 transition-colors border-t border-white/5"
                    >
                      Create New Team for Group
                    </button>
                  </div>
                </div>
              </motion.div>
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
