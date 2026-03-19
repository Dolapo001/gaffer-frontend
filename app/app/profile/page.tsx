'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/store/authStore'
import { getProfile, updateProfile, type UserProfile } from '@/lib/services/user.service'
import { updateProfileSchema, type UpdateProfileFormData } from '@/lib/schemas'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'
import { User, Mail, Phone, AtSign, Shield, ChevronLeft, Edit2, Check, X } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const { user, role, logout, setProfile } = useAuthStore()
  const toast = useToastStore()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    values: {
      fullName: profile?.fullName ?? '',
      username: profile?.username ?? '',
      phone: profile?.phone ?? '',
      avatarUrl: profile?.avatarUrl ?? '',
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data)
      setProfile(data)
      toast.addToast({ type: 'success', message: 'Profile updated successfully' })
      setEditing(false)
    },
    onError: (err) => {
      toast.addToast({ type: 'error', message: getErrorMessage(err) })
    },
  })

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => router.replace('/auth/login'),
  })

  const displayName =
    profile?.fullName || profile?.username || user?.email?.split('@')[0] || 'Gaffer'
  const email = user?.email || profile?.email || 'Not provided'

  const onSubmit = (data: UpdateProfileFormData) => {
    // Only send changed fields
    const payload: UpdateProfileFormData = {}
    if (data.fullName !== (profile?.fullName ?? '')) payload.fullName = data.fullName
    if (data.username !== (profile?.username ?? '')) payload.username = data.username
    if (data.phone !== (profile?.phone ?? '')) payload.phone = data.phone
    if (data.avatarUrl !== (profile?.avatarUrl ?? '')) payload.avatarUrl = data.avatarUrl
    updateMutation.mutate(payload)
  }

  const cancelEdit = () => {
    reset()
    setEditing(false)
  }

  return (
    <div className="min-h-screen bg-gaffer-bg">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gaffer-card border border-gaffer-border text-white"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="font-display font-bold text-white text-base flex-1">Profile</h1>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gaffer-card border border-gaffer-border text-gaffer-orange"
          >
            <Edit2 size={16} />
          </button>
        )}
      </div>

      {/* Avatar */}
      <div className="px-6 pb-6 text-center">
        {profile?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatarUrl}
            alt="Avatar"
            className="w-20 h-20 rounded-full mx-auto mb-3 object-cover border-2 border-gaffer-orange/40"
          />
        ) : (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 rounded-full bg-orange-gradient-btn flex items-center justify-center text-white font-display font-black text-3xl mx-auto mb-3 shadow-orange-glow"
          >
            {displayName[0].toUpperCase()}
          </motion.div>
        )}
        {!editing && (
          <>
            <h2 className="font-display font-bold text-xl text-white">{displayName}</h2>
            <p className="text-gaffer-muted text-sm font-body mt-1">{email}</p>
            <span className="inline-flex mt-2 text-xs bg-gaffer-orange/10 text-gaffer-orange border border-gaffer-orange/20 px-3 py-1 rounded-full font-body">
              {role === 'organization' ? 'Organization Account' : 'Personal Account'}
            </span>
          </>
        )}
      </div>

      {/* Edit Form */}
      {editing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 space-y-4">
          {[
            { key: 'fullName' as const, label: 'Full Name', placeholder: 'Your full name' },
            { key: 'username' as const, label: 'Username', placeholder: 'your_username' },
            { key: 'phone' as const, label: 'Phone', placeholder: '+1 234 567 8900' },
            { key: 'avatarUrl' as const, label: 'Avatar URL', placeholder: 'https://...' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-gaffer-muted text-xs font-body mb-1">{label}</label>
              <input
                {...register(key)}
                placeholder={placeholder}
                className="w-full bg-gaffer-card border border-gaffer-border rounded-xl px-4 py-3 text-white text-sm font-body placeholder:text-gaffer-subtle focus:outline-none focus:border-gaffer-orange/50"
              />
              {errors[key] && (
                <p className="text-red-400 text-xs mt-1">{errors[key]?.message}</p>
              )}
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={cancelEdit}
              className="flex-1 py-3 rounded-xl border border-gaffer-border text-gaffer-muted font-body text-sm flex items-center justify-center gap-2"
            >
              <X size={15} /> Cancel
            </button>
            <button
              type="submit"
              disabled={!isDirty || updateMutation.isPending}
              className="flex-1 py-3 rounded-xl bg-orange-gradient-btn text-white font-display font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check size={15} />
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      ) : (
        <div className="px-6 space-y-3">
          {isLoading ? (
            [0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gaffer-card border border-gaffer-border rounded-xl animate-pulse" />
            ))
          ) : (
            [
              { icon: User, label: 'Full Name', value: profile?.fullName },
              { icon: AtSign, label: 'Username', value: profile?.username },
              { icon: Mail, label: 'Email', value: email },
              { icon: Phone, label: 'Phone', value: profile?.phone },
              { icon: Shield, label: 'Account Type', value: role === 'organization' ? 'Organization' : 'Personal' },
            ].map(({ icon: Icon, label, value }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 bg-gaffer-card border border-gaffer-border rounded-xl p-4"
              >
                <div className="w-10 h-10 rounded-xl bg-gaffer-surface flex items-center justify-center">
                  <Icon size={18} className="text-gaffer-orange" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-gaffer-muted text-xs">{label}</p>
                  <p className="font-body text-white text-sm font-medium truncate mt-0.5">
                    {value || <span className="text-gaffer-subtle">Not set</span>}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Logout */}
      {!editing && (
        <div className="px-6 pt-8 pb-12">
          <button
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 font-body text-sm hover:bg-red-500/10 transition-all disabled:opacity-50"
          >
            {logoutMutation.isPending ? 'Logging out...' : 'Log Out'}
          </button>
        </div>
      )}
    </div>
  )
}
