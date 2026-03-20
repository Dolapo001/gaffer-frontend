'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronUp, ChevronDown, Check, Plus, User, Trophy, Copy } from 'lucide-react'
import type { Team, Group, Player } from '../types'
import { useToastStore } from '@/store/toastStore'
import { useUIStore } from '@/store/uiStore'
import { Competition } from '@/lib/services/competition.service'

const slugify = (text: string) => text.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]+/g, '')

interface Props {
  selectedTeam: Team | null
  selectedGroup: Group | null
  players: Player[]
  competitions?: Competition[]
  onBack: () => void
  onShare: () => void
  onAddTeams: () => void
  onTogglePlayer: (id: string) => void
  onPriceChange: (id: string, increment: boolean) => void
  onRoleChange: (id: string, role: 'player' | 'captain' | 'coach') => void
  onStatusChange: (id: string, status: 'active' | 'injured' | 'suspended') => void
  onAddToTournament?: (teamId: string, competitionId: string) => void
  onAddPlayerManual?: (data: any) => void
  orgName?: string
}

export function OrganiseDetails({
  selectedTeam,
  selectedGroup,
  players,
  competitions = [],
  onBack,
  onShare,
  onAddTeams,
  onTogglePlayer,
  onPriceChange,
  onRoleChange,
  onStatusChange,
  onAddToTournament,
  onAddPlayerManual,
  orgName
}: Props) {
  const toast = useToastStore()
  
  // Find which group this team belongs to if we are in team view
  const displayHeading = selectedTeam?.name || selectedGroup?.name || 'Detail'
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [tempPrice, setTempPrice] = useState('')
  const [showRecruitment, setShowRecruitment] = useState(false)
  const [isAddingPlayer, setIsAddingPlayer] = useState(false)
  const [newPlayer, setNewPlayer] = useState({ firstName: '', lastName: '', position: 'Forward', role: 'player', price: '7.5' })

  const handleAddManual = () => {
    if (!newPlayer.firstName || !newPlayer.lastName) {
      toast.addToast('Name is required', 'error')
      return
    }
    onAddPlayerManual?.(newPlayer)
    setIsAddingPlayer(false)
    setNewPlayer({ firstName: '', lastName: '', position: 'Forward', role: 'player', price: '7.5' })
  }

  const openEditModal = (player: Player) => {
    setEditingPlayer(player)
    setTempPrice(parseFloat(player.price || '7.5').toString())
  }

  const { showNavbar } = useUIStore()

  useEffect(() => {
    showNavbar()
  }, [showNavbar])

  return (
    <motion.div
      key="details"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute inset-0 z-20 bg-[#11121C] flex flex-col"
    >
      {/* ── Header ── */}
      <div className="flex flex-col items-center pt-8 pb-4 px-6 relative shrink-0">
        <button
          onClick={onBack}
          className="absolute left-6 top-[34px] w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all"
        >
          <ChevronLeft size={18} strokeWidth={2.5} className="text-white" />
        </button>
        <h2 className="text-[16px] font-bold uppercase text-white tracking-[0.2em] text-center px-12">
          {displayHeading}
        </h2>
        {selectedTeam && (
          <div className="mt-3 w-10 h-10 rounded-full overflow-hidden bg-white/5 border border-white/10 shadow-lg p-1.5 backdrop-blur-sm">
             <img
               src={selectedTeam.logo || '/images/mc_logo.png'}
               className="w-full h-full object-contain"
               alt=""
             />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-44 no-scrollbar space-y-2.5">
        {selectedTeam && (
          <div className="space-y-2">
            {/* Owner / Staff Row */}
            <div className="bg-[#1C1E2B] rounded-2xl p-3.5 flex items-center gap-4 border border-white/[0.03]">
              <div className="w-11 h-11 rounded-full bg-[#73B9E7] flex items-center justify-center shrink-0 overflow-hidden" />
              <div className="flex-1 min-w-0">
                <h5 className="font-bold text-[15px] text-white truncate leading-tight">
                  {orgName || 'The Gaffer'}
                </h5>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider mt-0.5">THE GAFFER</p>
              </div>
              <button 
                onClick={() => setShowRecruitment(true)}
                className="text-[10px] font-bold text-gaffer-orange pr-1 hover:opacity-80 transition-opacity uppercase tracking-widest"
              >
                Add Price
              </button>
            </div>

            {/* Recruitment View (Triggered by Add Price) */}
            <AnimatePresence>
              {showRecruitment && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-[#1C2130] border border-white/10 rounded-2xl p-5 mb-2 space-y-4">
                     <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Recruitment Link</p>
                        <button onClick={() => setShowRecruitment(false)} className="text-white/20 hover:text-white"><Plus size={16} className="rotate-45" /></button>
                     </div>
                     <div className="flex items-center gap-3 bg-black/20 rounded-xl p-3 border border-white/5">
                        <span className="flex-1 text-[10px] text-white/30 font-bold truncate">
                          {`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${slugify(competitions?.[0]?.name || 'tournament')}/${slugify(selectedGroup?.name || 'unassigned')}/${selectedTeam.handle || slugify(selectedTeam.name)}`}
                        </span>
                        <button 
                          onClick={() => {
                            const link = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${slugify(competitions?.[0]?.name || 'tournament')}/${slugify(selectedGroup?.name || 'unassigned')}/${selectedTeam.handle || slugify(selectedTeam.name)}`
                            navigator.clipboard.writeText(link)
                            toast.addToast('Link copied!', 'success')
                          }}
                          className="shrink-0 text-gaffer-orange hover:text-white transition-colors"
                        >
                          <Copy size={16} />
                        </button>
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between px-2 pt-2">
               <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Squad Roster</h4>
               <button 
                 onClick={() => setIsAddingPlayer(true)}
                 className="flex items-center gap-1.5 text-gaffer-orange/60 hover:text-gaffer-orange transition-all active:scale-95"
               >
                 <Plus size={12} strokeWidth={3} />
                 <span className="text-[9px] font-black uppercase tracking-widest">Manual Add</span>
               </button>
            </div>

            {/* Player Roster */}
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-3"
              >
                <div
                  className="flex-1 bg-[#1C1E2B] border border-white/[0.03] rounded-2xl p-3.5 flex items-center gap-4 cursor-pointer hover:bg-white/[0.05] transition-colors"
                  onClick={() => openEditModal(player)}
                >
                  <div className="w-11 h-11 rounded-full bg-[#2A2D45] flex items-center justify-center shrink-0 overflow-hidden border border-white/5 ring-1 ring-white/[0.02]">
                    {player.photo && !player.photo.includes('dicebear') ? (
                      <img src={player.photo} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#2A2D45]">
                        <User size={20} className="text-white/20" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-[14px] text-white truncate leading-snug">
                      {player.name}
                    </h5>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className={`text-[9px] uppercase font-black tracking-[0.05em] ${
                        player.status === 'active' ? 'text-[#22C55E]' : 'text-white/40'
                      }`}>
                        {player.role === 'coach' ? 'Staff' : player.position}
                      </p>
                      {player.role && player.role !== 'player' && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-white/10" />
                          <p className="text-[9px] font-black uppercase text-gaffer-orange tracking-widest">
                            {player.role}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {player.role !== 'coach' && (
                    <div className="flex flex-col items-center gap-0.5 shrink-0 px-2 group">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onPriceChange(player.id, true) }} 
                        className="text-white/10 hover:text-white transition-colors"
                      >
                         <ChevronUp size={12} strokeWidth={4} />
                      </button>
                      <span className="text-[12px] font-black text-white tabular-nums leading-none min-w-[36px] text-center tracking-tight">
                         {player.price}
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onPriceChange(player.id, false) }} 
                        className="text-white/10 hover:text-white transition-colors"
                      >
                         <ChevronDown size={12} strokeWidth={4} />
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onTogglePlayer(player.id)}
                  className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all ${
                    !player.isSelected 
                      ? 'border-white/10 bg-transparent text-transparent' 
                      : 'border-gaffer-orange bg-gradient-to-br from-gaffer-orange to-[#FF4D00] text-white shadow-lg shadow-gaffer-orange/20'
                  }`}
                >
                  <Check size={16} strokeWidth={4} />
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedGroup && !selectedTeam && (
           <div className="bg-[#1C1E2B] border border-white/5 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedGroup.color }} />
                <h4 className="font-bold text-white uppercase tracking-wider">{selectedGroup.name}</h4>
              </div>
              <div className="space-y-3">
                {selectedGroup.teams.map((team: any) => (
                  <div key={team.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="w-6 h-6 shrink-0 rounded-full overflow-hidden bg-[#2A2D45] p-1 border border-white/10">
                      <img src={team.logo} className="w-full h-full object-contain" alt="" />
                    </div>
                    <span className="text-white text-sm font-bold uppercase tracking-tight">
                      {team.name}
                    </span>
                  </div>
                ))}
              </div>
           </div>
        )}
      </div>

      {/* ── Action Bar ── */}
      <div className="px-6 pt-6 pb-[140px] shrink-0 border-t border-white/[0.05] bg-[#11121C]">
        <button
          onClick={onBack}
          className="w-full h-15 bg-gradient-to-r from-[#FF8A00] to-[#FF2D20] text-white font-black text-[15px] py-4 rounded-[14px] shadow-[0_8px_30px_rgb(255,45,32,0.3)] active:scale-[0.98] transition-all uppercase tracking-[0.15em]"
        >
          Save
        </button>
      </div>

      {/* ── Edit Player Modal ── */}
      <AnimatePresence>
        {editingPlayer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/80 backdrop-blur-[10px]"
               onClick={() => setEditingPlayer(null)}
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }} 
               animate={{ scale: 1, opacity: 1, y: 0 }} 
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="relative w-full max-w-[340px] bg-[#1C1D2B] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl"
             >
                <div className="bg-gradient-to-br from-gaffer-orange/20 to-transparent p-10 text-center space-y-3 border-b border-white/5">
                   <div className="w-24 h-24 rounded-full bg-[#11121C] border-4 border-white/5 mx-auto flex items-center justify-center shadow-2xl relative overflow-hidden ring-4 ring-gaffer-orange/10">
                      {editingPlayer.photo && !editingPlayer.photo.includes('dicebear') ? (
                        <img src={editingPlayer.photo} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#11121C]">
                           <User size={32} className="text-white/10" />
                        </div>
                      )}
                      <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-4 border-[#1C1D2B] ${
                        editingPlayer.status === 'active' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                      }`} />
                   </div>
                   <h3 className="font-black text-white text-xl uppercase tracking-tighter pt-3">{editingPlayer.name}</h3>
                   <p className="text-gaffer-orange font-black text-[10px] uppercase tracking-[0.4em]">{editingPlayer.position}</p>
                </div>

                <div className="p-8 space-y-6">
                  {editingPlayer.role !== 'coach' ? (
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Role</label>
                           <select 
                              value={editingPlayer.role}
                              onChange={e => {
                                 onRoleChange(editingPlayer.id, e.target.value as any)
                                 setEditingPlayer({...editingPlayer, role: e.target.value as any})
                              }}
                              className="w-full bg-[#11121C] border border-white/5 rounded-2xl py-3.5 px-4 text-[12px] font-black uppercase text-white outline-none focus:border-gaffer-orange/30 transition-all cursor-pointer"
                           >
                              <option value="player">Player</option>
                              <option value="captain">Captain</option>
                              <option value="coach">Coach</option>
                           </select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Status</label>
                           <select 
                              value={editingPlayer.status}
                              onChange={e => {
                                 onStatusChange(editingPlayer.id, e.target.value as any)
                                 setEditingPlayer({...editingPlayer, status: e.target.value as any})
                              }}
                              className="w-full bg-[#11121C] border border-white/5 rounded-2xl py-3.5 px-4 text-[12px] font-black uppercase text-white outline-none focus:border-gaffer-orange/30 transition-all cursor-pointer"
                           >
                              <option value="active">Active</option>
                              <option value="injured">Injured</option>
                              <option value="suspended">Suspended</option>
                           </select>
                        </div>
                     </div>
                  ) : (
                     <div className="space-y-6">
                        <div className="bg-gaffer-orange/[0.05] border border-gaffer-orange/10 rounded-2xl p-5 text-center">
                           <p className="text-gaffer-orange font-black text-[11px] uppercase tracking-[0.2em]">Coaching Staff</p>
                           <p className="text-[10px] text-white/30 mt-2 leading-relaxed">Staff members do not have market valuation or on-field positions.</p>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Change Position</label>
                           <select 
                              value={editingPlayer.role}
                              onChange={e => {
                                 onRoleChange(editingPlayer.id, e.target.value as any)
                                 setEditingPlayer({...editingPlayer, role: e.target.value as any})
                              }}
                              className="w-full bg-[#11121C] border border-white/5 rounded-2xl py-3.5 px-4 text-[12px] font-black uppercase text-white outline-none focus:border-gaffer-orange/30 transition-all cursor-pointer"
                           >
                              <option value="coach">Coach</option>
                              <option value="player">Player</option>
                              <option value="captain">Captain</option>
                           </select>
                        </div>
                     </div>
                  )}
                  <button 
                    onClick={() => setEditingPlayer(null)}
                    className="w-full h-16 rounded-[22px] bg-gradient-to-r from-gaffer-orange to-[#FF4D00] text-white font-black uppercase tracking-[0.25em] shadow-[0_8px_30px_rgba(255,102,0,0.25)] active:scale-95 transition-all text-sm"
                  >
                    Done
                  </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Add New Player Modal ── */}
      <AnimatePresence>
        {isAddingPlayer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/80 backdrop-blur-[10px]"
               onClick={() => setIsAddingPlayer(false)}
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }} 
               animate={{ scale: 1, opacity: 1, y: 0 }} 
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="relative w-full max-w-[380px] bg-[#1C1D2B] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl"
             >
                <div className="bg-gradient-to-br from-gaffer-orange/20 to-transparent p-8 text-center border-b border-white/5">
                   <h3 className="font-black text-white text-lg uppercase tracking-[0.1em]">Squad Recruitment</h3>
                   <p className="text-[9px] text-white/30 uppercase tracking-[0.3em] mt-2 font-black">Direct Registration</p>
                </div>

                <div className="p-8 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">First Name</label>
                      <input 
                        value={newPlayer.firstName}
                        onChange={e => setNewPlayer({...newPlayer, firstName: e.target.value})}
                        placeholder="John"
                        className="w-full bg-[#11121C] border border-white/5 rounded-2xl py-3.5 px-4 text-[12px] text-white outline-none focus:border-gaffer-orange/30 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Last Name</label>
                      <input 
                        value={newPlayer.lastName}
                        onChange={e => setNewPlayer({...newPlayer, lastName: e.target.value})}
                        placeholder="Doe"
                        className="w-full bg-[#11121C] border border-white/5 rounded-2xl py-3.5 px-4 text-[12px] text-white outline-none focus:border-gaffer-orange/30 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Role</label>
                    <div className="grid grid-cols-3 gap-2">
                       {['player', 'captain', 'coach'].map(role => (
                          <button
                            key={role}
                            onClick={() => setNewPlayer({...newPlayer, role})}
                            className={`py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                               newPlayer.role === role 
                               ? 'bg-gaffer-orange border-gaffer-orange text-white' 
                               : 'bg-[#11121C] border-white/5 text-white/40 hover:border-white/20'
                            }`}
                          >
                             {role}
                          </button>
                       ))}
                    </div>
                  </div>

                  {newPlayer.role !== 'coach' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Position</label>
                        <select 
                          value={newPlayer.position}
                          onChange={e => setNewPlayer({...newPlayer, position: e.target.value})}
                          className="w-full bg-[#11121C] border border-white/5 rounded-2xl py-3.5 px-4 text-[11px] font-black uppercase text-white outline-none focus:border-gaffer-orange/30 cursor-pointer"
                        >
                          <option>Goalkeeper</option>
                          <option>Defender</option>
                          <option>Midfielder</option>
                          <option>Forward</option>
                          <option>Center-Back</option>
                          <option>Full-Back</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Market Price (M)</label>
                        <input 
                          type="number"
                          step="0.1"
                          value={newPlayer.price}
                          onChange={e => setNewPlayer({...newPlayer, price: e.target.value})}
                          className="w-full bg-[#11121C] border border-white/5 rounded-2xl py-3.5 px-4 text-[12px] text-white outline-none focus:border-gaffer-orange/30 transition-all font-black"
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-3">
                     <button 
                       onClick={handleAddManual}
                       className="w-full h-16 rounded-[22px] bg-gradient-to-r from-gaffer-orange to-[#FF4D00] text-white font-black uppercase tracking-[0.4em] shadow-[0_8px_30px_rgba(255,102,0,0.3)] active:scale-95 transition-all text-sm"
                     >
                       Register Player
                     </button>
                  </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
