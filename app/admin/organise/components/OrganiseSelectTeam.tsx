'use client'

import { motion } from 'framer-motion'
import { ChevronLeft, Plus } from 'lucide-react'
import type { Team, Group } from '../types'

interface Props {
  selectedGroup: Group | null
  teams: Team[]
  onBack: () => void
  onAddTeam: (team: Team) => void
  onCreateNew: () => void
}

export function OrganiseSelectTeam({
  selectedGroup,
  teams,
  onBack,
  onAddTeam,
  onCreateNew,
}: Props) {
  return (
    <motion.div
      key="select_team"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute inset-0 z-20 bg-[#181928] flex flex-col"
    >
      <div className="flex flex-col items-center pt-12 pb-6 px-6 relative shrink-0">
        <button
          onClick={onBack}
          className="absolute left-6 top-[52px] w-6 h-6 rounded-full border border-white flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"
        >
          <ChevronLeft size={14} strokeWidth={2.5} />
        </button>
        <h2 className="text-[17px] font-bold tracking-[0.05em] mb-4">
          Add Team to {selectedGroup?.name}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-20">
        <div className="bg-[#1C2130] border border-white/5 rounded-[24px] overflow-hidden">
          <div className="p-5 border-b border-white/5 bg-white/5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Available Teams</h3>
          </div>
          {teams.map((team) => (
            <div
              key={team.id}
              onClick={() => onAddTeam(team)}
              className="px-6 py-4 flex items-center justify-between border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-black/20">
                  <img src={team.logo} className="w-full h-full object-cover" alt="" />
                </div>
                <span className="text-white text-sm font-bold uppercase tracking-widest">
                  {team.name}
                </span>
              </div>
              <Plus size={20} className="text-gray-500" />
            </div>
          ))}

          <button
            onClick={onCreateNew}
            className="w-full py-6 text-[#FF7A00] text-sm font-bold hover:bg-white/5 transition-colors border-t border-white/5"
          >
            Create New Team for Group
          </button>
        </div>
      </div>
    </motion.div>
  )
}
