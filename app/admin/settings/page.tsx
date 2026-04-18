'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useGoBack } from '@/hooks/useGoBack'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Camera, Building2, Check, Pencil, X } from 'lucide-react'
import { listOrgs, updateOrgLogo, updateOrg, type Org } from '@/lib/services/org.service'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'

export default function AdminSettingsPage() {
  const router = useRouter()
  const goBack = useGoBack('/admin')
  const { user } = useAuthStore()
  const toast = useToastStore()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', description: '', email: '', website: '', sportsText: '' })

  const { data: orgs, isLoading } = useQuery<Org[]>({
    queryKey: ['orgs'],
    queryFn: listOrgs,
    enabled: !!user,
  })

  const org = orgs?.[0]

  const uploadMutation = useMutation({
    mutationFn: ({ orgId, file }: { orgId: string; file: File }) => updateOrgLogo(orgId, file),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['orgs'] })
      toast.addToast({ type: 'success', message: 'Logo updated successfully' })
      setLogoPreview(null)
      setSelectedFile(null)
      // Update displayed logo from returned imageUrl
      if (res.data?.imageUrl) {
        setLogoPreview(res.data.imageUrl)
      }
    },
    onError: (err) => {
      toast.addToast({ type: 'error', message: getErrorMessage(err) })
    },
  })

  const updateOrgMutation = useMutation({
    mutationFn: ({ orgId, payload }: { orgId: string; payload: Parameters<typeof updateOrg>[1] }) =>
      updateOrg(orgId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgs'] })
      toast.addToast({ type: 'success', message: 'Organisation updated' })
      setIsEditing(false)
    },
    onError: (err) => {
      toast.addToast({ type: 'error', message: getErrorMessage(err) })
    },
  })

  const handleEditOpen = () => {
    if (!org) return
    setEditForm({
      name: org.name ?? '',
      description: org.description ?? '',
      email: org.email ?? '',
      website: org.website ?? '',
      sportsText: org.sports?.join(', ') ?? '',
    })
    setIsEditing(true)
  }

  const handleEditSave = () => {
    if (!org) return
    const sports = editForm.sportsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    updateOrgMutation.mutate({
      orgId: org._id,
      payload: {
        name: editForm.name || undefined,
        description: editForm.description || undefined,
        email: editForm.email || undefined,
        website: editForm.website || undefined,
        sports: sports.length ? sports : undefined,
      },
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleUpload = () => {
    if (!org || !selectedFile) return
    uploadMutation.mutate({ orgId: org._id, file: selectedFile })
  }

  const currentLogoUrl = logoPreview ?? org?.logoUrl

  return (
    <div className="min-h-screen bg-gaffer-bg">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-gaffer-border">
        <button
          onClick={goBack}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gaffer-card border border-gaffer-border text-white"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="font-display font-bold text-white text-base flex-1">Organisation Settings</h1>
      </div>

      {isLoading ? (
        <div className="px-4 pt-6 space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 bg-gaffer-card border border-gaffer-border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : org ? (
        <div className="px-4 pt-6 space-y-5 pb-20">
          {/* Logo Upload */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gaffer-card border border-gaffer-border rounded-2xl p-5"
          >
            <p className="text-gaffer-muted text-xs font-body uppercase tracking-widest mb-4">Organisation Logo</p>
            <div className="flex items-center gap-5">
              <div className="relative flex-shrink-0">
                {currentLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentLogoUrl}
                    alt={org.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-gaffer-border"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gaffer-surface border-2 border-gaffer-border flex items-center justify-center">
                    <Building2 size={28} className="text-gaffer-subtle" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gaffer-orange flex items-center justify-center shadow-lg"
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
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-body font-medium text-sm truncate">{org.name}</p>
                <p className="text-gaffer-muted text-xs font-body mt-0.5">@{org.handle}</p>
                {selectedFile && (
                  <p className="text-gaffer-orange text-xs font-body mt-1 truncate">{selectedFile.name}</p>
                )}
              </div>
            </div>

            {selectedFile && (
              <button
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
                className="mt-4 w-full py-3 rounded-xl bg-orange-gradient-btn text-white font-display font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {uploadMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Check size={15} />
                    Upload Logo
                  </>
                )}
              </button>
            )}
          </motion.div>

          {/* Org Details */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-gaffer-card border border-gaffer-border rounded-2xl p-5 space-y-3"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-gaffer-muted text-xs font-body uppercase tracking-widest">Details</p>
              {!isEditing ? (
                <button
                  onClick={handleEditOpen}
                  className="flex items-center gap-1.5 text-gaffer-orange text-xs font-body font-medium"
                >
                  <Pencil size={12} />
                  Edit
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-1.5 text-gaffer-muted text-xs font-body font-medium"
                >
                  <X size={12} />
                  Cancel
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-3">
                {[
                  { label: 'Name', key: 'name' as const, placeholder: 'Organisation name' },
                  { label: 'Description', key: 'description' as const, placeholder: 'Short description' },
                  { label: 'Email', key: 'email' as const, placeholder: 'contact@org.com' },
                  { label: 'Website', key: 'website' as const, placeholder: 'https://...' },
                  { label: 'Sports', key: 'sportsText' as const, placeholder: 'Football, Basketball' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="text-gaffer-muted text-xs font-body block mb-1">{label}</label>
                    <input
                      value={editForm[key]}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full bg-gaffer-surface border border-gaffer-border rounded-xl px-3 py-2.5 text-white text-sm font-body outline-none focus:border-gaffer-orange transition-colors"
                    />
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1 text-gaffer-muted text-xs font-body">
                  <span>Handle</span>
                  <span className="text-white/50">@{org.handle} (unchangeable)</span>
                </div>
                <button
                  onClick={handleEditSave}
                  disabled={updateOrgMutation.isPending}
                  className="mt-2 w-full py-3 rounded-xl bg-orange-gradient-btn text-white font-display font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {updateOrgMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            ) : (
              <>
                {[
                  { label: 'Name', value: org.name },
                  { label: 'Handle', value: `@${org.handle}` },
                  { label: 'Sports', value: org.sports?.join(', ') || '—' },
                  { label: 'Status', value: org.lifecycleStatus },
                  { label: 'Verified', value: org.verificationStatus },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-gaffer-muted text-sm font-body">{label}</span>
                    <span className="text-white text-sm font-body font-medium capitalize">{value || '—'}</span>
                  </div>
                ))}
              </>
            )}
          </motion.div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 gap-3 px-8">
          <Building2 size={40} className="text-gaffer-subtle" />
          <p className="text-white font-display font-bold text-base text-center">No organisation found</p>
          <p className="text-gaffer-muted text-sm font-body text-center">Create an organisation to manage settings here.</p>
        </div>
      )}
    </div>
  )
}
