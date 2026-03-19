'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'
import type { Team } from '../types'

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
  onLogoChange: (preview: string | null, error: string | null) => void
  onColorChange: (color: string) => void
  onToggleTeamForGroup: (id: string) => void
  onCreate: () => void
  getUnassignedTeams: () => Team[]
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
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      onLogoChange(reader.result as string, null)
    }
    reader.readAsDataURL(file)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-[#FFFFFF78] backdrop-blur-[7.8px] z-[45]"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
        className="fixed bottom-0 left-0 right-0 z-50 h-[70%] flex flex-col px-8 pt-6 pb-6 overflow-hidden bg-[#0F172BB0] backdrop-blur-[20px] rounded-t-[30px] border-t-[1.23px] border-white/10 shadow-[0_-20px_80px_rgba(0,0,0,0.4)] before:absolute before:inset-0 before:rounded-t-[30px] before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none"
      >
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 shrink-0 relative z-10" />

        <h2 className="text-white text-center text-lg font-bold mb-0.5 relative z-10">
          {activeTab === 'Teams' ? 'Create Team' : 'Create Group'}
        </h2>

        <div className="text-center px-4 mb-2 flex-shrink-0 relative z-10">
          <h3 className="text-gray-400 text-base font-semibold">
            {activeTab === 'Teams' ? 'Add New Team' : 'Add New Group'}
          </h3>
          <p className="text-gray-500 text-[13px] leading-tight mt-0.5">
            Manage your schedule for matches, ceremonies. Schedule now and for later.
          </p>
        </div>

        {activeTab === 'Groups' ? (
          <div className="flex flex-col items-center mb-4 shrink-0 relative z-10 w-full px-2">
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
          <div className="flex flex-col items-center mb-2 shrink-0 relative z-10">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 mb-1 cursor-pointer active:scale-95 transition-transform bg-black/20 flex items-center justify-center"
            >
              <img
                src={logoPreview ?? 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <button onClick={() => fileInputRef.current?.click()} className="text-gray-400 text-xs font-medium">
              Choose Photo
            </button>
            {logoError && <p className="text-red-400 text-xs mt-1 text-center">{logoError}</p>}
          </div>
        )}

        <div className="space-y-3 shrink-0 relative z-10 w-full pb-1">
          <div className="space-y-1">
            <label className="block text-gray-300 text-sm font-medium ml-1">
              {activeTab === 'Teams' ? 'Team Name' : 'Group Name'}
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => onTeamNameChange(e.target.value)}
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
                  onChange={(e) => onMaxPlayersChange(e.target.value)}
                  className="w-full bg-[#1C2237] text-white px-5 py-3.5 rounded-xl border border-white/5 focus:outline-none appearance-none text-sm"
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
          ) : (
            <div className="space-y-1 flex-1 flex flex-col min-h-0">
              <label className="block text-gray-300 text-[13px] font-medium ml-1">Add Teams</label>
              <div className="flex-1 overflow-y-auto bg-[#1C2237] rounded-xl border border-white/5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {getUnassignedTeams().length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-xs">
                    All teams are already assigned to groups
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
                        <span className="text-white text-xs font-bold uppercase tracking-widest">
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

        <div className="mt-2 shrink-0 relative z-10">
          <button
            onClick={onCreate}
            className="w-full bg-gradient-to-r from-[#FF7A00] to-[#FF0000] text-white font-bold py-3.5 rounded-2xl active:scale-[0.98] transition-all text-base shadow-[0_4px_14px_rgba(255,0,0,0.3)]"
          >
            {activeTab === 'Teams' ? 'Create Team' : 'Create Group'}
          </button>
        </div>
      </motion.div>
    </>
  )
}
