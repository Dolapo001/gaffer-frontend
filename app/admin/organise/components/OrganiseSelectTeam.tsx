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

      <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-40">
        <div className="bg-[#1C2130] border border-white/5 rounded-[24px] overflow-hidden">
          <div className="p-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Available Teams</h3>
            {teams.length > 0 && selectedIds.size > 0 && (
              <button 
                onClick={() => setSelectedIds(new Set())}
                className="text-[11px] font-bold text-orange-500 uppercase"
              >
                Clear All
              </button>
            )}
          </div>
          
          {teams.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <p className="text-white/40 text-sm">No unassigned teams available</p>
            </div>
          ) : (
            teams.map((team) => {
              const isSelected = selectedIds.has(team.id)
              return (
                <div
                  key={team.id}
                  onClick={() => toggleTeam(team.id)}
                  className="px-6 py-4 flex items-center justify-between border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-black/20">
                      <img src={getImageUrl(team.logo)} className="w-full h-full object-cover" alt="" />
                    </div>
                    <span className="text-white text-sm font-bold uppercase tracking-widest">
                      {team.name}
                    </span>
                  </div>
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                    isSelected ? 'bg-orange-500 border-orange-500' : 'border-white/20'
                  }`}>
                    {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                  </div>
                </div>
              )
            })
          )}

          <button
            onClick={onCreateNew}
            className="w-full py-6 text-[#FF7A00] text-sm font-bold hover:bg-white/5 transition-colors border-t border-white/5"
          >
            Create New Team for Group
          </button>
        </div>
      </div>

      <div className="absolute bottom-[124px] left-0 right-0 px-6 pt-4 pb-4 bg-gradient-to-t from-[#181928] via-[#181928] to-transparent z-30">
        <button
          onClick={handleAdd}
          disabled={selectedIds.size === 0}
          className="w-full bg-gradient-to-r from-[#FF7A00] to-[#FF0000] text-white font-bold text-[17px] py-4 rounded-[16px] shadow-[0_4px_14px_rgba(255,0,0,0.3)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
        >
          Add {selectedIds.size > 0 ? `${selectedIds.size} ` : ''}Team{selectedIds.size !== 1 ? 's' : ''}
        </button>
      </div>
    </motion.div>
  )
}
