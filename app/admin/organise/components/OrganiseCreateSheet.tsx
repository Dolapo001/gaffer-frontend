'use client'

import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'
import type { Team } from '../types'
import { useUIStore } from '@/store/uiStore'

const GROUP_COLORS = [
  '#A855F7', '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#EC4899',
  '#06B6D4', '#F97316', '#84CC16', '#14B8A6', '#6366F1', '#D946EF',
]

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
const MAX_LOGO_SIZE = 2 * 1024 * 1024 // 2 MB

interface Props {
  activeTab: 'Teams' | 'Groups'
  teams: Team[]
  teamName: string
  maxPlayers: string
  logoPreview: string | null
  logoError: string | null
  selectedColor: string
  selectedTeamsForGroup: string[]
  onClose: () => void
  onTeamNameChange: (name: string) => void
  onMaxPlayersChange: (n: string) => void
  onLogoChange: (preview: string | null, error: string | null, file?: File) => void
  onColorChange: (color: string) => void
  onToggleTeamForGroup: (id: string) => void
  onCreate: () => void
  getUnassignedTeams: () => Team[]
  isSubmitting?: boolean
  competitions?: any[]
  selectedCompetitionId?: string
  onCompetitionChange?: (id: string) => void
}

export function OrganiseCreateSheet({
  activeTab,
  teams,
  teamName,
  maxPlayers,
  logoPreview,
  logoError,
  selectedColor,
  selectedTeamsForGroup,
  onClose,
  onTeamNameChange,
  onMaxPlayersChange,
  onLogoChange,
  onColorChange,
  onToggleTeamForGroup,
  onCreate,
  getUnassignedTeams,
  isSubmitting,
  competitions = [],
  selectedCompetitionId = '',
  onCompetitionChange,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { hideNavbar, showNavbar } = useUIStore()

  useEffect(() => {
    hideNavbar()
    return () => showNavbar()
  }, [hideNavbar, showNavbar])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      onLogoChange(null, 'Invalid file type. Use JPEG, PNG, WebP, or SVG.')
      e.target.value = ''
      return
    }
      if (file.size > MAX_LOGO_SIZE) {
      onLogoChange(null, 'File too large. Maximum size is 2 MB.')
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      onLogoChange(reader.result as string, null, file)
    }
    reader.readAsDataURL(file)
  }

  // Calculate current counts for the selected competition
  const selectedComp = competitions.find(c => c._id === selectedCompetitionId);
  const isTeamCreation = activeTab === 'Teams';
  
  // Total teams enrolled in this competition
  const enrolledTeamsCount = teams.filter(t => t.competitionId === selectedCompetitionId).length;
  // Total groups in this competition (using global group model matching selectedCompetitionId)
  // Actually, better to just check if total teams in the competition >= maxTeams in the competition
  const competitionTeamLimit = selectedComp?.maxTeams || 25;
  const isTeamLimitReached = isTeamCreation && enrolledTeamsCount >= competitionTeamLimit;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[105]"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
        className="fixed bottom-0 left-0 right-0 z-[999] max-h-[90vh] h-auto flex flex-col px-8 pt-6 pb-10 overflow-hidden bg-[#1E2032] backdrop-blur-[20px] rounded-t-[40px] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] text-center pointer-events-auto"
      >
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 shrink-0 relative z-10" />

        <h2 className="text-white text-center text-lg font-bold mb-0.5 relative z-10 shrink-0">
          {activeTab === 'Teams' ? 'Create Team' : 'Create Group'}
        </h2>

        <div className="text-center px-4 mb-4 flex-shrink-0 relative z-10">
          <h3 className="text-gray-400 text-base font-semibold">
            {activeTab === 'Teams' ? 'Add New Team' : 'Add New Group'}
          </h3>
          <p className="text-gray-500 text-[13px] leading-tight mt-0.5">
            Manage your schedule for matches, ceremonies. Schedule now and for later.
          </p>
          {selectedCompetitionId && (
            <div className="mt-2 py-1 px-3 bg-white/5 rounded-full inline-block border border-white/10">
              <span className="text-[10px] uppercase font-bold text-[#FF4D00]">
                 {enrolledTeamsCount} / {competitionTeamLimit} Teams enrolled
              </span>
            </div>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pb-24 relative z-10">
          {activeTab === 'Groups' ? (
            <div className="flex flex-col items-center mb-4 shrink-0 w-full px-2">
              <label className="text-gray-400 text-[10px] font-bold mb-2 uppercase tracking-widest opacity-80">
                Select Group Color
              </label>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 max-w-[280px]">
                {GROUP_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => onColorChange(color)}
                    className={`w-8 h-8 rounded-full transition-all flex items-center justify-center shrink-0 ${
                      selectedColor === color
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-[#111827] scale-110 shadow-lg'
                        : 'opacity-60 hover:opacity-100 scale-90'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {selectedColor === color && <Check size={14} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center mb-2 shrink-0">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
              <div
                onClick={() => !isTeamLimitReached && fileInputRef.current?.click()}
                className={`relative w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 mb-1 cursor-pointer active:scale-95 transition-transform bg-black/20 flex items-center justify-center shadow-2xl ${isTeamLimitReached ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
              >
                <img
                  src={logoPreview ?? 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <button 
                onClick={() => !isTeamLimitReached && fileInputRef.current?.click()} 
                disabled={isTeamLimitReached}
                className="text-[#FF4D00] text-xs font-bold uppercase tracking-wider mt-2 disabled:opacity-50"
              >
                Choose Photo
              </button>
              {logoError && <p className="text-red-400 text-xs mt-1 text-center">{logoError}</p>}
              {isTeamLimitReached && <p className="text-red-400 text-[10px] font-bold mt-2 uppercase">Limit reached for this tournament</p>}
            </div>
          )}

          <div className="space-y-4 w-full">
            <div className="space-y-1 text-left px-1">
              <label className="block text-gray-300 text-sm font-medium ml-1">
                {activeTab === 'Teams' ? 'Team Name' : 'Group Name'}
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => onTeamNameChange(e.target.value)}
                placeholder={activeTab === 'Teams' ? 'Chelsea' : 'Tournament Group A'}
                className="w-full bg-[#181928] text-white px-5 py-4 rounded-xl border border-white/10 focus:outline-none focus:border-[#FF5C00]/50 placeholder-gray-600 text-sm shadow-inner"
              />
            </div>

            {activeTab === 'Teams' && (
              <div className="space-y-1 text-left px-1">
                <label className="block text-gray-300 text-sm font-medium ml-1">Select Tournament</label>
                <div className="relative">
                  <select
                    value={selectedCompetitionId}
                    onChange={(e) => onCompetitionChange?.(e.target.value)}
                    className="w-full bg-[#181928] text-white px-5 py-4 rounded-xl border border-white/10 focus:outline-none appearance-none text-sm placeholder-gray-600"
                  >
                    <option value="" className="bg-[#181928]">Select Tournament (Optional)</option>
                    {competitions.map((comp) => (
                      <option key={comp._id} value={comp._id} className="bg-[#181928]">
                        {comp.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-5 pointer-events-none">
                    <ChevronDown size={18} className="text-white/60" />
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 ml-1">Auto-add to tournament on creation.</p>
              </div>
            )}

            {activeTab === 'Teams' && (
              <div className="space-y-1 text-left px-1">
                <label className="block text-gray-300 text-sm font-medium ml-1">Max Number of Players</label>
                <div className="relative">
                  <select
                    value={maxPlayers}
                    onChange={(e) => onMaxPlayersChange(e.target.value)}
                    className="w-full bg-[#181928] text-white px-5 py-4 rounded-xl border border-white/10 focus:outline-none appearance-none text-sm"
                  >
                    {[1, 2, 3, 4, 5, 11, 22].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-5 pointer-events-none">
                    <ChevronDown size={18} className="text-white/60" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Groups' && (
              <div className="space-y-1 text-left px-1 flex flex-col min-h-[200px]">
                <label className="block text-gray-300 text-sm font-medium ml-1">Add Teams</label>
                <div className="flex-1 bg-[#181928] rounded-xl border border-white/10">
                  {getUnassignedTeams().length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-xs text-balance">
                      No unassigned teams. All teams are in groups.
                    </div>
                  ) : (
                    getUnassignedTeams().map((team) => (
                      <div
                        key={team.id}
                        onClick={() => onToggleTeamForGroup(team.id)}
                        className="px-5 py-3 flex items-center justify-between border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20">
                            <img src={team.logo} className="w-full h-full object-cover" alt="" />
                          </div>
                          <span className="text-white text-xs font-bold uppercase tracking-widest truncate max-w-[140px]">
                            {team.name}
                          </span>
                        </div>
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            selectedTeamsForGroup.includes(team.id)
                              ? 'bg-[#FF7A00] border-[#FF7A00]'
                              : 'border-white/20'
                          }`}
                        >
                          {selectedTeamsForGroup.includes(team.id) && (
                            <Check size={12} className="text-white" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Fixed Action Component */}
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-0 left-0 right-0 p-8 pt-4 pb-10 bg-gradient-to-t from-[#1E2032] via-[#1E2032] to-transparent z-[1000] shrink-0 pointer-events-auto"
        >
          <button
            onClick={() => {
              console.log('Final Create Triggered');
              onCreate();
            }}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#FF7A00] to-[#FF0000] text-white font-bold py-4 rounded-2xl active:scale-[0.98] transition-all text-base shadow-[0_8px_30px_rgba(255,0,0,0.4)] flex items-center justify-center gap-3 disabled:opacity-70 disabled:grayscale"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              activeTab === 'Teams' ? 'Create Team' : 'Create Group'
            )}
          </button>
        </div>
      </motion.div>
    </>
  )
}
