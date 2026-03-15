'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { useTournamentStore } from '@/store/tournamentStore'
import { PlayerCard } from '@/components/admin/PlayerCard'
import { Plus, X, Users, Search } from 'lucide-react'

const addSchema = z.object({
  name: z.string().min(2, 'Name too short'),
  position: z.string().min(1, 'Required'),
  jerseyNumber: z.number().min(1).max(99),
  nationality: z.string().min(2, 'Required'),
  age: z.number().min(15).max(50),
})
type AddFormData = z.infer<typeof addSchema>

const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Striker', 'Forward']

export default function PlayersPage() {
  const { players, addPlayer, removePlayer } = useTournamentStore()
  const [showAdd, setShowAdd] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.position.toLowerCase().includes(query.toLowerCase())
  )

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddFormData>({
    resolver: zodResolver(addSchema),
    defaultValues: { jerseyNumber: 1, age: 22 },
  })

  const onAdd = (data: AddFormData) => {
    addPlayer({ ...data, tournamentIds: [] })
    reset()
    setShowAdd(false)
  }

  return (
    <div className="min-h-screen bg-gaffer-bg">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gaffer-bg/95 backdrop-blur-md border-b border-gaffer-border/50">
        <div className="flex items-center justify-between px-4 pt-12 pb-3">
          <div>
            <h1 className="font-display font-bold text-xl text-white">Players</h1>
            <p className="text-gaffer-muted text-xs font-body mt-0.5">{players.length} registered</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-gradient-btn text-white font-display font-bold text-sm shadow-orange-glow"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

      <div className="px-4 py-4 pb-28 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gaffer-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or position..."
            className="w-full pl-9 pr-4 py-3 rounded-xl bg-gaffer-card border border-gaffer-border text-white placeholder:text-gaffer-subtle font-body text-sm focus:outline-none focus:border-gaffer-orange transition-colors"
          />
        </div>

        {/* Player list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gaffer-card border border-gaffer-border flex items-center justify-center">
              <Users size={28} className="text-gaffer-subtle" />
            </div>
            <div className="text-center">
              <p className="text-white font-body font-medium">{query ? 'No players found' : 'No players yet'}</p>
              <p className="text-gaffer-muted text-sm font-body mt-1">{query ? 'Try a different search' : 'Add your first player to the roster'}</p>
            </div>
            {!query && (
              <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-gradient-btn text-white font-display font-bold text-sm shadow-orange-glow">
                <Plus size={16} />Add Player
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-2">
              {filtered.map((p) => (
                <PlayerCard key={p.id} player={p} onRemove={() => removePlayer(p.id)} />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Add Player Sheet */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40" onClick={() => setShowAdd(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-gaffer-surface border-t border-gaffer-border rounded-t-3xl">
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gaffer-border" />
              </div>
              <div className="flex items-center justify-between px-5 py-3 border-b border-gaffer-border">
                <h2 className="font-display font-bold text-white text-lg">Add Player</h2>
                <button onClick={() => setShowAdd(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gaffer-card border border-gaffer-border text-gaffer-muted hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onAdd)} className="px-5 py-4 space-y-4 pb-8">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-body font-medium text-white/80 mb-1">Full Name</label>
                    <input {...register('name')} placeholder="Player name"
                      className="w-full px-4 py-3 rounded-xl bg-gaffer-card border border-gaffer-border text-white placeholder:text-gaffer-subtle font-body text-sm focus:outline-none focus:border-gaffer-orange transition-colors" />
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-body font-medium text-white/80 mb-1">Jersey #</label>
                    <input type="number" {...register('jerseyNumber', { valueAsNumber: true })} min={1} max={99}
                      className="w-full px-4 py-3 rounded-xl bg-gaffer-card border border-gaffer-border text-white font-body text-sm focus:outline-none focus:border-gaffer-orange transition-colors" />
                  </div>

                  <div>
                    <label className="block text-xs font-body font-medium text-white/80 mb-1">Age</label>
                    <input type="number" {...register('age', { valueAsNumber: true })} min={15} max={50}
                      className="w-full px-4 py-3 rounded-xl bg-gaffer-card border border-gaffer-border text-white font-body text-sm focus:outline-none focus:border-gaffer-orange transition-colors" />
                  </div>

                  <div>
                    <label className="block text-xs font-body font-medium text-white/80 mb-1">Position</label>
                    <select {...register('position')}
                      className="w-full px-4 py-3 rounded-xl bg-gaffer-card border border-gaffer-border text-white font-body text-sm focus:outline-none focus:border-gaffer-orange transition-colors appearance-none cursor-pointer">
                      <option value="" className="bg-gaffer-card">Select...</option>
                      {POSITIONS.map((pos) => <option key={pos} value={pos} className="bg-gaffer-card">{pos}</option>)}
                    </select>
                    {errors.position && <p className="text-red-400 text-xs mt-1">{errors.position.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-body font-medium text-white/80 mb-1">Nationality</label>
                    <input {...register('nationality')} placeholder="e.g. Nigerian"
                      className="w-full px-4 py-3 rounded-xl bg-gaffer-card border border-gaffer-border text-white placeholder:text-gaffer-subtle font-body text-sm focus:outline-none focus:border-gaffer-orange transition-colors" />
                    {errors.nationality && <p className="text-red-400 text-xs mt-1">{errors.nationality.message}</p>}
                  </div>
                </div>

                <button type="submit" className="w-full py-4 rounded-xl bg-orange-gradient-btn text-white font-display font-bold text-sm shadow-orange-glow">
                  Add to Roster
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
