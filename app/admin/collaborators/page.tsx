'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Plus, Mail, Trash2, ShieldCheck, UserCheck, Clock, X, ChevronDown } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listMembers, listInvites, sendInvite, revokeInvite, updateMemberRole, removeMember } from '@/lib/services/member.service'
import { listOrgs } from '@/lib/services/org.service'
import { BrowserProtection } from '@/components/BrowserProtection'
import { useToast } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useEffect } from 'react'

export default function CollaboratorsPage() {
  const { user } = useAuthStore()
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'manager' | 'staff' | 'viewer'>('viewer')
  const { hideNavbar, showNavbar } = useUIStore()

  useEffect(() => {
    if (isInviteOpen) hideNavbar()
    else showNavbar()
    // Ensure we show it when leaving the page
    return () => showNavbar()
  }, [isInviteOpen, hideNavbar, showNavbar])

  // 1. Fetch Organization
  const { data: orgs } = useQuery({
    queryKey: ['orgs'],
    queryFn: listOrgs,
    enabled: !!user,
  })

  const orgId = orgs?.[0]?._id

  // 2. Fetch Members & Invites
  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['members', orgId],
    queryFn: () => listMembers(orgId!),
    enabled: !!orgId,
  })

  const { data: invites, isLoading: isLoadingInvites } = useQuery({
    queryKey: ['invites', orgId],
    queryFn: () => listInvites(orgId!),
    enabled: !!orgId,
  })

  // Mutations
  const sendInviteMutation = useMutation({
    mutationFn: (data: { email: string; role: string }) => sendInvite(orgId!, data.email, data.role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites', orgId] })
      addToast('Invite sent successfully!', 'success')
      setIsInviteOpen(false)
      setInviteEmail('')
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
    mutationFn: ({ userId, role }: { userId: string; role: string }) => updateMemberRole(orgId!, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', orgId] })
      addToast('Role updated', 'success')
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  })

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => removeMember(orgId!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', orgId] })
      addToast('Member removed', 'info')
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  })

  if (!orgId && !isLoadingMembers) return null

  return (
    <BrowserProtection>
      <div className="fixed inset-0 bg-[#181928] text-white flex flex-col font-inter overflow-hidden pb-4">
        {/* Header */}
        <div className="flex items-center px-6 pt-12 pb-4 border-b border-white/10 shrink-0">
          <Menu size={24} className="mr-4 text-white/60" />
          <h1 className="text-lg font-semibold tracking-tight">Collaborators</h1>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pt-6 space-y-8 pb-32 [&::-webkit-scrollbar]:hidden">
          
          {/* Active Members Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <UserCheck size={16} className="text-gaffer-orange" />
              <h2 className="text-[14px] font-chakra font-black uppercase tracking-wider text-white/50">Active Members</h2>
            </div>
            
            <div className="space-y-3">
              {members?.map((member) => (
                <div key={member.userId._id} className="bg-[#1C2130] rounded-[24px] p-5 border border-white/5 flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00C2FF] to-[#0047FF] flex items-center justify-center font-black text-xl">
                        {member.userId.fullName[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-[17px] leading-tight">{member.userId.fullName}</h3>
                        <p className="text-white/40 text-[13px]">{member.userId.email}</p>
                      </div>
                    </div>
                    
                    {/* Role Badge & Cycle button */}
                    <button 
                      onClick={() => {
                        const roles: ('admin' | 'manager' | 'staff' | 'viewer')[] = ['admin', 'manager', 'staff', 'viewer']
                        const nextRole = roles[(roles.indexOf(member.role) + 1) % roles.length]
                        updateRoleMutation.mutate({ userId: member.userId._id, role: nextRole })
                      }}
                      className="px-3 py-1 bg-gaffer-orange/10 border border-gaffer-orange/20 rounded-full text-gaffer-orange text-[11px] font-black uppercase tracking-tighter hover:bg-gaffer-orange/20 transition-colors"
                    >
                      {member.role}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-[11px] text-white/20 uppercase font-bold tracking-widest">
                      Joined {new Date(member.joinedAt || member.createdAt).toLocaleDateString()}
                    </span>
                    <button 
                      onClick={() => {
                        if (confirm(`Are you sure you want to remove ${member.userId.fullName}?`)) {
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

          {/* Pending Invites Section */}
          {(invites?.length || 0) > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Clock size={16} className="text-gaffer-orange" />
                <h2 className="text-[14px] font-chakra font-black uppercase tracking-wider text-white/50">Pending Invites</h2>
              </div>

              <div className="space-y-3">
                {invites?.map((invite) => (
                  <div key={invite._id} className="bg-[#1C2130]/50 rounded-[20px] p-4 border border-white/5 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                        <Mail size={18} className="text-white/30" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[15px]">{invite.invitedEmail}</h4>
                        <p className="text-[11px] text-white/30 uppercase font-black tracking-tighter">ROLE: {invite.role}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => revokeInviteMutation.mutate(invite._id)}
                      className="text-white/20 hover:text-red-500 transition-colors p-2"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>

        {/* Floating Action Button */}
        <button
          onClick={() => setIsInviteOpen(true)}
          className="fixed bottom-[130px] right-6 w-16 h-16 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#FF2400] flex items-center justify-center text-white shadow-2xl z-40 active:scale-95 transition-transform"
        >
          <Plus size={32} strokeWidth={2.5} />
        </button>

        {/* Invite Member Drawer/Sheet */}
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
                className="fixed bottom-0 left-0 right-0 bg-[#1C2130] rounded-t-[40px] z-[120] p-8 pt-12 pb-16 border-t border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.5)]"
              >
                <div className="max-w-[400px] mx-auto space-y-8">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-display font-black uppercase tracking-tighter text-white">Add Collaborator</h2>
                    <p className="text-white/40 text-sm font-medium">Send an invite to join your organization.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-white/30 ml-1">Email Address</label>
                      <input 
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="collaborator@example.com"
                        className="w-full bg-[#181928] border border-white/5 rounded-2xl py-4 px-6 text-[15px] font-medium outline-none focus:border-gaffer-orange transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-white/30 ml-1">Role Permission</label>
                      <div className="grid grid-cols-2 gap-3">
                        {(['admin', 'manager', 'staff', 'viewer'] as const).map((r) => (
                          <button
                            key={r}
                            onClick={() => setInviteRole(r)}
                            className={`py-3 rounded-xl text-[12px] font-black uppercase tracking-tighter border-2 transition-all ${
                              inviteRole === r 
                                ? 'bg-gaffer-orange/10 border-gaffer-orange text-gaffer-orange' 
                                : 'bg-white/5 border-transparent text-white/30 hover:bg-white/10'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => sendInviteMutation.mutate({ email: inviteEmail, role: inviteRole })}
                      disabled={!inviteEmail || sendInviteMutation.isPending}
                      className="w-full bg-gradient-to-r from-[#FF7A00] to-[#FF0000] text-white font-black text-lg py-5 rounded-[24px] shadow-[0_10px_20px_rgba(255,0,0,0.2)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
                    >
                      {sendInviteMutation.isPending ? 'Sending...' : 'Send Invite'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </BrowserProtection>
  )
}
