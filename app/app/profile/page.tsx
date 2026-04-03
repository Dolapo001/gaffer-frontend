'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/store/authStore'
import { getProfile, updateProfile, uploadAvatar, type UserProfile } from '@/lib/services/user.service'
import { updateProfileSchema, type UpdateProfileFormData } from '@/lib/schemas'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'
import { User, Mail, Phone, AtSign, Shield, ChevronLeft, Edit2, Check, X, Camera, Trophy, ChevronRight } from 'lucide-react'
import { listJoinedCompetitions } from '@/lib/services/competition.service'

export default function ProfilePage() {
  const router = useRouter()
  const { user, role, logout, setProfile } = useAuthStore()
  const toast = useToastStore()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  const { data: competitions, isLoading: loadingLeagues } = useQuery({
    queryKey: ['joined-competitions'],
    queryFn: listJoinedCompetitions,
    enabled: role === 'personal',
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
    },
  })

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: (res) => {
      const updatedProfile = { ...profile, avatarUrl: res.data.imageUrl } as UserProfile
      queryClient.setQueryData(['profile'], updatedProfile)
      setProfile(updatedProfile)
    },
    onError: (err) => {
      toast.addToast({ type: 'error', message: getErrorMessage(err) })
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data)
      setProfile(data)
      toast.addToast({ type: 'success', message: 'Profile updated successfully' })
      setEditing(false)
      setAvatarPreview(null)
      setSelectedAvatarFile(null)
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

  const onSubmit = async (data: UpdateProfileFormData) => {
    // Upload avatar first if a file was selected
    if (selectedAvatarFile) {
      await uploadAvatarMutation.mutateAsync(selectedAvatarFile)
    }

    // Only send changed text fields
    const payload: UpdateProfileFormData = {}
    if (data.fullName !== (profile?.fullName ?? '')) payload.fullName = data.fullName
    if (data.username !== (profile?.username ?? '')) payload.username = data.username
    if (data.phone !== (profile?.phone ?? '')) payload.phone = data.phone

    if (Object.keys(payload).length > 0) {
      updateMutation.mutate(payload)
    } else if (!selectedAvatarFile) {
      // nothing changed
      setEditing(false)
    } else {
      // avatar-only update already done
      toast.addToast({ type: 'success', message: 'Avatar updated successfully' })
      setEditing(false)
    }
  }

  const cancelEdit = () => {
    reset()
    setEditing(false)
    setAvatarPreview(null)
    setSelectedAvatarFile(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedAvatarFile(file)
    const reader = new FileReader()
    reader.onload = () => setAvatarPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const currentAvatarUrl = avatarPreview ?? profile?.avatarUrl
  const isSaving = updateMutation.isPending || uploadAvatarMutation.isPending
  const hasChanges = isDirty || !!selectedAvatarFile

  return (
    <div className="min-h-screen bg-[#14151F] pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 md:px-6 pt-12 pb-4">
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
      <div className="px-4 md:px-6 pb-6 text-center">
        <div className="relative inline-block">
          {currentAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentAvatarUrl}
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
          {editing && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-3 right-0 w-7 h-7 rounded-full bg-gaffer-orange flex items-center justify-center shadow-lg"
              >
                <Camera size={13} className="text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </>
          )}
        </div>
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
        <form onSubmit={handleSubmit(onSubmit)} className="px-4 md:px-6 space-y-4">
          {[
            { key: 'fullName' as const, label: 'Full Name', placeholder: 'Your full name' },
            { key: 'username' as const, label: 'Username', placeholder: 'your_username' },
            { key: 'phone' as const, label: 'Phone', placeholder: '+1 234 567 8900' },
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
              disabled={!hasChanges || isSaving}
              className="flex-1 py-3 rounded-xl bg-orange-gradient-btn text-white font-display font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving && <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />}
              <Check size={15} className={isSaving ? "hidden" : "block"} />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      ) : (
        <div className="px-4 md:px-6 space-y-3">
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

      {/* My Leagues Section (New) */}
      {!editing && role === 'personal' && (
        <div className="px-4 md:px-6 pt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-white text-base">My Leagues</h3>
            <button 
              onClick={() => router.push('/app/league')}
              className="text-gaffer-orange text-xs font-bold font-body"
            >
              BROWSE ALL
            </button>
          </div>

          {loadingLeagues ? (
            <div className="h-20 bg-gaffer-card border border-gaffer-border rounded-xl animate-pulse" />
          ) : competitions && competitions.length > 0 ? (
            <div className="space-y-3">
              {competitions.slice(0, 3).map((comp) => (
                <motion.button
                  key={comp._id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(`/app/league/${comp._id}`)}
                  className="w-full flex items-center gap-4 bg-gaffer-card border border-gaffer-border rounded-xl p-4 text-left hover:border-gaffer-orange/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-gaffer-orange/10 flex items-center justify-center flex-shrink-0">
                    {comp.bannerUrl ? (
                      <img src={comp.bannerUrl} alt={comp.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <Trophy size={18} className="text-gaffer-orange" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-white text-sm font-bold truncate uppercase tracking-wide">
                      {comp.name}
                    </p>
                    <p className="text-gaffer-muted text-[10px] font-body uppercase tracking-wider mt-0.5">
                      {comp.sport} · {comp.status}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gaffer-subtle" />
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="bg-gaffer-card border border-gaffer-border rounded-xl p-6 text-center">
              <p className="text-gaffer-muted text-xs font-body mb-3">You haven&apos;t joined any leagues yet.</p>
              <button
                onClick={() => router.push('/app/league')}
                className="text-gaffer-orange text-xs font-bold font-body border border-gaffer-orange/30 px-4 py-2 rounded-full"
              >
                Join a League
              </button>
            </div>
          )}
        </div>
      )}

      {/* Logout */}
      {!editing && (
        <div className="px-4 md:px-6 pt-8 pb-12">
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
