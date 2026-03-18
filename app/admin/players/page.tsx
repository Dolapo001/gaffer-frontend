'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, Users, Search, ChevronDown } from 'lucide-react'
import { listOrgs } from '@/lib/services/org.service'
import { listTeams, type Team } from '@/lib/services/team.service'
import { listPlayers, addPlayer, removePlayer, type Player } from '@/lib/services/team.service'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'
import { ConfirmDialog } from '@/components/ConfirmDialog'

const addSchema = z.object({
  firstName: z.string().min(2, 'First name too short'),
  lastName: z.string().min(2, 'Last name too short'),
  position: z.string().min(1, 'Required'),
  jerseyNumber: z.number().min(1).max(99).optional(),
  nationality: z.string().optional(),
})
type AddFormData = z.infer<typeof addSchema>

const POSITIONS = ['goalkeeper', 'defender', 'midfielder', 'forward']

export default function PlayersPage() {
  const qc = useQueryClient()
  const toast = useToastStore()
  const [showAdd, setShowAdd] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [removeTarget, setRemoveTarget] = useState<Player | null>(null)

  const { data: orgs } = useQuery({ queryKey: ['orgs'], queryFn: listOrgs })
  const firstOrg = orgs?.[0]

  const { data: teams } = useQuery({
    queryKey: ['teams', firstOrg?._id],
    queryFn: () => listTeams(firstOrg!._id),
    enabled: !!firstOrg?._id,
  })

  const activeTeamId = selectedTeamId ?? teams?.[0]?._id ?? null

  const { data: players, isLoading } = useQuery({
    queryKey: ['players', activeTeamId],
    queryFn: () => listPlayers(activeTeamId!),
    enabled: !!activeTeamId,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddFormData>({
    resolver: zodResolver(addSchema),
    defaultValues: { jerseyNumber: undefined },
  })

  const addMutation = useMutation({
    mutationFn: (data: AddFormData) => addPlayer(activeTeamId!, {
      firstName: data.firstName,
      lastName: data.lastName,
      position: data.position,
      jerseyNumber: data.jerseyNumber,
      nationality: data.nationality,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['players', activeTeamId] })
      toast.addToast('Player added', 'success')
      reset()
      setShowAdd(false)
    },
    onError: (err: unknown) => toast.addToast(getErrorMessage(err), 'error'),
  })

  const removeMutation = useMutation({
    mutationFn: (playerId: string) => removePlayer(activeTeamId!, playerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['players', activeTeamId] })
      toast.addToast('Player removed', 'success')
      setRemoveTarget(null)
    },
    onError: (err: unknown) => toast.addToast(getErrorMessage(err), 'error'),
  })

  const filtered = (players ?? []).filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
    (p.position ?? '').toLowerCase().includes(query.toLowerCase())
  )

  const activeTeam = teams?.find((t: Team) => t._id === activeTeamId)

  return (
    <div className="min-h-screen bg-gaffer-bg">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gaffer-bg/95 backdrop-blur-md border-b border-gaffer-border/50">
        <div className="flex items-center justify-between px-4 pt-12 pb-3">
          <div>
            <h1 className="font-display font-bold text-xl text-white">Players</h1>
            <p className="text-gaffer-muted text-xs font-body mt-0.5">{players?.length ?? 0} registered</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            disabled={!activeTeamId}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-gradient-btn text-white font-display font-bold text-sm shadow-orange-glow disabled:opacity-40"
          >
            <Plus size={16} />
            Add
          </button>
        </div>

        {/* Team selector */}
        {teams && teams.length > 1 && (
          <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
            {teams.map((t: Team) => (
              <button
                key={t._id}
                onClick={() => setSelectedTeamId(t._id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-body font-medium border transition-all ${
                  t._id === activeTeamId
                    ? 'bg-gaffer-orange/10 border-gaffer-orange/50 text-gaffer-orange'
                    : 'bg-gaffer-card border-gaffer-border text-gaffer-muted'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
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
        {!activeTeamId ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gaffer-card border border-gaffer-border flex items-center justify-center">
              <Users size={28} className="text-gaffer-subtle" />
            </div>
            <p className="text-gaffer-muted text-sm font-body text-center">No teams found. Create a team first.</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gaffer-card rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gaffer-card border border-gaffer-border flex items-center justify-center">
              <Users size={28} className="text-gaffer-subtle" />
            </div>
            <div className="text-center">
              <p className="text-white font-body font-medium">{query ? 'No players found' : 'No players yet'}</p>
              <p className="text-gaffer-muted text-sm font-body mt-1">
                {query ? 'Try a different search' : `Add players to ${activeTeam?.name ?? 'the roster'}`}
              </p>
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
              {filtered.map((p, i) => (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 bg-gaffer-card border border-gaffer-border rounded-xl px-4 py-3"
                >
                  <div className="w-9 h-9 rounded-full bg-orange-gradient-btn flex items-center justify-center text-sm text-white font-display font-bold flex-shrink-0">
                    {p.firstName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-body font-medium text-sm">{p.firstName} {p.lastName}</p>
                    <p className="text-gaffer-muted text-xs font-body capitalize">
                      {p.position ?? 'Unknown'}{p.jerseyNumber ? ` · #${p.jerseyNumber}` : ''}
                    </p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-body font-medium border ${
                    p.squadStatus === 'active'
                      ? 'text-green-400 bg-green-400/10 border-green-400/30'
                      : p.squadStatus === 'injured'
                      ? 'text-red-400 bg-red-400/10 border-red-400/30'
                      : 'text-gaffer-muted bg-gaffer-surface border-gaffer-border'
                  }`}>{p.squadStatus}</span>
                  <button
                    onClick={() => setRemoveTarget(p)}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-gaffer-subtle hover:text-red-400 transition-colors"
                  >
                    <X size={15} />
                  </button>
                </motion.div>
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

              <form onSubmit={handleSubmit((d) => addMutation.mutate(d))} className="px-5 py-4 space-y-4 pb-8">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-body font-medium text-white/80 mb-1">First Name</label>
                    <input {...register('firstName')} placeholder="First"
                      className="w-full px-4 py-3 rounded-xl bg-gaffer-card border border-gaffer-border text-white placeholder:text-gaffer-subtle font-body text-sm focus:outline-none focus:border-gaffer-orange transition-colors" />
                    {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-body font-medium text-white/80 mb-1">Last Name</label>
                    <input {...register('lastName')} placeholder="Last"
                      className="w-full px-4 py-3 rounded-xl bg-gaffer-card border border-gaffer-border text-white placeholder:text-gaffer-subtle font-body text-sm focus:outline-none focus:border-gaffer-orange transition-colors" />
                    {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-body font-medium text-white/80 mb-1">Jersey #</label>
                    <input type="number" {...register('jerseyNumber', { valueAsNumber: true })} min={1} max={99}
                      className="w-full px-4 py-3 rounded-xl bg-gaffer-card border border-gaffer-border text-white font-body text-sm focus:outline-none focus:border-gaffer-orange transition-colors" />
                  </div>

                  <div>
                    <label className="block text-xs font-body font-medium text-white/80 mb-1">Nationality</label>
                    <input {...register('nationality')} placeholder="e.g. Nigerian"
                      className="w-full px-4 py-3 rounded-xl bg-gaffer-card border border-gaffer-border text-white placeholder:text-gaffer-subtle font-body text-sm focus:outline-none focus:border-gaffer-orange transition-colors" />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-body font-medium text-white/80 mb-1">Position</label>
                    <div className="relative">
                      <select {...register('position')}
                        className="w-full px-4 py-3 rounded-xl bg-gaffer-card border border-gaffer-border text-white font-body text-sm focus:outline-none focus:border-gaffer-orange transition-colors appearance-none cursor-pointer">
                        <option value="" className="bg-gaffer-card">Select...</option>
                        {POSITIONS.map((pos) => <option key={pos} value={pos} className="bg-gaffer-card capitalize">{pos}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gaffer-subtle pointer-events-none" />
                    </div>
                    {errors.position && <p className="text-red-400 text-xs mt-1">{errors.position.message}</p>}
                  </div>
                </div>

                <button type="submit" disabled={addMutation.isPending}
                  className="w-full py-4 rounded-xl bg-orange-gradient-btn text-white font-display font-bold text-sm shadow-orange-glow disabled:opacity-60">
                  {addMutation.isPending ? 'Adding...' : 'Add to Roster'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!removeTarget}
        title="Remove Player?"
        message={removeTarget ? `Remove ${removeTarget.firstName} ${removeTarget.lastName} from the roster?` : ''}
        confirmLabel="Remove"
        destructive
        onConfirm={() => removeTarget && removeMutation.mutate(removeTarget._id)}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  )
}
