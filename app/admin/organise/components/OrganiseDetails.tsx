'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronUp, ChevronDown, Check, Plus, User, Trophy, Copy, Camera, X } from 'lucide-react'
import type { Team, Group, Player } from '../types'
import { useToastStore } from '@/store/toastStore'
import { useUIStore } from '@/store/uiStore'
import { Competition, removeCompetitionTeam } from '@/lib/services/competition.service'
import { ConfirmDialog } from '@/components/ConfirmDialog'

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
  onUploadPlayerPhoto?: (playerId: string, file: File) => Promise<void>
  onDeleteTeam?: () => void
  onDeleteGroup?: () => void
  onUpdatePlayer?: (playerId: string, payload: any) => void
  orgName?: string
  orgLogoUrl?: string
}

// ── Avatar helper ─────────────────────────────────────────────────────────────
// Shows a real photo (object-cover) or a neutral silhouette — no coloured bg.
function PlayerAvatar({ photo, size = 'md', jerseyNumber }: { photo?: string | null; size?: 'sm' | 'md' | 'lg', jerseyNumber?: string | number }) {
  const dim = size === 'sm' ? 'w-11 h-11' : size === 'lg' ? 'w-24 h-24' : 'w-11 h-11'
  const iconSize = size === 'lg' ? 32 : 20
  const hasRealPhoto = photo && !photo.includes('dicebear')
  return (
    <div className="relative shrink-0">
      <div className={`${dim} rounded-full overflow-hidden bg-[#1a1b2a] border border-white/[0.07] flex items-center justify-center`}>
        {hasRealPhoto ? (
          <img src={photo} className="w-full h-full object-cover" alt="" />
        ) : (
          <User size={iconSize} className="text-white/15" />
        )}
      </div>
      {jerseyNumber !== undefined && jerseyNumber !== '' && (
        <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-gaffer-orange rounded-full flex items-center justify-center border border-[#181928] shadow-lg px-1">
          <span className="text-[9px] font-black text-white">{jerseyNumber}</span>
        </div>
      )}
    </div>
  )
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
  onUploadPlayerPhoto,
  onDeleteTeam,
  onDeleteGroup,
  onUpdatePlayer,
  orgName,
  orgLogoUrl,
}: Props) {
  const toast = useToastStore()

  const [showDeleteTeamConfirm, setShowDeleteTeamConfirm] = useState(false)
  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState(false)
  const displayHeading = selectedTeam?.name || selectedGroup?.name || 'Detail'
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [tempPrice, setTempPrice] = useState('')
  const [showRecruitment, setShowRecruitment] = useState(false)
  const [isAddingPlayer, setIsAddingPlayer] = useState(false)
  const [newPlayer, setNewPlayer] = useState({ firstName: '', lastName: '', position: 'Forward', role: 'player', price: '7.5', jerseyNumber: '' })

  // ── Photo state for "Add Player" modal ──────────────────────────────────────
  const [newPlayerPhoto, setNewPlayerPhoto] = useState<File | null>(null)
  const [newPlayerPhotoPreview, setNewPlayerPhotoPreview] = useState<string | null>(null)
  const newPlayerPhotoRef = useRef<HTMLInputElement>(null)

  // ── Photo state for "Edit Player" modal ─────────────────────────────────────
  const [editPhotoUploading, setEditPhotoUploading] = useState(false)
  const editPhotoRef = useRef<HTMLInputElement>(null)

  const handleAddManual = () => {
    if (!newPlayer.firstName || !newPlayer.lastName) {
      toast.addToast('Name is required', 'error')
      return
    }

    // Check max players count
    const activeCount = players.filter(p => p.status === 'active').length
    const maxStr = selectedTeam?.playerCount.split('/')[1] || '0'
    const maxNum = parseInt(maxStr) || 25

    if (activeCount >= maxNum) {
      toast.addToast(`Team is full! Can't add more than ${maxNum} players.`, 'error')
      return
    }

    onAddPlayerManual?.({ 
      ...newPlayer, 
      price: parseFloat(newPlayer.price) || 0,
      jerseyNumber: newPlayer.jerseyNumber ? parseInt(newPlayer.jerseyNumber.toString()) : undefined,
      _photoFile: newPlayerPhoto ?? undefined 
    })
    setIsAddingPlayer(false)
    setNewPlayer({ firstName: '', lastName: '', position: 'Forward', role: 'player', price: '7.5', jerseyNumber: '' })
    setNewPlayerPhoto(null)
    setNewPlayerPhotoPreview(null)
  }

  const { hideNavbar, showNavbar } = useUIStore()

  useEffect(() => {
    if (isAddingPlayer || editingPlayer || showRecruitment) {
      hideNavbar()
    } else {
      showNavbar()
    }
  }, [isAddingPlayer, editingPlayer, showRecruitment, hideNavbar, showNavbar])

  const handleEditClick = (player: Player) => {
    setEditingPlayer(player)
    setTempPrice(player.price.replace('M', ''))
  }

  // Handle photo pick for the "new player" modal
  const handleNewPlayerPhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setNewPlayerPhoto(file)
    const url = URL.createObjectURL(file)
    setNewPlayerPhotoPreview(url)
  }

  const handleUpdatePlayer = async () => {
    if (!editingPlayer) return
    
    // Construct single payload
    const payload: any = {
      role: editingPlayer.role,
      squadStatus: editingPlayer.status,
      price: parseFloat(tempPrice) || 7.5,
      jerseyNumber: editingPlayer.jerseyNumber ? parseInt(editingPlayer.jerseyNumber.toString()) : undefined
    }

    onUpdatePlayer?.(editingPlayer.id, payload)
    setEditingPlayer(null)
  }

  // Handle photo pick / upload in the "edit player" modal
  const handleEditPlayerPhotoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editingPlayer || !selectedTeam) return
    if (!onUploadPlayerPhoto) {
      toast.addToast('Photo upload not available', 'error')
      return
    }
    setEditPhotoUploading(true)
    try {
      await onUploadPlayerPhoto(editingPlayer.id, file)
      const newUrl = URL.createObjectURL(file)
      setEditingPlayer({ ...editingPlayer, photo: newUrl })
      toast.addToast('Photo updated!', 'success')
    } catch {
      toast.addToast('Failed to upload photo', 'error')
    } finally {
      setEditPhotoUploading(false)
    }
  }

  return (
    <motion.div
      key="details"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-[#11121C] flex flex-col min-h-[100vh]"
    >
      {/* ── Header ── */}
      <div className="flex flex-col items-center pt-12 pb-6 px-4 md:px-6 relative shrink-0">
        <button
          onClick={onBack}
          className="absolute left-6 top-[48px] w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-all active:scale-95"
        >
          <ChevronLeft size={18} strokeWidth={2.5} className="text-white" />
        </button>
        <h2 className="text-[18px] font-inter font-bold uppercase tracking-widest text-center px-12 mt-1">
          {displayHeading}
        </h2>
        {selectedTeam && (
          <div className="mt-4 w-14 h-14 rounded-full overflow-hidden bg-[#1a1b2a] border border-white/10 shadow-2xl p-1.5 backdrop-blur-sm">
             <img
               src={selectedTeam.logo || '/images/mc_logo.png'}
               className="w-full h-full object-contain"
               alt=""
             />
          </div>
        )}
      </div>

      <div className="px-4 md:px-6 pb-8 space-y-4">
        {selectedTeam && (
          <div className="space-y-4">
            {/* Owner / Staff Row */}
            <div className="bg-[#1C1E2B] rounded-[20px] md:rounded-[24px] p-3 md:p-4 flex items-center gap-3 md:gap-4 border border-white/[0.03] shadow-lg">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden shrink-0 bg-[#3B82F6] flex items-center justify-center text-white font-bold text-base md:text-lg">
                {orgLogoUrl ? (
                  <img src={orgLogoUrl} className="w-full h-full object-cover" alt={orgName || 'Org'} />
                ) : (
                  (orgName || 'Olaniyi Ojedokun').charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-bold text-[14px] md:text-[16px] font-inter text-white truncate leading-tight">
                  {orgName || 'Olaniyi Ojedokun'}
                </h5>
                <p className="text-[10px] md:text-[11px] font-inter text-[#94A3B8] uppercase mt-0.5 tracking-wider font-semibold">THE GAFFER</p>
              </div>
              <button 
                className="text-[11px] md:text-[12px] font-inter font-bold text-[#FF5C00] pr-1 md:pr-2 hover:opacity-80 transition-opacity"
              >
                Add Price
              </button>
            </div>

             {/* Recruitment Link */}
            <AnimatePresence>
              {showRecruitment && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 md:px-6">
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-[10px]"
                    onClick={() => setShowRecruitment(false)}
                  />
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                    animate={{ scale: 1, opacity: 1, y: 0 }} 
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-[340px] bg-[#1C1D2B] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl p-5 space-y-4"
                  >
                     <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Recruitment Link</p>
                        <button onClick={() => setShowRecruitment(false)} className="text-white/20 hover:text-white"><X size={16} /></button>
                     </div>
                     <div className="flex items-center gap-3 bg-black/20 rounded-xl p-3 border border-white/5">
                        <span className="flex-1 text-[10px] text-white/30 font-bold truncate">
                          {(() => {
                            const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
                            const comp = slugify(competitions?.[0]?.name || 'tournament')
                            const grp = selectedGroup && selectedGroup.name ? slugify(selectedGroup.name) : null
                            const tm = selectedTeam?.handle || slugify(selectedTeam?.name || '')
                            return grp ? `${origin}/${comp}/${grp}/${tm}` : `${origin}/${comp}/${tm}`
                          })()}
                        </span>
                        <button 
                          onClick={() => {
                            const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
                            const comp = slugify(competitions?.[0]?.name || 'tournament')
                            const grp = selectedGroup && selectedGroup.name ? slugify(selectedGroup.name) : null
                            const tm = selectedTeam?.handle || slugify(selectedTeam?.name || '')
                            const link = grp ? `${origin}/${comp}/${grp}/${tm}` : `${origin}/${comp}/${tm}`
                            navigator.clipboard.writeText(link)
                            toast.addToast('Link copied!', 'success')
                          }}
                          className="shrink-0 text-gaffer-orange hover:text-white transition-colors"
                        >
                          <Copy size={16} />
                        </button>
                     </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between px-2 pt-4 pb-2">
               <h4 className="text-[12px] font-inter font-bold text-[#94A3B8] uppercase tracking-widest">Squad Roster</h4>
               <button 
                 onClick={() => setIsAddingPlayer(true)}
                 className="flex items-center gap-1.5 text-gaffer-orange hover:text-white transition-all active:scale-95"
               >
                 <Plus size={14} strokeWidth={3} />
                 <span className="text-[11px] font-inter font-bold uppercase tracking-widest">Manual Register</span>
               </button>
            </div>

            {/* Player Roster */}
            <div className="space-y-3">
            {players.length > 0 ? (
              players.map((player) => (
                <div key={player.id} className="flex items-center gap-2 md:gap-3">
                  <div
                    className="flex-1 bg-[#1C1E2B] border border-white/[0.03] rounded-[20px] md:rounded-[24px] p-3 md:p-4 flex items-center gap-3 md:gap-4 cursor-pointer hover:bg-white/[0.05] transition-colors shadow-sm"
                    onClick={() => handleEditClick(player)}
                  >
                    <div className="scale-90 md:scale-100 flex shrink-0">
                      <PlayerAvatar photo={player.photo} size="sm" jerseyNumber={player.jerseyNumber} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-[13px] md:text-[15px] font-inter text-white truncate leading-snug">{player.name}</h5>
                      <div className="flex items-center gap-1.5 md:gap-2 mt-0.5">
                        <p className={`text-[9px] md:text-[11px] font-inter font-medium ${
                          player.status === 'active' ? 'text-[#22C55E]' : 'text-[#94A3B8]'
                        }`}>
                          {player.role === 'coach' ? 'Staff' : player.position}
                        </p>
                        {player.role && player.role !== 'player' && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-white/10" />
                            <p className="text-[8px] md:text-[10px] font-bold uppercase text-gaffer-orange tracking-wider">{player.role}</p>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {player.role !== 'coach' && (
                      <div className="flex flex-col items-center gap-0.5 shrink-0 px-1 md:px-2 justify-center">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onPriceChange(player.id, true) }} 
                          className="text-white/30 hover:text-white transition-colors"
                        >
                           <ChevronUp size={14} strokeWidth={3} className="md:w-4 md:h-4" />
                        </button>
                        <span className="text-[12px] md:text-[14px] font-bold font-inter text-white tabular-nums leading-none min-w-[32px] md:min-w-[36px] text-center">
                           {player.price}
                        </span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onPriceChange(player.id, false) }} 
                          className="text-white/30 hover:text-white transition-colors"
                        >
                           <ChevronDown size={14} strokeWidth={3} className="md:w-4 md:h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onTogglePlayer(player.id)}
                    className={`w-7 h-7 md:w-8 md:h-8 rounded-[8px] md:rounded-[10px] flex items-center justify-center shrink-0 transition-all ${
                      !player.isSelected 
                        ? 'border border-white/10 bg-[#1C1E2B] text-white/30 hover:bg-white/5 hover:text-white/50' 
                        : 'border border-transparent bg-gradient-to-br from-[#FF5C00] to-[#FF2D20] text-white'
                    }`}
                  >
                    <Check size={14} strokeWidth={3} className="md:w-4 md:h-4" />
                  </button>
                </div>
              ))
            ) : null}
            </div>
          </div>
        )}

        {selectedGroup && !selectedTeam && (
           <div className="bg-[#1C1E2B] border border-white/5 rounded-[24px] p-6 space-y-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full shadow-inner border border-white/20" style={{ backgroundColor: selectedGroup.color }} />
                <h4 className="font-chakra font-black text-lg text-white uppercase tracking-wider">{selectedGroup.name}</h4>
              </div>
              <div className="space-y-3">
                {selectedGroup.teams.map((team: any) => (
                  <div key={team.id} className="flex items-center gap-4 p-4 bg-black/20 rounded-[16px] border border-white/5">
                    <div className="w-10 h-10 shrink-0 rounded-full overflow-hidden bg-[#1a1b2a] border border-white/10 shadow-sm">
                      <img src={team.logo} className="w-full h-full object-cover" alt="" />
                    </div>
                    <span className="text-white text-sm font-chakra font-black uppercase tracking-widest">{team.name}</span>
                  </div>
                ))}
              </div>
           </div>
        )}
      </div>

      {/* ── Action Bar ── */}
      <div className="px-4 md:px-6 pt-6 pb-32 mt-auto shrink-0 space-y-4">
        <button
          onClick={onBack}
          className="w-full h-15 bg-gradient-to-r from-[#FF5C00] to-[#FF2D20] text-white font-inter font-bold text-[16px] py-4 rounded-[20px] active:scale-[0.98] transition-all"
        >
          Save
        </button>

        {selectedTeam && (
          <button
            onClick={() => setShowDeleteTeamConfirm(true)}
            className="w-full py-4 rounded-[20px] border border-red-500/20 text-red-500/80 font-inter font-semibold text-[14px] hover:bg-red-500/10 transition-all"
          >
            Delete Team
          </button>
        )}

        {selectedGroup && !selectedTeam && (
          <button
            onClick={() => setShowDeleteGroupConfirm(true)}
            className="w-full py-4 rounded-[20px] border border-red-500/20 text-red-500/80 font-inter font-semibold text-[14px] hover:bg-red-500/10 transition-all"
          >
            Delete Group
          </button>
        )}
      </div>

      <ConfirmDialog
        open={showDeleteTeamConfirm}
        title="Delete Team?"
        message={`This will permanently delete "${selectedTeam?.name}" and all its squad members, invites, and tournament registrations.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          setShowDeleteTeamConfirm(false)
          onDeleteTeam?.()
        }}
        onCancel={() => setShowDeleteTeamConfirm(false)}
      />

      <ConfirmDialog
        open={showDeleteGroupConfirm}
        title="Delete Group?"
        message={`This will permanently delete the group "${selectedGroup?.name}". The teams themselves will not be deleted, but they will be unassigned.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          setShowDeleteGroupConfirm(false)
          onDeleteGroup?.()
        }}
        onCancel={() => setShowDeleteGroupConfirm(false)}
      />

      {/* ── Edit Player Modal ── */}
      <AnimatePresence>
        {editingPlayer && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 md:px-6">
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
                {/* Hidden file input */}
                <input
                  ref={editPhotoRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleEditPlayerPhotoPick}
                />

                <div className="bg-gradient-to-br from-gaffer-orange/20 to-transparent p-10 text-center space-y-3 border-b border-white/5">
                   {/* Avatar with camera overlay */}
                   <div className="relative w-24 h-24 mx-auto">
                     <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/5 ring-4 ring-gaffer-orange/10 bg-[#11121C] flex items-center justify-center">
                       {editingPlayer.photo && !editingPlayer.photo.includes('dicebear') ? (
                         <img src={editingPlayer.photo} className="w-full h-full object-cover" alt="" />
                       ) : (
                         <User size={32} className="text-white/10" />
                       )}
                     </div>
                     {/* Status dot */}
                     <div className={`absolute bottom-0.5 right-0.5 w-6 h-6 rounded-full border-4 border-[#1C1D2B] ${
                       editingPlayer.status === 'active' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                     }`} />
                     {/* Camera button */}
                     <button
                       onClick={() => editPhotoRef.current?.click()}
                       disabled={editPhotoUploading}
                       className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-gaffer-orange text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-full shadow-lg hover:bg-orange-500 transition-colors disabled:opacity-50"
                     >
                       {editPhotoUploading ? (
                         <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                       ) : (
                         <Camera size={9} />
                       )}
                       {editPhotoUploading ? 'Uploading…' : 'Photo'}
                     </button>
                   </div>

                   <h3 className="font-black text-white text-xl uppercase tracking-tighter pt-6">{editingPlayer.name}</h3>
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
                    className="w-full h-16 rounded-[22px] bg-gradient-to-r from-gaffer-orange to-[#FF4D00] text-white font-black uppercase tracking-[0.25em] active:scale-95 transition-all text-sm"
                  >
                    Done
                  </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Add New Player Modal (Squad Recruitment) ── */}
      <AnimatePresence>
        {isAddingPlayer && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 md:px-6">
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
                {/* Hidden file input for new player photo */}
                <input
                  ref={newPlayerPhotoRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleNewPlayerPhotoPick}
                />

                <div className="bg-gradient-to-br from-gaffer-orange/20 to-transparent p-8 text-center border-b border-white/5">
                   {/* Photo picker */}
                   <button
                     onClick={() => newPlayerPhotoRef.current?.click()}
                     className="relative w-20 h-20 mx-auto mb-4 group"
                   >
                     <div className="w-20 h-20 rounded-full overflow-hidden bg-[#11121C] border-2 border-white/10 border-dashed group-hover:border-gaffer-orange/40 transition-colors flex items-center justify-center">
                       {newPlayerPhotoPreview ? (
                         <img src={newPlayerPhotoPreview} className="w-full h-full object-cover" alt="" />
                       ) : (
                         <div className="flex flex-col items-center gap-1">
                           <Camera size={18} className="text-white/20 group-hover:text-gaffer-orange/60 transition-colors" />
                           <span className="text-[7px] font-black text-white/20 group-hover:text-gaffer-orange/60 uppercase tracking-widest transition-colors">Photo</span>
                         </div>
                       )}
                     </div>
                     {newPlayerPhotoPreview && (
                       <button
                         onClick={(e) => { e.stopPropagation(); setNewPlayerPhoto(null); setNewPlayerPhotoPreview(null) }}
                         className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
                       >
                         <X size={10} className="text-white" />
                       </button>
                     )}
                   </button>

                   <h3 className="font-black text-white text-lg uppercase tracking-[0.1em]">Squad Recruitment</h3>
                   <p className="text-[9px] text-white/30 uppercase tracking-[0.3em] mt-1 font-black">Direct Registration</p>
                </div>

                <div className="p-8 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">First Name</label>
                      <input 
                        value={newPlayer.firstName}
                        onChange={e => setNewPlayer({...newPlayer, firstName: e.target.value})}
                        placeholder="John"
                        className="w-full bg-[#11121C] border border-white/5 rounded-2xl py-3 px-4 text-[12px] text-white outline-none focus:border-gaffer-orange/30 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Last Name</label>
                      <input 
                        value={newPlayer.lastName}
                        onChange={e => setNewPlayer({...newPlayer, lastName: e.target.value})}
                        placeholder="Doe"
                        className="w-full bg-[#11121C] border border-white/5 rounded-2xl py-3 px-4 text-[12px] text-white outline-none focus:border-gaffer-orange/30 transition-all"
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
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Position</label>
                          <select 
                            value={newPlayer.position}
                            onChange={e => setNewPlayer({...newPlayer, position: e.target.value})}
                            className="w-full bg-[#11121C] border border-white/5 rounded-2xl py-3 px-4 text-[11px] font-black uppercase text-white outline-none focus:border-gaffer-orange/30 cursor-pointer"
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
                          <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Jersey #</label>
                          <input 
                            type="number"
                            min={1}
                            max={99}
                            value={newPlayer.jerseyNumber}
                            onChange={e => setNewPlayer({...newPlayer, jerseyNumber: e.target.value})}
                            placeholder="10"
                            className="w-full bg-[#11121C] border border-white/5 rounded-2xl py-3 px-4 text-[12px] text-white outline-none focus:border-gaffer-orange/30 transition-all font-black"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Market Price (M)</label>
                        <input 
                          type="number"
                          step="0.1"
                          value={newPlayer.price}
                          onChange={e => setNewPlayer({...newPlayer, price: e.target.value})}
                          className="w-full bg-[#11121C] border border-white/5 rounded-2xl py-3 px-4 text-[12px] text-white outline-none focus:border-gaffer-orange/30 transition-all font-black"
                        />
                      </div>
                    </>
                  )}

                  <div className="pt-3">
                     <button 
                       onClick={handleAddManual}
                       className="w-full h-16 rounded-[22px] bg-gradient-to-r from-gaffer-orange to-[#FF4D00] text-white font-black uppercase tracking-[0.4em] active:scale-95 transition-all text-sm"
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
