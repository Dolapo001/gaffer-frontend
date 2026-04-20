'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronUp, ChevronDown, Check, Plus, User, Trophy, Copy, Camera, X, Pencil, Trash2, ImageIcon, Mail, Link2 } from 'lucide-react'
import type { Team, Group, Player } from '../types'
import type { Team as BackendTeam, TeamPhoto } from '@/lib/services/team.service'
import { useToastStore } from '@/store/toastStore'
import { useUIStore } from '@/store/uiStore'
import { Competition, removeCompetitionTeam } from '@/lib/services/competition.service'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { InvitePlayerModal } from '@/components/InvitePlayerModal'

const slugify = (text: string) => text.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]+/g, '')

interface Props {
  selectedTeam: Team | null
  selectedTeamDetail?: BackendTeam | null
  selectedGroup: Group | null
  players: Player[]
  teamPhotos?: TeamPhoto[]
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
  onUpdateTeam?: (payload: any) => void
  onUploadTeamPhoto?: (file: File) => void
  onDeleteTeamPhoto?: (photoId: string) => void
  onRegisterTeam?: (competitionId: string) => void
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
  selectedTeamDetail,
  selectedGroup,
  players,
  teamPhotos = [],
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
  onUpdateTeam,
  onUploadTeamPhoto,
  onDeleteTeamPhoto,
  onRegisterTeam,
  onDeleteTeam,
  onDeleteGroup,
  onUpdatePlayer,
  orgName,
  orgLogoUrl,
}: Props) {
  const toast = useToastStore()

  const [showDeleteTeamConfirm, setShowDeleteTeamConfirm] = useState(false)
  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState(false)
  const [showEditTeam, setShowEditTeam] = useState(false)
  const [editTeamName, setEditTeamName] = useState('')
  const [showPhotos, setShowPhotos] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)

  const handleGetRecruitmentLink = async () => {
    if (!selectedTeam || isGeneratingLink) return
    const handle = selectedTeam.handle || slugify(selectedTeam.name)
    if (!handle) {
      toast.addToast('Team has no handle — cannot generate link', 'error')
      return
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const fullLink = `${origin}/recruit/${handle}`
    setIsGeneratingLink(true)
    try {
      await navigator.clipboard.writeText(fullLink)
      toast.addToast('Recruitment link copied!', 'success')
    } catch {
      toast.addToast('Could not copy to clipboard', 'error')
    } finally {
      setIsGeneratingLink(false)
    }
  }
  const [deletePhotoTarget, setDeletePhotoTarget] = useState<string | null>(null)
  const teamPhotoInputRef = useRef<HTMLInputElement>(null)
  const displayHeading = selectedTeam?.name || selectedGroup?.name || 'Detail'
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [tempPrice, setTempPrice] = useState('')
  const [showRecruitment, setShowRecruitment] = useState(false)
  const [isAddingPlayer, setIsAddingPlayer] = useState(false)
  const [newPlayer, setNewPlayer] = useState({ firstName: '', lastName: '', position: 'FWD', role: 'player', jerseyNumber: '' })

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
      jerseyNumber: newPlayer.jerseyNumber ? parseInt(newPlayer.jerseyNumber.toString()) : undefined,
      _photoFile: newPlayerPhoto ?? undefined
    })
    setIsAddingPlayer(false)
    setNewPlayer({ firstName: '', lastName: '', position: 'FWD', role: 'player', jerseyNumber: '' })
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
    return () => showNavbar()
  }, [isAddingPlayer, editingPlayer, showRecruitment, hideNavbar, showNavbar])

  const handleEditClick = (player: Player) => {
    setEditingPlayer(player)
    setTempPrice(String(player.price ?? '').replace('M', ''))
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
          <div className="mt-3 w-10 h-10 rounded-full overflow-hidden bg-[#1a1b2a] border border-white/10 shadow-lg p-1.5 backdrop-blur-sm">
             <img
               src={selectedTeam.logo || '/images/mc_logo.png'}
               className="w-full h-full object-contain"
               alt=""
             />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 no-scrollbar space-y-2.5">
        {selectedTeam && (
          <div className="space-y-2">
            {/* Owner / Staff Row */}
            <div className="bg-[#1C1E2B] rounded-2xl p-3.5 flex items-center gap-4 border border-white/[0.03]">
              <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 bg-[#1a1b2a] border border-white/[0.07] flex items-center justify-center">
                {orgLogoUrl ? (
                  <img src={orgLogoUrl} className="w-full h-full object-cover" alt={orgName || 'Org'} />
                ) : (
                  <User size={20} className="text-white/15" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-bold text-[15px] text-white truncate leading-tight">
                  {orgName || 'The Gaffer'}
                </h5>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider mt-0.5">THE GAFFER</p>
              </div>
              <button 
                onClick={() => {
                  if (!selectedTeam) return
                  const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
                  const comp = slugify(competitions?.[0]?.name || 'tournament')
                  const grp = selectedGroup && selectedGroup.name ? slugify(selectedGroup.name) : null
                  const tm = selectedTeam.handle || slugify(selectedTeam.name)
                  const link = grp ? `${origin}/${comp}/${grp}/${tm}` : `${origin}/${comp}/${tm}`
                  navigator.clipboard.writeText(link)
                  toast.addToast('Recruitment link copied!', 'success')
                  setShowRecruitment(true)
                }}
                className="text-[10px] font-bold text-gaffer-orange pr-1 hover:opacity-80 transition-opacity uppercase tracking-widest"
              >
                Copy Link
              </button>
            </div>

             {/* Recruitment Link */}
            <AnimatePresence>
              {showRecruitment && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center px-6">
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

            {/* Edit Team + Register + Delete Row */}
            <div className="flex gap-2">
              {onUpdateTeam && (
                <button
                  onClick={() => { setEditTeamName(selectedTeam?.name || ''); setShowEditTeam(true) }}
                  className="flex-1 flex items-center justify-center gap-1.5 h-10 bg-[#1C1E2B] border border-white/[0.03] rounded-xl text-white/40 hover:text-white hover:border-white/10 transition-all"
                >
                  <Pencil size={12} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Edit</span>
                </button>
              )}
              {onRegisterTeam && competitions.length > 0 && (
                <button
                  onClick={() => onRegisterTeam(competitions[0]._id)}
                  className="flex-1 flex items-center justify-center gap-1.5 h-10 bg-[#1C1E2B] border border-white/[0.03] rounded-xl text-white/40 hover:text-gaffer-orange hover:border-gaffer-orange/20 transition-all"
                >
                  <Trophy size={12} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Register</span>
                </button>
              )}
              {selectedTeam && (
                <button
                  onClick={() => setShowDeleteTeamConfirm(true)}
                  className="flex-[0.5] max-w-[80px] flex items-center justify-center gap-1.5 h-10 bg-[#1C1E2B] border border-red-500/10 rounded-xl text-red-500/60 hover:text-red-500 hover:bg-red-500/5 hover:border-red-500/20 transition-all"
                  title="Delete Team"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            {/* Team Photos Section */}
            {(teamPhotos.length > 0 || onUploadTeamPhoto) && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowPhotos(p => !p)}
                  className="flex items-center justify-between w-full px-2 pt-1"
                >
                  <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Team Photos</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-white/20 font-bold">{teamPhotos.length}</span>
                    {showPhotos ? <ChevronUp size={12} className="text-white/20" /> : <ChevronDown size={12} className="text-white/20" />}
                  </div>
                </button>
                {showPhotos && (
                  <div className="grid grid-cols-3 gap-2">
                    {teamPhotos.map(photo => (
                      <div key={photo._id} className="relative aspect-square rounded-xl overflow-hidden group">
                        <img src={photo.url} className="w-full h-full object-cover" alt="" />
                        {onDeleteTeamPhoto && (
                          <button
                            onClick={() => setDeletePhotoTarget(photo._id)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <Trash2 size={16} className="text-red-400" />
                          </button>
                        )}
                      </div>
                    ))}
                    {onUploadTeamPhoto && (
                      <label className="aspect-square rounded-xl bg-[#1C1E2B] border border-dashed border-white/10 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-gaffer-orange/30 transition-colors">
                        <input ref={teamPhotoInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onUploadTeamPhoto(f) }} />
                        <ImageIcon size={18} className="text-white/20" />
                        <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">Upload</span>
                      </label>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between px-2 pt-2">
               <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Squad Roster</h4>
               <div className="flex items-center gap-3">
                 <button
                   onClick={handleGetRecruitmentLink}
                   disabled={isGeneratingLink}
                   className="flex items-center gap-1.5 text-white/30 hover:text-gaffer-orange transition-all active:scale-95 disabled:opacity-40"
                   title="Copy open recruitment link"
                 >
                   <Link2 size={12} strokeWidth={2.5} />
                   <span className="text-[9px] font-black uppercase tracking-widest">
                     {isGeneratingLink ? '…' : 'Recruit'}
                   </span>
                 </button>
                 <button
                   onClick={() => setShowInviteModal(true)}
                   className="flex items-center gap-1.5 text-white/30 hover:text-gaffer-orange transition-all active:scale-95"
                 >
                   <Mail size={12} strokeWidth={2.5} />
                   <span className="text-[9px] font-black uppercase tracking-widest">Invite</span>
                 </button>
                 <button
                   onClick={() => setIsAddingPlayer(true)}
                   className="flex items-center gap-1.5 text-gaffer-orange/60 hover:text-gaffer-orange transition-all active:scale-95"
                 >
                   <Plus size={12} strokeWidth={3} />
                   <span className="text-[9px] font-black uppercase tracking-widest">Manual Add</span>
                 </button>
               </div>
            </div>

            {/* Player Roster */}
            {players.length > 0 ? (
              players.map((player) => (
                <div key={player.id} className="flex items-center gap-3">
                  <div
                    className="flex-1 bg-[#1C1E2B] border border-white/[0.03] rounded-2xl p-3.5 flex items-center gap-4 cursor-pointer hover:bg-white/[0.05] transition-colors"
                    onClick={() => handleEditClick(player)}
                  >
                    <PlayerAvatar photo={player.photo} size="sm" jerseyNumber={player.jerseyNumber} />

                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-[14px] text-white truncate leading-snug">{player.name}</h5>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className={`text-[9px] uppercase font-black tracking-[0.05em] ${
                          player.status === 'active' ? 'text-[#22C55E]' : 'text-white/40'
                        }`}>
                          {player.role === 'coach' ? 'Staff' : player.position}
                        </p>
                        {player.role && player.role !== 'player' && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-white/10" />
                            <p className="text-[9px] font-black uppercase text-gaffer-orange tracking-widest">{player.role}</p>
                          </>
                        )}
                      </div>
                    </div>
                    
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
              ))
            ) : null}
          </div>
        )}

        {selectedGroup && !selectedTeam && (
           <div className="bg-[#1C1E2B] border border-white/5 rounded-2xl p-6 space-y-4 relative">
              <button 
                onClick={() => setShowDeleteGroupConfirm(true)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                title="Delete Group"
              >
                 <Trash2 size={13} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedGroup.color }} />
                <h4 className="font-bold text-white uppercase tracking-wider">{selectedGroup.name}</h4>
              </div>
              <div className="space-y-3">
                {selectedGroup.teams.map((team: any) => (
                  <div key={team.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="w-6 h-6 shrink-0 rounded-full overflow-hidden bg-[#1a1b2a] border border-white/10 p-1">
                      <img src={team.logo} className="w-full h-full object-contain" alt="" />
                    </div>
                    <span className="text-white text-sm font-bold uppercase tracking-tight">{team.name}</span>
                  </div>
                ))}
              </div>
           </div>
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

      <ConfirmDialog
        open={!!deletePhotoTarget}
        title="Delete Photo?"
        message="This photo will be permanently removed from the team gallery."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deletePhotoTarget) onDeleteTeamPhoto?.(deletePhotoTarget)
          setDeletePhotoTarget(null)
        }}
        onCancel={() => setDeletePhotoTarget(null)}
      />

      {/* ── Edit Team Modal ── */}
      <AnimatePresence>
        {showEditTeam && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-[10px]"
              onClick={() => setShowEditTeam(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-[340px] bg-[#1C1D2B] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl p-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Edit Team</p>
                <button onClick={() => setShowEditTeam(false)} className="text-white/20 hover:text-white"><X size={16} /></button>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Team Name</label>
                <input
                  value={editTeamName}
                  onChange={e => setEditTeamName(e.target.value)}
                  placeholder="Enter team name"
                  className="w-full bg-[#11121C] border border-white/5 rounded-2xl py-3.5 px-4 text-[13px] font-bold text-white outline-none focus:border-gaffer-orange/30 transition-all"
                />
              </div>
              <button
                onClick={() => {
                  if (!editTeamName.trim()) return
                  onUpdateTeam?.({ name: editTeamName.trim() })
                  setShowEditTeam(false)
                }}
                disabled={!editTeamName.trim()}
                className="w-full h-14 rounded-[22px] bg-gradient-to-r from-gaffer-orange to-[#FF4D00] text-white font-black uppercase tracking-[0.25em] shadow-[0_8px_30px_rgba(255,102,0,0.25)] active:scale-95 transition-all text-sm disabled:opacity-40"
              >
                Save Changes
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Edit Player Modal ── */}
      <AnimatePresence>
        {editingPlayer && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center px-6">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/80 backdrop-blur-[10px]"
               onClick={() => setEditingPlayer(null)}
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }} 
               animate={{ scale: 1, opacity: 1, y: 0 }} 
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="relative w-full max-w-[340px] max-h-[90dvh] flex flex-col bg-[#1C1D2B] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl"
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

                <div className="p-6 md:p-8 space-y-6 overflow-y-auto no-scrollbar">
                  {editingPlayer.role !== 'coach' ? (
                     <div className="flex flex-col gap-4">
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

      {/* ── Add New Player Modal (Squad Recruitment) ── */}
      <AnimatePresence>
        {isAddingPlayer && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center px-6">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/80 backdrop-blur-[10px]"
               onClick={() => setIsAddingPlayer(false)}
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }} 
               animate={{ scale: 1, opacity: 1, y: 0 }} 
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="relative w-full max-w-[380px] max-h-[90dvh] flex flex-col bg-[#1C1D2B] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl"
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

                <div className="p-6 md:p-8 space-y-4 overflow-y-auto no-scrollbar">
                  <div className="flex flex-col gap-4">
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
                      <div className="flex flex-col gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Position</label>
                          <select 
                            value={newPlayer.position}
                            onChange={e => setNewPlayer({...newPlayer, position: e.target.value})}
                            className="w-full bg-[#11121C] border border-white/5 rounded-2xl py-3 px-4 text-[11px] font-black uppercase text-white outline-none focus:border-gaffer-orange/30 cursor-pointer"
                          >
                            <option value="GK">Goalkeeper</option>
                            <option value="DEF">Defender</option>
                            <option value="MID">Midfielder</option>
                            <option value="FWD">Forward</option>
                            <option value="DEF">Center-Back</option>
                            <option value="DEF">Full-Back</option>
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

                    </>
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

      {/* ── Invite Player Modal ── */}
      {selectedTeam && (
        <InvitePlayerModal
          teamId={selectedTeam.id}
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </motion.div>
  )
}
