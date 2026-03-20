'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronUp, ChevronDown, Check, Plus, User, Trophy, Copy } from 'lucide-react'
import type { Team, Group, Player } from '../types'
import { useToastStore } from '@/store/toastStore'
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
  onAddToTournament?: (teamId: string, competitionId: string) => void
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
  onAddToTournament,
}: Props) {
  const toast = useToastStore()
  
  // Find which group this team belongs to if we are in team view
  const displayHeading = selectedGroup?.name || 'Unassigned'
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
          className="absolute left-6 top-[52px] w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/5 transition-colors"
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>
        <h2 className="text-[17px] font-display font-black tracking-[0.05em] uppercase text-white/50">
          {displayHeading}
        </h2>
        {players.length > 0 && selectedTeam && (
          <div className="mt-4 w-12 h-12 rounded-full overflow-hidden bg-black/20 border-2 border-white/10">
            <img
              src={selectedTeam.logo || '/images/mc_logo.png'}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-40 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {selectedTeam && (
          <div className="h-full">
            {/* Recruitment View (Full Center) if no players */}
            {players.length === 0 ? (
              <div className="flex flex-col items-center pt-8 text-center h-full">
                <div className="w-20 h-20 rounded-full bg-white/5 border-2 border-white/10 p-4 mb-8">
                  <img src={selectedTeam.logo || '/images/mc_logo.png'} className="w-full h-full object-contain" alt="" />
                </div>
                
                <h1 className="text-[40px] font-display font-black text-white uppercase tracking-tighter mb-4 leading-none">
                  {selectedTeam.handle?.toUpperCase() || selectedTeam.name.split(' ')[0].toUpperCase()}
                </h1>
                
                <p className="max-w-[280px] text-center text-sm font-medium text-white/70 leading-relaxed mb-10">
                  Copy the Link and Share the link wth Capture Player&apos;s data
                </p>

                <div className="w-full max-w-[340px] relative">
                  <div className="bg-[#1C2130] border border-white/10 rounded-[20px] p-5 flex items-center justify-between gap-4">
                    <span className="text-[13px] text-white/40 font-medium truncate">
                      {`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${slugify(competitions[0]?.name || 'tournament')}/${slugify(selectedGroup?.name || 'unassigned')}/${selectedTeam.handle || slugify(selectedTeam.name)}`}
                    </span>
                    <button 
                      onClick={() => {
                        const link = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${slugify(competitions[0]?.name || 'tournament')}/${slugify(selectedGroup?.name || 'unassigned')}/${selectedTeam.handle || slugify(selectedTeam.name)}`
                        navigator.clipboard.writeText(link)
                        toast.addToast('Link copied to clipboard', 'success')
                      }}
                      className="shrink-0 text-white/50 hover:text-white transition-colors"
                    >
                      <Copy size={20} className="hover:text-gaffer-orange transition-colors" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {players.map((player, i) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-4"
                  >
                    <div
                      className="flex-1 bg-[#1C2130] rounded-[16px] p-3 flex items-center gap-4"
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
                          className={`text-[10px] uppercase font-bold tracking-wide ${
                            i === 0 
                              ? 'text-white/40' 
                              : player.position === 'Center-Back' || player.position === 'Left-back'
                              ? 'text-[#22C55E]'
                              : 'text-white/40'
                          }`}
                        >
                          {i === 0 ? 'THE GAFFER' : player.position}
                        </p>
                      </div>
                      
                      {i === 0 ? (
                        <div className="flex items-center pr-2">
                          <button
                            onClick={() => onPriceChange(player.id, true)}
                            className="text-[11px] font-bold text-[#EA580C]"
                          >
                            Add Price
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center">
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
                        </div>
                      )}
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
          </div>
        )}

        {selectedGroup && !selectedTeam && (
          <div className="bg-[#1C2130] border border-white/5 rounded-[24px] p-6 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full" style={{ backgroundColor: selectedGroup.color }} />
              <h4 className="font-bold text-[18px] text-white tracking-[0.05em]">{selectedGroup.name}</h4>
            </div>
            <div className="space-y-4">
              {selectedGroup.teams.map((team: any) => (
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
        )}
      </div>

      {players.length > 0 && (
        <div className="absolute bottom-[104px] left-0 right-0 px-6 pt-4 pb-4 bg-gradient-to-t from-[#181928] via-[#181928] to-transparent z-30">
          <button
            onClick={onBack}
            className="w-full bg-gradient-to-r from-[#FF7A00] to-[#FF0000] text-white font-bold text-[17px] py-4 rounded-[16px] shadow-[0_4px_14px_rgba(255,0,0,0.3)] active:scale-[0.98] transition-all"
          >
            Save
          </button>
        </div>
      )}
    </motion.div>
  )
}
