'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Plus, RefreshCw, ArrowLeft, Trophy, Users, Folder } from 'lucide-react'
import Link from 'next/link'
import type { Team, Group } from '../types'
import { getImageUrl } from '@/lib/api'

interface CompetitionOption {
  _id: string
  name: string
}

interface Props {
  activeTab: 'Teams' | 'Groups'
  teams: Team[]
  groups: Group[]
  hasOrg: boolean
  selectedCompetitionId?: string
  competitions?: CompetitionOption[]
  compTeamCounts?: Record<string, number>
  onCompetitionChange?: (competitionId: string) => void
  onSyncGroupsToTournament?: () => void
  isSyncingGroups?: boolean
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
  competitions,
  compTeamCounts,
  onCompetitionChange,
  onSyncGroupsToTournament,
  isSyncingGroups,
  onTabChange,
  onTeamClick,
  onGroupClick,
  onAddTeamsToGroup,
  onAddTeamToTournament,
  onRemoveTeamFromTournament,
}: Props) {
  const activeComp = competitions?.find((c) => c._id === selectedCompetitionId)

  // Filter teams for selected tournament folder
  const displayedTeams = selectedCompetitionId
    ? teams.filter((t) => t.competitionId === selectedCompetitionId || (t as any).enrollment?.competitionId === selectedCompetitionId)
    : teams

  return (
    <motion.div
      key="list"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex flex-col pt-2"
    >
      <div className="flex-1 overflow-y-auto pb-40 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Header & Back Button */}
        <div 
          className="flex items-center justify-between px-6 pb-3 text-white"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}
        >
          <div>
            <h1 className="text-xl font-chakra font-black text-white uppercase tracking-tighter">
              {activeComp ? activeComp.name : 'Organize'}
            </h1>
            {!activeComp && (
              <p className="text-xs text-[#A1A1AA] font-chakra font-medium mt-0.5">
                Select a tournament folder below to manage its teams and groups.
              </p>
            )}
          </div>

          {activeComp && (
            <button
              onClick={() => onCompetitionChange?.('')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-chakra font-bold uppercase transition border border-white/10 shrink-0"
            >
              <ArrowLeft size={14} />
              <span>Tournaments</span>
            </button>
          )}
        </div>

        {/* ── MODE 1: Tournament Folders View (When no tournament is open) ────────── */}
        {!selectedCompetitionId ? (
          <div className="px-6 space-y-4 pt-2">
            <h3 className="text-xs font-chakra font-bold text-white/40 uppercase tracking-widest">
              Tournaments ({competitions?.length ?? 0})
            </h3>

            {competitions && competitions.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {competitions.map((comp) => {
                  const compTeamsCount = compTeamCounts?.[comp._id] ?? teams.filter(
                    (t) => t.competitionId === comp._id || (t as any).enrollment?.competitionId === comp._id
                  ).length

                  return (
                    <div
                      key={comp._id}
                      onClick={() => onCompetitionChange?.(comp._id)}
                      className="bg-[#1C2130] border border-white/10 hover:border-orange-500/50 rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all group shadow-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-105 transition-transform">
                          <Trophy size={24} />
                        </div>
                        <div>
                          <h4 className="font-chakra font-black text-lg text-white uppercase tracking-wider group-hover:text-orange-400 transition-colors">
                            {comp.name}
                          </h4>
                          <p className="text-xs text-[#A1A1AA] flex items-center gap-2 mt-0.5">
                            <Users size={12} />
                            <span>{compTeamsCount} Teams inside</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-orange-400 text-xs font-bold font-chakra uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                        <span>Open Folder</span>
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center px-8 py-16 text-center bg-[#1C2130]/50 border border-white/5 rounded-2xl">
                <Trophy size={40} className="text-white/20 mb-3" />
                <h3 className="text-white text-base font-bold mb-1">No Tournaments Created Yet</h3>
                <p className="text-xs text-[#A1A1AA] max-w-[280px] mb-4 leading-relaxed">
                  Create a tournament first to organize teams and groups under it.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* ── MODE 2: Inside a Tournament Folder (Teams & Groups workspace) ── */
          <div className="px-6 space-y-4">
            {/* Tab Switcher */}
            <div className="bg-white/5 p-1.5 rounded-xl flex border border-white/5">
              {(['Teams', 'Groups'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => onTabChange(tab)}
                  className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all flex flex-col items-center justify-center relative ${
                    activeTab === tab ? 'bg-[#2F3342] text-white shadow-lg' : 'text-gray-500'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="w-4 h-0.5 bg-orange-500 rounded-full mt-1" />
                  )}
                </button>
              ))}
            </div>

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
                  {displayedTeams.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center px-8 pb-32 text-center mt-12">
                      <Folder size={40} className="text-white/20 mb-3" />
                      <h3 className="text-white text-[17px] font-semibold mb-2">
                        No Teams in {activeComp?.name}
                      </h3>
                      <p className="text-[14px] text-[#A1A1AA] max-w-[300px] leading-[1.4]">
                        Click the + button below to create a new team under this tournament.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {displayedTeams.map((team) => (
                        <div
                          key={team.id}
                          onClick={() => onTeamClick(team)}
                          className="bg-[#1C2130] border border-white/5 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-all group"
                        >
                          <div className="w-14 h-14 shrink-0 rounded-full overflow-hidden bg-black/20">
                            <img src={getImageUrl(team.logo)} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div className="flex-1 justify-center flex flex-col">
                            <h4 className="font-bold text-[17px] text-white tracking-[0.05em] mb-1">
                              {team.name}
                            </h4>
                            <p className="text-[12px] text-[#A1A1AA]">{team.playerCount} players</p>
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
                  {selectedCompetitionId && groups.length > 0 && (
                    <button
                      onClick={onSyncGroupsToTournament}
                      disabled={isSyncingGroups}
                      className="w-full py-2.5 rounded-xl bg-orange-gradient-btn text-white text-[13px] font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={isSyncingGroups ? 'animate-spin' : ''} />
                      {isSyncingGroups ? 'Syncing...' : 'Sync Groups to Tournament'}
                    </button>
                  )}

                  {groups.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center px-8 pb-32 text-center mt-12">
                      <Folder size={40} className="text-white/20 mb-3" />
                      <h3 className="text-white text-[17px] font-semibold mb-2">
                        No Groups in {activeComp?.name}
                      </h3>
                      <p className="text-[14px] text-[#A1A1AA] max-w-[300px] leading-[1.4]">
                        Click the + button below to create a group for this tournament.
                      </p>
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
        )}
      </div>
    </motion.div>
  )
}
