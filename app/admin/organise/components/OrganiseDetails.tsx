'use client'

import { motion } from 'framer-motion'
import { ChevronLeft, ChevronUp, ChevronDown, Check, Plus, User } from 'lucide-react'
import type { Team, Group, Player } from '../types'

interface Props {
  selectedTeam: Team | null
  selectedGroup: Group | null
  players: Player[]
  onBack: () => void
  onShare: () => void
  onAddTeams: () => void
  onTogglePlayer: (id: string) => void
  onPriceChange: (id: string, increment: boolean) => void
}

export function OrganiseDetails({
  selectedTeam,
  selectedGroup,
  players,
  onBack,
  onShare,
  onAddTeams,
  onTogglePlayer,
  onPriceChange,
}: Props) {
  return (
    <motion.div
      key="details"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute inset-0 z-20 bg-[#181928] flex flex-col"
    >
      <div className="flex flex-col items-center pt-12 pb-6 px-6 relative shrink-0">
        <button
          onClick={onBack}
          className="absolute left-6 top-[52px] w-6 h-6 rounded-full border border-white flex items-center justify-center"
        >
          <ChevronLeft size={14} strokeWidth={2.5} />
        </button>
        <h2 className="text-[17px] font-bold tracking-[0.05em] mb-4">
          {selectedTeam?.name || selectedGroup?.name}
        </h2>
        <div className="w-10 h-10 rounded-full overflow-hidden bg-black/20">
          <img
            src={selectedTeam?.logo || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {selectedTeam && (
        <div className="flex-1 overflow-y-auto px-6 pb-40 space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {players.map((player, i) => (
            <div
              key={player.id}
              className="flex items-center gap-4 border-b border-white/5 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0"
            >
              <div
                className={`flex-1 bg-[#1C2130] rounded-[16px] p-3 flex items-center gap-4 ${
                  i === 0 ? 'border border-[#2C3140]' : ''
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex flex-col items-center justify-center shrink-0 overflow-hidden ${
                    i === 0 ? 'bg-[#73B9E7]' : 'bg-[#94A3B8]'
                  }`}
                >
                  {i !== 0 && <User size={24} className="text-[#334155] mt-2" />}
                </div>
                <div className="flex-1">
                  <h5 className={`font-semibold text-[15px] leading-tight mb-1 ${i === 0 ? 'font-bold' : ''} text-white`}>
                    {player.name}
                  </h5>
                  <p
                    className={`text-[10px] uppercase font-medium tracking-wide ${
                      player.position === 'Center-Back' || player.position === 'Left-back'
                        ? 'text-[#22C55E]'
                        : 'text-[#A1A1AA]'
                    }`}
                  >
                    {player.position}
                  </p>
                </div>
                <div className="flex items-center">
                  {i === 0 ? (
                    <span className="text-[#F97316] text-[11px] font-medium mr-2">Add Price</span>
                  ) : (
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => onPriceChange(player.id, true)}
                        className="p-1 -mb-1 hover:bg-white/10 rounded transition-colors active:scale-90"
                      >
                        <ChevronUp size={14} className="text-[#A1A1AA]" />
                      </button>
                      <span className="text-[13px] font-medium text-white px-1 leading-none my-0.5 w-[36px] text-center">
                        {player.price}
                      </span>
                      <button
                        onClick={() => onPriceChange(player.id, false)}
                        className="p-1 -mt-1 hover:bg-white/10 rounded transition-colors active:scale-90"
                      >
                        <ChevronDown size={14} className="text-[#A1A1AA]" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {i !== 0 && (
                <div
                  onClick={() => onTogglePlayer(player.id)}
                  className={`w-[22px] h-[22px] rounded border-2 flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                    !player.isSelected ? 'border-[#94A3B8] bg-[#94A3B8]/20' : 'border-[#EA580C] bg-[#EA580C]'
                  }`}
                >
                  <Check size={14} strokeWidth={3} className={player.isSelected ? 'text-[#181928]' : 'text-[#94A3B8]'} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedGroup && (
        <div className="flex-1 overflow-y-auto px-6 pb-40 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="bg-[#1C2130] border border-white/5 rounded-[24px] p-6 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full" style={{ backgroundColor: selectedGroup.color }} />
              <h4 className="font-bold text-[18px] text-white tracking-[0.05em]">{selectedGroup.name}</h4>
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
              onClick={onAddTeams}
              className="mt-2 w-full max-w-[160px] mx-auto py-2.5 px-4 rounded-full border border-white/60 flex items-center justify-center gap-2 text-white text-[13px] font-semibold hover:bg-white/5 transition-all"
            >
              <Plus size={16} />
              Add Teams
            </button>
          </div>
        </div>
      )}

      <div className="absolute bottom-[104px] left-0 right-0 px-6 pt-4 pb-4 bg-gradient-to-t from-[#181928] via-[#181928] to-transparent z-30">
        <button
          onClick={onShare}
          className="w-full bg-gradient-to-r from-[#FF7A00] to-[#FF0000] text-white font-bold text-[17px] py-4 rounded-[16px] shadow-[0_4px_14px_rgba(255,0,0,0.3)] active:scale-[0.98] transition-all"
        >
          Save
        </button>
      </div>
    </motion.div>
  )
}
