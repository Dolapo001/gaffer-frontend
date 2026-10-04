'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu, Plus, Mail, Trash2, ShieldCheck, UserCheck, Clock, X,
  RefreshCw, CheckCircle2, Copy, Check, Pencil,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listMembers, listInvites, sendInvite, revokeInvite,
  resendInvite, updateMemberRole, removeMember,
} from '@/lib/services/member.service'
import { listOrgs } from '@/lib/services/org.service'
import { BrowserProtection } from '@/components/BrowserProtection'
import { useToast } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useEffect } from 'react'

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin:   'Manage members & billing',
  manager: 'Full team & fixture management',
  staff:   'Submit lineups & events',
  viewer:  'Read-only access',
}

const ROLES = ['admin', 'manager', 'staff', 'viewer'] as const
type OrgRole = typeof ROLES[number]

function timeUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const d = Math.floor(diff / 86400000)
  if (d > 0) return `${d}d left`
  const h = Math.floor(diff / 3600000)
  return `${h}h left`
}

export default function CollaboratorsPage() {
  const { user } = useAuthStore()
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<OrgRole>('viewer')
  const [sentEmail, setSentEmail] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const { hideNavbar, showNavbar } = useUIStore()

  useEffect(() => {
    if (!isInviteOpen) return
    hideNavbar()
    return () => showNavbar()
  }, [isInviteOpen, hideNavbar, showNavbar])

  const { data: orgs } = useQuery({ queryKey: ['orgs'], queryFn: listOrgs, enabled: !!user })
  const orgId = orgs?.[0]?._id

  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['members', orgId],
    queryFn: () => listMembers(orgId!),
    enabled: !!orgId,
  })

  const { data: invites } = useQuery({
    queryKey: ['invites', orgId],
    queryFn: () => listInvites(orgId!),
    enabled: !!orgId,
  })

  const sendInviteMutation = useMutation({
    mutationFn: (data: { email: string; role: string }) => sendInvite(orgId!, data.email, data.role),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['invites', orgId] })
      setSentEmail(vars.email)
      setIsInviteOpen(false)
      setInviteEmail('')
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  })

  const resendInviteMutation = useMutation({
    mutationFn: (inviteId: string) => resendInvite(orgId!, inviteId),
    onSuccess: (_, inviteId) => {
      queryClient.invalidateQueries({ queryKey: ['invites', orgId] })
      addToast('Invite email resent!', 'success')
      setCopiedId(inviteId)
      setTimeout(() => setCopiedId(null), 2000)
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  })

  const revokeInviteMutation = useMutation({
    mutationFn: (inviteId: string) => revokeInvite(orgId!, inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites', orgId] })
      addToast('Invite revoked', 'info')
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      updateMemberRole(orgId!, userId, role),
    onMutate: async ({ userId, role }) => {
      await queryClient.cancelQueries({ queryKey: ['members', orgId] })
      const previousMembers = queryClient.getQueryData(['members', orgId])
      queryClient.setQueryData(['members', orgId], (old: any) => {
        if (!old) return old
        return old.map((m: any) => m.userId._id === userId ? { ...m, role } : m)
      })
      return { previousMembers }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['members', orgId], context?.previousMembers)
      addToast(getErrorMessage(err), 'error')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['members', orgId] })
    },
    onSuccess: () => {
      addToast('Role updated', 'success')
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => removeMember(orgId!, userId),
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: ['members', orgId] })
      const previousMembers = queryClient.getQueryData(['members', orgId])
      queryClient.setQueryData(['members', orgId], (old: any) => {
        if (!old) return old
        return old.filter((m: any) => m.userId._id !== userId)
      })
      return { previousMembers }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['members', orgId], context?.previousMembers)
      addToast(getErrorMessage(err), 'error')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['members', orgId] })
    },
    onSuccess: () => {
      addToast('Member removed', 'info')
    },
  })

  if (!orgId && !isLoadingMembers) return null

  return (
    <BrowserProtection>
      <div className="fixed inset-0 bg-[#181928] text-white flex flex-col font-inter overflow-hidden pb-4">
        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-32 [&::-webkit-scrollbar]:hidden">
          {/* Header moved inside scrollable area */}
          <div 
            className="flex items-center px-4 md:px-6 pb-6 border-b border-white/5"
            style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}
          >
            <h1 className="text-xl font-chakra font-black text-white uppercase tracking-tighter">Collaborators</h1>
          </div>

          <div className="px-6 pt-6 space-y-8">

          {/* Email sent confirmation banner */}
          <AnimatePresence>
            {sentEmail && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-2xl px-5 py-4"
              >
                <CheckCircle2 size={20} className="text-green-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">Invite sent!</p>
                  <p className="text-[12px] text-white/40 truncate">An email was delivered to <span className="text-white/60">{sentEmail}</span></p>
                </div>
                <button onClick={() => setSentEmail(null)} className="text-white/30 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Members */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <UserCheck size={16} className="text-gaffer-orange" />
              <h2 className="text-[14px] font-chakra font-black uppercase tracking-wider text-white/50">Active Members</h2>
            </div>

            <div className="space-y-3">
              {isLoadingMembers ? (
                <>
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-[#1C2130] rounded-[24px] p-5 border border-white/5 flex gap-4 animate-pulse">
                      <div className="w-12 h-12 rounded-full bg-white/10 shrink-0" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-white/10 rounded w-1/3" />
                        <div className="h-3 bg-white/10 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </>
              ) : members?.map((member) => (
                <div key={member.userId._id} className="bg-[#1C2130] rounded-[24px] p-5 border border-white/5 flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00C2FF] to-[#0047FF] flex items-center justify-center font-black text-xl shrink-0">
                        {(member.userId.fullName || member.userId.email)[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-[17px] leading-tight truncate">{member.userId.fullName || '—'}</h3>
                        <p className="text-white/40 text-[13px] truncate">{member.userId.email}</p>
                      </div>
                    </div>

                    {/* Edit role dropdown */}
                    <div className="flex items-center gap-1.5 shrink-0 relative">
                      <span className="px-3 py-1 bg-gaffer-orange/10 border border-gaffer-orange/20 rounded-full text-gaffer-orange text-[11px] font-black uppercase tracking-tighter">
                        {member.role}
                      </span>
                      <button 
                        onClick={() => setOpenDropdownId(openDropdownId === member.userId._id ? null : member.userId._id)}
                        className="w-7 h-7 rounded-full border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors relative z-10"
                      >
                         <Pencil size={12} className="text-white/60" />
                      </button>

                      <AnimatePresence>
                        {openDropdownId === member.userId._id && (
                           <>
                             {/* Transparent backdrop to click-off and close */}
                             <div 
                               className="fixed inset-0 z-40" 
                               onClick={() => setOpenDropdownId(null)}
                             />
                             <motion.div
                               initial={{ opacity: 0, scale: 0.95, y: -10 }}
                               animate={{ opacity: 1, scale: 1, y: 0 }}
                               exit={{ opacity: 0, scale: 0.95, y: -10 }}
                               className="absolute top-10 right-0 w-[180px] bg-[#11121C] border border-white/10 rounded-2xl shadow-[-10px_10px_30px_rgba(0,0,0,0.5)] z-50 overflow-hidden flex flex-col py-1"
                             >
                               {ROLES.map(r => (
                                 <button
                                   key={r}
                                   onClick={() => {
                                      updateRoleMutation.mutate({ userId: member.userId._id, role: r })
                                      setOpenDropdownId(null)
                                   }}
                                   className={`px-4 py-3 text-left transition-colors flex flex-col gap-0.5 ${
                                     member.role === r ? 'bg-gaffer-orange/10 border-l-2 border-gaffer-orange' : 'hover:bg-white/5 border-l-2 border-transparent'
                                   }`}
                                 >
                                   <span className={`text-[12px] font-black tracking-widest uppercase ${member.role === r ? 'text-gaffer-orange' : 'text-white'}`}>
                                     {r}
                                   </span>
                                   <span className="text-[9px] text-white/40 leading-tight">
                                     {ROLE_DESCRIPTIONS[r]}
                                   </span>
                                 </button>
                               ))}
                             </motion.div>
                           </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="text-[11px] text-white/20 font-bold uppercase tracking-widest pl-1">
                    {ROLE_DESCRIPTIONS[member.role]}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-[11px] text-white/20 uppercase font-bold tracking-widest">
                      Joined {new Date(member.joinedAt || member.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${member.userId.fullName || member.userId.email}?`)) {
                          removeMemberMutation.mutate(member.userId._id)
                        }
                      }}
                      className="text-white/30 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {members?.length === 0 && (
                <div className="py-12 flex flex-col items-center text-center opacity-30">
                  <ShieldCheck size={48} className="mb-4" />
                  <p className="font-chakra font-black uppercase tracking-[0.2em]">No members yet</p>
                </div>
              )}
            </div>
          </section>

          {/* Pending Invites */}
          {(invites?.length || 0) > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Clock size={16} className="text-gaffer-orange" />
                <h2 className="text-[14px] font-chakra font-black uppercase tracking-wider text-white/50">
                  Pending Invites
                </h2>
              </div>

              <div className="space-y-3">
                {invites?.map((invite) => (
                  <motion.div
                    key={invite._id}
                    layout
                    className="bg-[#1C2130]/50 rounded-[20px] p-4 border border-white/5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                          <Mail size={18} className="text-white/30" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-[15px] truncate">{invite.invitedEmail}</h4>
                          <p className="text-[11px] text-white/30 uppercase font-black tracking-tighter">
                            {invite.role} · <span className="text-gaffer-orange/60">{timeUntil(invite.expiresAt)}</span>
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 ml-2">
                        {/* Resend */}
                        <button
                          onClick={() => resendInviteMutation.mutate(invite._id)}
                          disabled={resendInviteMutation.isPending}
                          title="Resend email"
                          className="w-8 h-8 flex items-center justify-center rounded-full text-white/20 hover:text-gaffer-orange transition-colors"
                        >
                          {copiedId === invite._id
                            ? <Check size={16} className="text-green-400" />
                            : <RefreshCw size={15} className={resendInviteMutation.isPending ? 'animate-spin' : ''} />
                          }
                        </button>
                        {/* Revoke */}
                        <button
                          onClick={() => revokeInviteMutation.mutate(invite._id)}
                          disabled={revokeInviteMutation.isPending}
                          title="Revoke invite"
                          className="w-8 h-8 flex items-center justify-center rounded-full text-white/20 hover:text-red-500 transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* FAB */}
        <button
          onClick={() => setIsInviteOpen(true)}
          className="fixed bottom-[130px] right-6 w-16 h-16 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#FF2400] flex items-center justify-center text-white shadow-2xl z-40 active:scale-95 transition-transform"
        >
          <Plus size={32} strokeWidth={2.5} />
        </button>

        {/* Invite Sheet */}
        <AnimatePresence>
          {isInviteOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsInviteOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110]"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                className="fixed bottom-0 left-0 right-0 bg-[#1C2130] rounded-t-[40px] z-[120] p-8 pt-12 pb-16 border-t border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.5)]"
              >
                <div className="max-w-[400px] mx-auto space-y-8">
                  {/* Title */}
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-display font-black uppercase tracking-tighter text-white">Add Collaborator</h2>
                    <p className="text-white/40 text-sm font-medium">An invitation email will be sent automatically.</p>
                  </div>

                  <div className="space-y-6">
                    {/* Email */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-white/30 ml-1">Email Address</label>
                      <input
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="collaborator@example.com"
                        type="email"
                        className="w-full bg-[#181928] border border-white/5 rounded-2xl py-4 px-6 text-[15px] font-medium outline-none focus:border-gaffer-orange transition-colors"
                      />
                    </div>

                    {/* Role */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-white/30 ml-1">Role Permission</label>
                      <div className="grid grid-cols-2 gap-3">
                        {ROLES.map((r) => (
                          <button
                            key={r}
                            onClick={() => setInviteRole(r)}
                            className={`py-3 px-4 rounded-xl text-left border-2 transition-all ${
                              inviteRole === r
                                ? 'bg-gaffer-orange/10 border-gaffer-orange text-gaffer-orange'
                                : 'bg-white/5 border-transparent text-white/30 hover:bg-white/10'
                            }`}
                          >
                            <div className="text-[12px] font-black uppercase tracking-tighter">{r}</div>
                            <div className="text-[10px] font-medium opacity-60 mt-0.5 leading-tight">{ROLE_DESCRIPTIONS[r]}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => sendInviteMutation.mutate({ email: inviteEmail, role: inviteRole })}
                      disabled={!inviteEmail || sendInviteMutation.isPending}
                      className="w-full bg-gradient-to-r from-[#FF7A00] to-[#FF0000] text-white font-black text-sm py-5 rounded-[24px] shadow-[0_10px_20px_rgba(255,0,0,0.2)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                    >
                      {sendInviteMutation.isPending ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <Mail size={18} />
                          Send Invite
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        </div>
      </div>
    </BrowserProtection>
  )
}
