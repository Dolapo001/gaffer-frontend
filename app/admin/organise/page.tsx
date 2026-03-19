'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, ChevronDown, ChevronLeft, ChevronRight,
  Check, User, X
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BrowserProtection } from '@/components/BrowserProtection'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'
import { listOrgs } from '@/lib/services/org.service'
import {
  listTeams, createTeam, listPlayers, createPlayerInvite,
  type Team, type Player,
} from '@/lib/services/team.service'

const SPORTS = ['football', 'basketball', 'volleyball', 'cricket', 'other']
const GENDER_OPTS: Array<{ label: string; value: 'male' | 'female' | 'mixed' }> = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Mixed', value: 'mixed' },
]

export default function OrganizePage() {
  const qc = useQueryClient()
  const toast = useToastStore()

  const [activeTab, setActiveTab] = useState<'Teams'>('Teams')
  const [view, setView] = useState<'list' | 'create' | 'details' | 'share'>('list')
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)

  // Create team form state
  const [teamName, setTeamName] = useState('')
  const [teamHandle, setTeamHandle] = useState('')
  const [teamSport, setTeamSport] = useState('football')
  const [teamGender, setTeamGender] = useState<'male' | 'female' | 'mixed'>('male')
  const [logoPreview] = useState<string | null>(null)

  // Share / invite state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: orgs } = useQuery({ queryKey: ['orgs'], queryFn: listOrgs })
  const firstOrg = orgs?.[0]

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['teams', firstOrg?._id],
    queryFn: () => listTeams(firstOrg!._id),
    enabled: !!firstOrg?._id,
  })

  const { data: players = [], isLoading: playersLoading } = useQuery({
    queryKey: ['players', selectedTeam?._id],
    queryFn: () => listPlayers(selectedTeam!._id),
    enabled: !!selectedTeam?._id && view === 'details',
  })

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: () =>
      createTeam(firstOrg!._id, {
        name: teamName.trim(),
        handle: teamHandle.trim() || teamName.trim().toLowerCase().replace(/\s+/g, '-'),
        sport: teamSport,
        genderCategory: teamGender,
      }),
    onSuccess: (team: Team) => {
      qc.invalidateQueries({ queryKey: ['teams', firstOrg?._id] })
      toast.addToast('Team created', 'success')
      setSelectedTeam(team)
      setTeamName('')
      setTeamHandle('')
      setView('details')
    },
    onError: (err: unknown) => toast.addToast(getErrorMessage(err), 'error'),
  })

  const inviteMutation = useMutation({
    mutationFn: () => createPlayerInvite(selectedTeam!._id, inviteEmail.trim()),
    onSuccess: (res: { invite: { email: string; expiresAt: string; inviteLink: string } }) => {
      setInviteLink(res.invite.inviteLink)
      setInviteEmail('')
      toast.addToast('Invite created', 'success')
    },
    onError: (err: unknown) => toast.addToast(getErrorMessage(err), 'error'),
  })

  const handleCopy = () => {
    if (!inviteLink) return
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true)
      toast.addToast('Link copied!', 'success')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const canCreate = teamName.trim().length >= 2

  return (
    <BrowserProtection>
      <div className="fixed inset-0 bg-[#181928] text-white flex flex-col font-inter overflow-hidden pb-4">
        {/* Header */}
        <div className="flex items-center px-6 pt-12 pb-4 text-white border-b border-white/10 shrink-0">
          <h1 className="text-lg font-semibold tracking-tight">Organize</h1>
        </div>

        <div className="flex-1 relative">
          <AnimatePresence mode="wait">
            {/* ── LIST VIEW ── */}
            {view === 'list' && (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col space-y-4 px-6 pt-2"
              >
                {/* Tab Switcher (only Teams for now — no groups API) */}
                <div className="bg-white/5 p-1.5 rounded-xl flex border border-white/5">
                  <button
                    onClick={() => setActiveTab('Teams')}
                    className="flex-1 py-2.5 rounded-lg font-semibold text-sm bg-[#2F3342] text-white shadow-lg flex flex-col items-center justify-center"
                  >
                    Teams
                    <div className="w-4 h-0.5 bg-orange-500 rounded-full mt-1" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pb-40 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {teamsLoading ? (
                    <div className="space-y-3">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="h-20 bg-[#1C2130] rounded-2xl animate-pulse" />
                      ))}
                    </div>
                  ) : teams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
                      <h3 className="text-white text-[17px] font-semibold mb-2">No Teams Yet</h3>
                      <p className="text-[14px] text-[#A1A1AA] max-w-[300px] leading-[1.4]">
                        Create your first team to start adding players and managing your roster.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {teams.map((team) => (
                        <div
                          key={team._id}
                          onClick={() => {
                            setSelectedTeam(team)
                            setView('details')
                          }}
                          className="bg-[#1C2130] border border-white/5 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-all"
                        >
                          <div className="w-14 h-14 shrink-0 rounded-full bg-gaffer-orange/10 border border-gaffer-orange/20 flex items-center justify-center text-2xl font-bold text-gaffer-orange uppercase">
                            {team.shortName?.[0] ?? team.name[0]}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-[17px] text-white tracking-[0.05em] mb-1">{team.name}</h4>
                            <p className="text-[12px] text-[#A1A1AA] capitalize">{team.sport} · {team.genderCategory ?? 'mixed'}</p>
                          </div>
                          <div className="w-5 h-5 rounded-full border border-white flex items-center justify-center shrink-0">
                            <ChevronRight size={12} strokeWidth={2.5} className="text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── CREATE TEAM SHEET ── */}
            {view === 'create' && (
              <>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45]"
                  onClick={() => setView('list')}
                />
                <motion.div
                  initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
                  className="fixed bottom-0 left-0 right-0 z-50 bg-[#0F172B] backdrop-blur-xl rounded-t-[30px] border-t border-white/10 shadow-2xl"
                >
                  <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                  </div>

                  <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
                    <h2 className="text-white font-bold text-lg">Create Team</h2>
                    <button onClick={() => setView('list')} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <X size={16} className="text-white/60" />
                    </button>
                  </div>

                  <div className="px-6 py-4 space-y-4 pb-8">
                    {/* Logo placeholder */}
                    <div className="flex flex-col items-center mb-2">
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-20 h-20 rounded-full bg-gaffer-orange/10 border-2 border-dashed border-gaffer-orange/30 flex items-center justify-center cursor-pointer hover:border-gaffer-orange/60 transition-colors"
                      >
                        {logoPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logoPreview} alt="" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <Plus size={28} className="text-gaffer-orange/40" />
                        )}
                      </div>
                      <span className="text-white/40 text-[10px] uppercase font-bold tracking-widest mt-2">Team Logo</span>
                    </div>

                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-1">Team Name *</label>
                      <input
                        type="text"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="e.g. Arsenal FC"
                        className="w-full bg-[#1C2237] text-white px-5 py-3.5 rounded-xl border border-white/5 focus:outline-none focus:border-white/20 placeholder-gray-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-1">Handle</label>
                      <input
                        type="text"
                        value={teamHandle}
                        onChange={(e) => setTeamHandle(e.target.value)}
                        placeholder="auto-generated if empty"
                        className="w-full bg-[#1C2237] text-white px-5 py-3.5 rounded-xl border border-white/5 focus:outline-none focus:border-white/20 placeholder-gray-500 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-1">Sport</label>
                        <div className="relative">
                          <select
                            value={teamSport}
                            onChange={(e) => setTeamSport(e.target.value)}
                            className="w-full bg-[#1C2237] text-white px-5 py-3.5 rounded-xl border border-white/5 focus:outline-none appearance-none text-sm capitalize"
                          >
                            {SPORTS.map((s) => <option key={s} value={s} className="bg-[#1C2237] capitalize">{s}</option>)}
                          </select>
                          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-1">Gender</label>
                        <div className="relative">
                          <select
                            value={teamGender}
                            onChange={(e) => setTeamGender(e.target.value as 'male' | 'female' | 'mixed')}
                            className="w-full bg-[#1C2237] text-white px-5 py-3.5 rounded-xl border border-white/5 focus:outline-none appearance-none text-sm"
                          >
                            {GENDER_OPTS.map((g) => <option key={g.value} value={g.value} className="bg-[#1C2237]">{g.label}</option>)}
                          </select>
                          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => canCreate && createMutation.mutate()}
                      disabled={!canCreate || createMutation.isPending}
                      className="w-full bg-gradient-to-r from-[#FF7A00] to-[#FF0000] text-white font-bold py-3.5 rounded-2xl text-base shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                    >
                      {createMutation.isPending ? 'Creating...' : 'Create Team'}
                    </button>
                  </div>
                </motion.div>
              </>
            )}

            {/* ── TEAM DETAILS VIEW ── */}
            {view === 'details' && selectedTeam && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute inset-0 z-20 bg-[#181928] flex flex-col"
              >
                <div className="flex flex-col items-center pt-12 pb-6 px-6 relative shrink-0">
                  <button
                    onClick={() => setView('list')}
                    className="absolute left-6 top-[52px] w-6 h-6 rounded-full border border-white flex items-center justify-center"
                  >
                    <ChevronLeft size={14} strokeWidth={2.5} />
                  </button>
                  <h2 className="text-[17px] font-bold tracking-[0.05em] mb-4">{selectedTeam.name}</h2>
                  <div className="w-10 h-10 rounded-full bg-gaffer-orange/10 border border-gaffer-orange/20 flex items-center justify-center text-lg font-bold text-gaffer-orange uppercase">
                    {selectedTeam.shortName?.[0] ?? selectedTeam.name[0]}
                  </div>
                </div>

                {/* Player List */}
                <div className="flex-1 overflow-y-auto px-6 pb-40 space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {playersLoading ? (
                    <div className="space-y-3">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-[#1C1F2D] rounded-2xl animate-pulse" />
                      ))}
                    </div>
                  ) : players.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <p className="text-white/60 text-sm">No players yet.</p>
                      <p className="text-white/30 text-xs mt-1">Use the invite button to add players.</p>
                    </div>
                  ) : (
                    players.map((player: Player) => (
                      <div
                        key={player._id}
                        className="bg-[#1C1F2D] rounded-[24px] p-4 flex items-center gap-4 border border-white/5"
                      >
                        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0">
                          <User size={22} className="text-white/30" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-chakra font-black text-[15px] leading-tight uppercase italic text-white/90 truncate">
                            {player.firstName} {player.lastName}
                          </h5>
                          <p className="text-[10px] uppercase font-black tracking-[0.15em] text-white/40 italic capitalize">
                            {player.position ?? 'Unknown'}{player.jerseyNumber ? ` · #${player.jerseyNumber}` : ''}
                          </p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border flex-shrink-0 ${
                          player.squadStatus === 'active'
                            ? 'text-green-400 bg-green-400/10 border-green-400/30'
                            : player.squadStatus === 'injured'
                            ? 'text-red-400 bg-red-400/10 border-red-400/30'
                            : 'text-white/30 bg-white/5 border-white/10'
                        }`}>
                          {player.squadStatus}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Fixed Bottom CTA */}
                <div className="absolute bottom-[104px] left-0 right-0 px-6 pt-4 pb-4 bg-gradient-to-t from-[#181928] via-[#181928] to-transparent z-30">
                  <button
                    onClick={() => { setInviteLink(null); setInviteEmail(''); setView('share') }}
                    className="w-full bg-gradient-to-r from-[#FF7A00] to-[#FF0000] text-white font-bold text-[17px] py-4 rounded-[16px] shadow-lg active:scale-[0.98] transition-all"
                  >
                    Invite Players
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── SHARE / INVITE VIEW ── */}
            {view === 'share' && selectedTeam && (
              <motion.div
                key="share"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute inset-0 z-20 bg-[#181928] flex flex-col items-center pt-12 px-6 text-center"
              >
                <button
                  onClick={() => setView('details')}
                  className="absolute left-6 top-[52px] w-6 h-6 rounded-full border border-white flex items-center justify-center"
                >
                  <ChevronLeft size={14} strokeWidth={2.5} />
                </button>

                <h2 className="text-[17px] font-bold tracking-[0.05em] mb-6 mt-1">Invite to {selectedTeam.name}</h2>

                <div className="w-[60px] h-[60px] rounded-full bg-gaffer-orange/10 border border-gaffer-orange/20 flex items-center justify-center text-2xl font-bold text-gaffer-orange uppercase mb-6">
                  {selectedTeam.shortName?.[0] ?? selectedTeam.name[0]}
                </div>

                <p className="text-[#E2E8F0] text-[13.5px] leading-[1.6] max-w-[280px] mb-8">
                  Enter a player&apos;s email to generate a secure invite link. They can use it to register and join the team.
                </p>

                {/* Email input + generate */}
                <div className="w-full max-w-[340px] space-y-3 mb-6">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="player@email.com"
                    className="w-full bg-[#1C2130] text-white px-5 py-3.5 rounded-xl border border-white/5 focus:outline-none focus:border-white/20 placeholder-gray-500 text-sm text-center"
                  />
                  <button
                    onClick={() => inviteEmail.trim() && inviteMutation.mutate()}
                    disabled={!inviteEmail.trim() || inviteMutation.isPending}
                    className="w-full bg-gradient-to-r from-[#FF7A00] to-[#FF0000] text-white font-bold py-3 rounded-2xl text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {inviteMutation.isPending ? 'Generating...' : 'Generate Invite Link'}
                  </button>
                </div>

                {/* Invite link display */}
                {inviteLink && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-[340px] bg-[#1C2130] rounded-[16px] p-4 flex items-center justify-between border border-[#2C3140]"
                  >
                    <span className="text-[12px] text-white/70 truncate pr-4 text-left">{inviteLink}</span>
                    <button
                      onClick={handleCopy}
                      className="shrink-0 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {copied
                        ? <Check size={16} className="text-green-400" />
                        : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                      }
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Action Button — only on list view */}
        {view === 'list' && (
          <button
            onClick={() => setView('create')}
            className="fixed bottom-[130px] right-6 w-16 h-16 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#FF2400] flex items-center justify-center text-white shadow-2xl z-40 active:scale-95 transition-transform"
          >
            <Plus size={32} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </BrowserProtection>
  )
}
