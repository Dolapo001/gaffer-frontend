'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, X, Users, Search, ChevronDown, Mail, Link2,
  Copy, Check, Clock, RefreshCw, Trash2,
} from 'lucide-react'
import { listOrgs } from '@/lib/services/org.service'
import { listTeams, type Team } from '@/lib/services/team.service'
import {
  listPlayers, addPlayer, removePlayer, createPlayerInvite,
  listPlayerInvites, revokePlayerInvite, type Player, type PlayerInvite,
} from '@/lib/services/team.service'
import { buildInviteLink } from '@/lib/routes'
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

function execCommandCopy(text: string, onSuccess: () => void, toast: { addToast: (msg: string, type: string) => void }) {
  const el = document.createElement('textarea')
  el.value = text
  el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0'
  document.body.appendChild(el)
  el.focus()
  el.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(el)
  if (ok) {
    onSuccess()
  } else {
    toast.addToast('Could not copy — please copy the link manually.', 'error')
  }
}

function timeUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const d = Math.floor(diff / 86400000)
  if (d > 0) return `${d}d left`
  const h = Math.floor(diff / 3600000)
  return `${h}h left`
}

type SheetMode = 'add' | 'invite' | null

export default function PlayersPage() {
  const qc = useQueryClient()
  const toast = useToastStore()
  const [sheetMode, setSheetMode] = useState<SheetMode>(null)
  const [query, setQuery] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [removeTarget, setRemoveTarget] = useState<Player | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null)

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

  const { data: pendingInvites } = useQuery({
    queryKey: ['player-invites', activeTeamId],
    queryFn: () => listPlayerInvites(activeTeamId!),
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
      setSheetMode(null)
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

  const inviteMutation = useMutation({
    mutationFn: (email: string) => createPlayerInvite(activeTeamId!, email),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['player-invites', activeTeamId] })
      // Backend returns a RELATIVE path — prepend origin to make it shareable
      if (data?.inviteLink) setGeneratedLink(buildInviteLink(data.inviteLink))
      toast.addToast('Invite created! Email sent.', 'success')
      setInviteEmail('')
    },
    onError: (err: unknown) => toast.addToast(getErrorMessage(err), 'error'),
  })

  const revokeMutation = useMutation({
    mutationFn: (inviteId: string) => revokePlayerInvite(inviteId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['player-invites', activeTeamId] })
      toast.addToast('Invite revoked', 'info')
      setRevokeTarget(null)
    },
    onError: (err: unknown) => toast.addToast(getErrorMessage(err), 'error'),
  })

  const copyLink = (link: string) => {
    const onCopied = () => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    }
    // navigator.clipboard can silently fail in iOS Safari standalone (PWA) mode;
    // fall back to the legacy execCommand approach which works everywhere.
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(onCopied).catch(() => execCommandCopy(link, onCopied, toast))
    } else {
      execCommandCopy(link, onCopied, toast)
    }
  }

  const filtered = (players ?? []).filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
    (p.position ?? '').toLowerCase().includes(query.toLowerCase())
  )

  const activeTeam = teams?.find((t: Team) => t._id === activeTeamId)
  const pendingCount = pendingInvites?.filter(i => i.status === 'pending').length ?? 0

  return (
    <div className="min-h-screen bg-gaffer-bg">
      {/* Header */}


      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden">
        {/* Header moved inside scrollable area */}
        <div className="border-b border-gaffer-border/50 mb-4">
          <div 
            className="flex items-center justify-between px-4 md:px-6 pb-3"
            style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}
          >
            <div>
              <h1 className="text-xl font-chakra font-black text-white uppercase tracking-tighter">Players</h1>
              <p className="text-gaffer-muted text-xs font-body mt-0.5">
                {players?.length ?? 0} registered
                {pendingCount > 0 && <span className="ml-2 text-gaffer-orange">{pendingCount} invite{pendingCount > 1 ? 's' : ''} pending</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setSheetMode('invite'); setGeneratedLink(null) }}
                disabled={!activeTeamId}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-gaffer-border text-white/60 font-display font-bold text-sm disabled:opacity-40"
              >
                <Link2 size={15} />
              </button>
              <button
                onClick={() => setSheetMode('add')}
                disabled={!activeTeamId}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-gradient-btn text-white font-display font-bold text-sm shadow-orange-glow disabled:opacity-40"
              >
                <Plus size={16} />
                Add
              </button>
            </div>
          </div>

          {/* Team selector */}
          {teams && teams.length > 1 && (
            <div className="px-4 md:px-6 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
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

        <div className="px-4 md:px-6 py-4 pb-28 space-y-4">
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

        {/* Pending Invites list */}
        {(pendingInvites ?? []).filter(i => i.status === 'pending').length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-body font-bold text-gaffer-muted uppercase tracking-widest px-1 flex items-center gap-1.5">
              <Clock size={12} className="text-gaffer-orange" />
              Pending Invites
            </p>
            {pendingInvites!.filter(i => i.status === 'pending').map((inv) => (
              <motion.div
                key={inv._id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 bg-gaffer-card/60 border border-dashed border-gaffer-border rounded-xl px-4 py-3"
              >
                <div className="w-9 h-9 rounded-full bg-gaffer-orange/10 flex items-center justify-center text-gaffer-orange flex-shrink-0">
                  <Mail size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/70 font-body font-medium text-sm truncate">{inv.email}</p>
                  <p className="text-gaffer-muted text-xs font-body">{timeUntil(inv.expiresAt)}</p>
                </div>
                <button
                  onClick={() => copyLink(buildInviteLink(inv.inviteLink))}
                  title="Copy invite link"
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gaffer-subtle hover:text-white transition-colors"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={() => setRevokeTarget(inv._id)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gaffer-subtle hover:text-red-400 transition-colors"
                >
                  <X size={15} />
                </button>
              </motion.div>
            ))}
          </div>
        )}

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
                {query ? 'Try a different search' : `Add or invite players to ${activeTeam?.name ?? 'the roster'}`}
              </p>
            </div>
            {!query && (
              <div className="flex gap-3">
                <button onClick={() => setSheetMode('add')} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-gradient-btn text-white font-display font-bold text-sm shadow-orange-glow">
                  <Plus size={16} />Add
                </button>
                <button onClick={() => { setSheetMode('invite'); setGeneratedLink(null) }} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gaffer-card border border-gaffer-border text-white/70 font-display font-bold text-sm">
                  <Link2 size={16} />Invite
                </button>
              </div>
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

      {/* ─── Add Player Sheet ─── */}
      <AnimatePresence>
        {sheetMode === 'add' && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40" onClick={() => setSheetMode(null)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-gaffer-surface border-t border-gaffer-border rounded-t-3xl">
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gaffer-border" />
              </div>
              <div className="flex items-center justify-between px-5 py-3 border-b border-gaffer-border">
                <h2 className="font-display font-bold text-white text-lg">Add Player</h2>
                <button onClick={() => setSheetMode(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gaffer-card border border-gaffer-border text-gaffer-muted hover:text-white transition-colors">
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

      {/* ─── Invite Player Sheet ─── */}
      <AnimatePresence>
        {sheetMode === 'invite' && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
              onClick={() => { setSheetMode(null); setGeneratedLink(null) }} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-gaffer-surface border-t border-gaffer-border rounded-t-3xl">
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gaffer-border" />
              </div>
              <div className="flex items-center justify-between px-5 py-3 border-b border-gaffer-border">
                <div>
                  <h2 className="font-display font-bold text-white text-lg">Invite Player</h2>
                  <p className="text-gaffer-muted text-xs font-body">A magic link will be emailed to the player</p>
                </div>
                <button onClick={() => { setSheetMode(null); setGeneratedLink(null) }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gaffer-card border border-gaffer-border text-gaffer-muted hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="px-5 py-5 pb-10 space-y-5">
                {/* Generated link display */}
                <AnimatePresence>
                  {generatedLink && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 space-y-3"
                    >
                      <p className="text-green-400 font-body font-bold text-sm flex items-center gap-2">
                        <Check size={16} /> Invite created! Email sent to player.
                      </p>
                      <div className="flex items-center gap-2 bg-black/20 rounded-xl p-3">
                        <p className="text-white/50 text-xs font-mono flex-1 truncate">{generatedLink}</p>
                        <button
                          onClick={() => copyLink(generatedLink)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gaffer-orange/10 border border-gaffer-orange/20 text-gaffer-orange text-xs font-bold transition-colors hover:bg-gaffer-orange/20"
                        >
                          {linkCopied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy Link</>}
                        </button>
                      </div>
                      <p className="text-white/30 text-[11px] font-body">Share this link with the player — expires in 7 days</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <label className="block text-xs font-body font-medium text-white/80">Player Email</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="player@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-gaffer-card border border-gaffer-border text-white placeholder:text-gaffer-subtle font-body text-sm focus:outline-none focus:border-gaffer-orange transition-colors"
                  />
                </div>

                <button
                  onClick={() => inviteMutation.mutate(inviteEmail)}
                  disabled={!inviteEmail || inviteMutation.isPending}
                  className="w-full py-4 rounded-xl bg-orange-gradient-btn text-white font-display font-bold text-sm shadow-orange-glow disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {inviteMutation.isPending
                    ? <><RefreshCw size={16} className="animate-spin" />Sending…</>
                    : <><Mail size={16} />Send Invite Link</>
                  }
                </button>
              </div>
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

      <ConfirmDialog
        open={!!revokeTarget}
        title="Revoke Invite?"
        message="This invite link will no longer work."
        confirmLabel="Revoke"
        destructive
        onConfirm={() => revokeTarget && revokeMutation.mutate(revokeTarget)}
        onCancel={() => setRevokeTarget(null)}
      />
      </div>
    </div>
  )
}
