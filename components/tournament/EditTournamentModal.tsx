'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, User, Trophy, LayoutGrid, GitFork, Layers, Settings2, ChevronDown } from 'lucide-react'
import { Competition, updateCompetition } from '@/lib/services/competition.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'
import { useUIStore } from '@/store/uiStore'

interface EditTournamentModalProps {
  competition: Competition
  onClose: () => void
}

const FORMAT_OPTIONS = [
  { id: 'round_robin', label: 'Round Robin' },
  { id: 'groups', label: 'Groups' },
  { id: 'knockout', label: 'Knockout' },
  { id: 'groups_knockout', label: 'Group + Knockout' },
  { id: 'league_knockout', label: 'League + Knockout' },
  { id: 'league_playoff', label: 'League + Playoff' },
  { id: 'custom', label: 'Custom' }
]

export function EditTournamentModal({ competition, onClose }: EditTournamentModalProps) {
  const qc = useQueryClient()
  const toast = useToastStore()

  const [form, setForm] = useState({
    name: competition.name,
    sport: competition.sport,
    gender: competition.gender,
    startDate: competition.startDate.split('T')[0],
    endDate: competition.endDate.split('T')[0],
    format: competition.format || 'round_robin',
    rules: {
      winPoints: competition.rules?.winPoints ?? 3,
      drawPoints: competition.rules?.drawPoints ?? 1,
      lossPoints: competition.rules?.lossPoints ?? 0,
      perGoalPoints: competition.rules?.perGoalPoints ?? 0,
      cleanSheetPoints: competition.rules?.cleanSheetPoints ?? 0,
      structure: competition.rules?.structure ?? 'single'
    }
  })

  const { hideNavbar, showNavbar } = useUIStore()

  useEffect(() => {
    hideNavbar()
    return () => showNavbar()
  }, [hideNavbar, showNavbar])

  const updateMutation = useMutation({
    mutationFn: (payload: any) => updateCompetition(competition._id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['competition', competition._id] })
      qc.invalidateQueries({ queryKey: ['competitions'] })
      toast.addToast('Tournament updated successfully', 'success')
      onClose()
    },
    onError: (err: unknown) => toast.addToast(getErrorMessage(err), 'error')
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate({
      ...form,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString()
    })
  }

  return (
    <div className="fixed inset-0 z-[210] flex items-end sm:items-center justify-center p-0 sm:p-4 text-left">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="absolute inset-0 bg-black/80 backdrop-blur-xl" 
        onClick={onClose} 
      />
      
      <motion.div 
        initial={{ opacity: 0, y: 100 }} 
        animate={{ opacity: 1, y: 0 }} 
        exit={{ opacity: 0, y: 100 }}
        data-nav-hidden="true"
        className="relative w-full max-w-lg bg-[#1E2032] rounded-t-[32px] sm:rounded-[32px] overflow-hidden border-t sm:border border-white/10 shadow-3xl text-start flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 shrink-0">
          <h2 className="text-lg font-display font-bold text-white uppercase tracking-wider">Edit Tournament</h2>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-[10px] font-display font-black text-gaffer-subtle uppercase tracking-widest ml-1">Tournament Name</label>
            <input 
              type="text" 
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full h-14 bg-gaffer-surface border border-white/5 rounded-2xl px-6 text-white font-display font-bold text-sm focus:border-gaffer-orange/50 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Sport */}
            <div className="space-y-2">
              <label className="text-[10px] font-display font-black text-gaffer-subtle uppercase tracking-widest ml-1">Sport</label>
              <div className="relative">
                <select 
                  value={form.sport}
                  onChange={(e) => setForm({ ...form, sport: e.target.value })}
                  className="w-full h-14 bg-gaffer-surface border border-white/5 rounded-2xl px-6 text-white font-display font-bold text-sm outline-none appearance-none"
                >
                  <option>Football</option>
                  <option>Basketball</option>
                </select>
                <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30" />
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="text-[10px] font-display font-black text-gaffer-subtle uppercase tracking-widest ml-1">Gender</label>
              <div className="relative">
                <select 
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value as any })}
                  className="w-full h-14 bg-gaffer-surface border border-white/5 rounded-2xl px-6 text-white font-display font-bold text-sm outline-none appearance-none"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="mixed">Mixed</option>
                </select>
                <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <label className="text-[10px] font-display font-black text-gaffer-subtle uppercase tracking-widest ml-1">Start Date</label>
              <input 
                type="date" 
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full h-14 bg-gaffer-surface border border-white/5 rounded-2xl px-6 text-white font-display font-bold text-sm focus:border-gaffer-orange/50 outline-none [color-scheme:dark]"
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <label className="text-[10px] font-display font-black text-gaffer-subtle uppercase tracking-widest ml-1">End Date</label>
              <input 
                type="date" 
                required
                value={form.endDate}
                min={form.startDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full h-14 bg-gaffer-surface border border-white/5 rounded-2xl px-6 text-white font-display font-bold text-sm focus:border-gaffer-orange/50 outline-none [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Format */}
          <div className="space-y-2">
            <label className="text-[10px] font-display font-black text-gaffer-subtle uppercase tracking-widest ml-1">Tournament Format</label>
            <div className="relative">
              <select 
                value={form.format}
                onChange={(e) => setForm({ ...form, format: e.target.value })}
                className="w-full h-14 bg-gaffer-surface border border-white/5 rounded-2xl px-6 text-white font-display font-bold text-sm outline-none appearance-none"
              >
                {FORMAT_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30" />
            </div>
          </div>

          {/* Rules Section */}
          <div className="pt-4 border-t border-white/5 space-y-6">
            <h3 className="text-[11px] font-display font-black text-gaffer-orange uppercase tracking-[0.2em]">Scoring Rules</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-display font-black text-white/40 uppercase tracking-widest ml-1">Win Pts</label>
                <input 
                  type="number" 
                  value={form.rules.winPoints}
                  onChange={(e) => setForm({ ...form, rules: { ...form.rules, winPoints: parseInt(e.target.value) || 0 }})}
                  className="w-full h-12 bg-black/20 border border-white/5 rounded-xl text-center text-white font-display font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-display font-black text-white/40 uppercase tracking-widest ml-1">Draw Pts</label>
                <input 
                  type="number" 
                  value={form.rules.drawPoints}
                  onChange={(e) => setForm({ ...form, rules: { ...form.rules, drawPoints: parseInt(e.target.value) || 0 }})}
                  className="w-full h-12 bg-black/20 border border-white/5 rounded-xl text-center text-white font-display font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-display font-black text-white/40 uppercase tracking-widest ml-1">Loss Pts</label>
                <input 
                  type="number" 
                  value={form.rules.lossPoints}
                  onChange={(e) => setForm({ ...form, rules: { ...form.rules, lossPoints: parseInt(e.target.value) || 0 }})}
                  className="w-full h-12 bg-black/20 border border-white/5 rounded-xl text-center text-white font-display font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-display font-black text-white/40 uppercase tracking-widest ml-1">Per Goal</label>
                <input 
                  type="number" 
                  value={form.rules.perGoalPoints}
                  onChange={(e) => setForm({ ...form, rules: { ...form.rules, perGoalPoints: parseInt(e.target.value) || 0 }})}
                  className="w-full h-12 bg-black/20 border border-white/5 rounded-xl text-center text-white font-display font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-display font-black text-white/40 uppercase tracking-widest ml-1">Clean Sheet</label>
                <input 
                  type="number" 
                  value={form.rules.cleanSheetPoints}
                  onChange={(e) => setForm({ ...form, rules: { ...form.rules, cleanSheetPoints: parseInt(e.target.value) || 0 }})}
                  className="w-full h-12 bg-black/20 border border-white/5 rounded-xl text-center text-white font-display font-bold"
                />
              </div>
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-white/5 bg-gaffer-card shrink-0">
          <button 
            type="submit"
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="w-full h-14 rounded-2xl bg-orange-gradient-btn text-white font-display font-black text-base uppercase tracking-wider shadow-lg shadow-gaffer-orange/10 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {updateMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
