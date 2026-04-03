'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Plus } from 'lucide-react'
import Link from 'next/link'
import type { Team, Group } from '../types'
import { getImageUrl } from '@/lib/api'

interface Props {
  activeTab: 'Teams' | 'Groups'
  teams: Team[]
  groups: Group[]
  hasOrg: boolean
  selectedCompetitionId?: string
  onTabChange: (tab: 'Teams' | 'Groups') => void
  onTeamClick: (team: Team) => void
  onGroupClick: (group: Group) => void
  onAddTeamsToGroup: (group: Group) => void
  onAddTeamToTournament: (teamId: string) => void
  onRemoveTeamFromTournament: (teamId: string) => void
}

export function OrganiseList({
  activeTab,
  teams,
  groups,
  hasOrg,
  selectedCompetitionId,
  onTabChange,
  onTeamClick,
  onGroupClick,
  onAddTeamsToGroup,
  onAddTeamToTournament,
  onRemoveTeamFromTournament,
}: Props) {
  return (
    <motion.div
      key="list"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col space-y-4 px-4 md:px-6 pt-2 pb-32"
    >
      {/* Tab Switcher */}
      <div className="bg-white/5 p-1.5 rounded-xl flex border border-white/5">
        {(['Teams', 'Groups'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-[13px] md:text-sm transition-all flex flex-col items-center justify-center relative ${
              activeTab === tab ? 'bg-[#2F3342] text-white shadow-lg' : 'text-gray-500 hover:text-white/60'
            }`}
          >
            <span className="font-chakra font-black tracking-widest uppercase">{tab}</span>
            {activeTab === tab && (
              <motion.div layoutId="activetabindicator" className="absolute bottom-0 left-4 right-4 h-[3px] bg-gradient-to-r from-[#FF7A00] to-[#FF0000] rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 w-full">
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
                <div className="flex-1 flex flex-col items-center justify-center px-8 pb-32 text-center mt-20">
                  <h3 className="text-white text-[17px] font-semibold mb-2">
                    {hasOrg ? 'Add New Team' : 'Create Organization'}
                  </h3>
                  <p className="text-[14px] text-[#A1A1AA] max-w-[300px] leading-[1.4]">
                    {hasOrg 
                      ? 'Manage your schedule for matches, ceremonies. Schedule now and for later.' 
                      : 'You need to have an active organization before you can manage teams and groups.'
                    }
                  </p>
                  {!hasOrg && (
                    <Link
                      href="/auth/signup/organization"
                      className="mt-6 px-8 py-3 bg-orange-500 rounded-full font-bold text-white transition-opacity hover:opacity-90"
                    >
                      Get Started
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      onClick={() => onTeamClick(team)}
                      className="bg-[#1C2130] border border-white/5 rounded-2xl p-4 flex items-center gap-3 sm:gap-4 cursor-pointer hover:bg-white/10 transition-all group overflow-hidden"
                    >
                      <div className="w-10 h-10 sm:w-14 sm:h-14 shrink-0 rounded-full overflow-hidden bg-black/20">
                        <img src={getImageUrl(team.logo)} className="w-full h-full object-cover" alt="" />
                      </div>
                      
                      <div className="flex-1 justify-center flex flex-col min-w-0">
                        <h4 className="font-bold text-[14px] sm:text-[17px] text-white tracking-[0.05em] mb-0.5 sm:mb-1 truncate w-full">
                          {team.name}
                        </h4>
                        <p className="text-[10px] sm:text-[12px] text-[#A1A1AA] truncate w-full">{team.playerCount} players</p>
                      </div>

                      {selectedCompetitionId && (
                        <div className="flex items-center shrink-0 pr-1 sm:pr-2">
                          {team.competitionId === selectedCompetitionId ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onRemoveTeamFromTournament(team.id)
                              }}
                              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-red-500/50 text-red-400 text-[10px] sm:text-xs font-bold hover:bg-red-500/10 transition-all uppercase whitespace-nowrap"
                            >
                              Remove
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onAddTeamToTournament(team.id)
                              }}
                              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-orange-500/50 text-orange-400 text-[10px] sm:text-xs font-bold hover:bg-orange-500/10 transition-all uppercase whitespace-nowrap"
                            >
                              <span className="inline-block sm:hidden">+ Add</span>
                              <span className="hidden sm:inline-block">Add to Tournament</span>
                            </button>
                          )}
                        </div>
                      )}

                      <div className="w-5 h-5 rounded-full border border-white/30 flex items-center justify-center shrink-0 hidden sm:flex">
                        <ChevronRight size={12} strokeWidth={2.5} className="text-white/50" />
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
                <div className="flex-1 flex flex-col items-center justify-center px-8 pb-32 text-center mt-20">
                  <h3 className="text-white text-[17px] font-semibold mb-2">
                    {hasOrg ? 'Create Group' : 'Create Organization'}
                  </h3>
                  <p className="text-[14px] text-[#A1A1AA] max-w-[300px] leading-[1.4]">
                    {hasOrg 
                      ? 'Manage your schedule for matches, ceremonies. Schedule now and for later.' 
                      : 'You need to have an active organization before you can manage teams and groups.'
                    }
                  </p>
                  {!hasOrg && (
                    <Link
                      href="/auth/signup/organization"
                      className="mt-6 px-8 py-3 bg-orange-500 rounded-full font-bold text-white transition-opacity hover:opacity-90"
                    >
                      Get Started
                    </Link>
                  )}
                </div>
              ) : (
                groups.map((group) => (
                  <div
                    key={group.id}
                    onClick={() => onGroupClick(group)}
                    className="bg-[#1C2130] border border-white/5 rounded-[24px] p-6 flex flex-col gap-6 cursor-pointer hover:bg-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full" style={{ backgroundColor: group.color }} />
                      <h4 className="font-bold text-[18px] text-white tracking-[0.05em]">{group.name}</h4>
                    </div>

                    <div className="space-y-4">
                      {group.teams.map((team) => (
                        <div
                          key={team.id}
                          className="flex items-center gap-4 py-1 border-b border-white/5 last:border-0"
                        >
                          <div className="w-6 h-6 shrink-0 rounded-full overflow-hidden bg-black/20">
                            <img src={getImageUrl(team.logo)} className="w-full h-full object-cover" alt="" />
                          </div>
                          <span className="text-white text-[15px] font-bold tracking-[0.05em] uppercase">
                            {team.name}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onAddTeamsToGroup(group)
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
  )
}
