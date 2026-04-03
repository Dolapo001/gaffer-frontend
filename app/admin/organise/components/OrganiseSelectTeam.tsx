import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, Plus, Check } from 'lucide-react'
import type { Team, Group } from '../types'
import { getImageUrl } from '@/lib/api'

interface Props {
  selectedGroup: Group | null
  teams: Team[]
  onBack: () => void
  onAddTeams: (teams: Team[]) => void
  onCreateNew: () => void
}

export function OrganiseSelectTeam({
  selectedGroup,
  teams,
  onBack,
  onAddTeams,
  onCreateNew,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleTeam = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleAdd = () => {
    const selectedTeams = teams.filter(t => selectedIds.has(t.id))
    onAddTeams(selectedTeams)
  }

  return (
    <motion.div
      key="select_team"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-[#181928] flex flex-col min-h-screen"
    >
      <div className="flex items-center pt-12 pb-6 px-4 md:px-6 shrink-0 border-b border-white/5">
        <button
          onClick={onBack}
          className="w-8 h-8 shrink-0 rounded-full border border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all active:scale-95"
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>
        <h2 className="flex-1 text-[15px] sm:text-[17px] font-chakra font-black tracking-widest text-center pr-8 uppercase truncate">
          Add To {selectedGroup?.name}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 border-b border-white/5">
        <div className="bg-[#1C2130] border border-white/5 rounded-[24px] overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Available Teams</h3>
            {teams.length > 0 && selectedIds.size > 0 && (
              <button 
                onClick={() => setSelectedIds(new Set())}
                className="text-[11px] font-bold text-orange-500 uppercase hover:text-orange-400 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
          
          {teams.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
                <Plus size={24} className="text-white/20" />
              </div>
              <p className="text-white/60 text-sm font-medium">No unassigned teams available</p>
            </div>
          ) : (
            teams.map((team) => {
              const isSelected = selectedIds.has(team.id)
              return (
                <div
                  key={team.id}
                  onClick={() => toggleTeam(team.id)}
                  className="px-4 md:px-6 py-4 flex items-center justify-between border-b border-white/5 last:border-0 hover:bg-white/[0.03] cursor-pointer transition-all active:bg-white/[0.05]"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 shrink-0 rounded-full overflow-hidden bg-black/20 border border-white/5">
                      <img src={getImageUrl(team.logo)} className="w-full h-full object-cover" alt="" />
                    </div>
                    <span className="text-white text-sm font-chakra font-black uppercase tracking-wider truncate pb-0.5">
                      {team.name}
                    </span>
                  </div>
                  <div className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ml-4 ${
                    isSelected ? 'bg-gradient-to-br from-[#FF7A00] to-[#FF0000] border-transparent shadow-[0_0_10px_rgba(255,102,0,0.3)]' : 'border-white/20'
                  }`}>
                    {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                  </div>
                </div>
              )
            })
          )}

          <button
            onClick={onCreateNew}
            className="w-full py-5 text-[#FF7A00] text-sm font-chakra font-black uppercase tracking-widest hover:bg-white/5 transition-colors border-t border-white/5 flex items-center justify-center gap-2"
          >
            <Plus size={16} strokeWidth={3} />
            Create Team
          </button>
        </div>
      </div>

      <div className="px-4 md:px-6 pt-5 pb-32 bg-[#181928] shrink-0">
        <button
          onClick={handleAdd}
          disabled={selectedIds.size === 0}
          className="w-full h-15 bg-gradient-to-r from-[#FF7A00] to-[#FF0000] text-white font-chakra font-black text-[15px] py-4 rounded-full shadow-[0_8px_30px_rgba(255,0,0,0.3)] active:scale-95 transition-all uppercase tracking-[0.15em] disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
        >
          Add {selectedIds.size > 0 ? `${selectedIds.size} ` : ''}Team{selectedIds.size !== 1 ? 's' : ''}
        </button>
      </div>
    </motion.div>
  )
}
