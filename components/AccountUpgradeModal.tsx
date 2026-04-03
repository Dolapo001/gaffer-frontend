'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { createOrg } from '@/lib/services/org.service'
import { updateProfile } from '@/lib/services/user.service'
import { organizationSignUpSchema, OrganizationSignUpFormData, updateProfileSchema, UpdateProfileFormData } from '@/lib/schemas'
import { AuthInput } from '@/components/AuthInput'
import { AuthSelect } from '@/components/AuthSelect'
import { GradientButton } from '@/components/GradientButton'
import { X, Trophy, User as UserIcon } from 'lucide-react'
import { useToast } from '@/store/toastStore'

interface AccountUpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  targetRole: 'personal' | 'organization'
}

export function AccountUpgradeModal({ isOpen, onClose, targetRole }: AccountUpgradeModalProps) {
  const router = useRouter()
  const { user, updateUser, setRole } = useAuthStore()
  const { addToast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form for Organization Creation
  const orgForm = useForm<OrganizationSignUpFormData>({
    resolver: zodResolver(organizationSignUpSchema),
    defaultValues: {
      email: user?.email || '',
      sports: [],
    }
  })

  // Form for Personal Profile Completion
  const personalForm = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
  })

  const onOrgSubmit = async (data: OrganizationSignUpFormData) => {
    if (!user) return
    setIsSubmitting(true)
    try {
      await createOrg({
        name: data.orgName,
        handle: data.handle,
        sports: data.sports,
        description: data.description,
        ownerId: user.id
      })
      
      // Update local user state
      updateUser({ isOrgActive: true, lastRole: 'organization' })
      setRole('organization')
      
      addToast('Organization created successfully!', 'success')
      onClose()
      router.push('/admin')
    } catch (err: any) {
      addToast(err.message || 'Failed to create organization', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onPersonalSubmit = async (data: UpdateProfileFormData) => {
    setIsSubmitting(true)
    try {
      await updateProfile({
        ...data,
        isPersonalActive: true,
        lastRole: 'personal'
      })
      
      updateUser({ isPersonalActive: true, lastRole: 'personal', fullName: data.fullName })
      setRole('personal')
      
      addToast('Personal profile set up!', 'success')
      onClose()
      router.push('/app/dashboard')
    } catch (err: any) {
      addToast(err.message || 'Failed to update profile', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-[#1E2032] rounded-[32px] border border-white/5 p-8 shadow-2xl overflow-hidden"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-white/40 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF8904] to-[#E7000B] flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
            {targetRole === 'organization' ? <Trophy size={32} className="text-white" /> : <UserIcon size={32} className="text-white" />}
          </div>
          <h2 className="text-2xl font-chakra font-black text-white uppercase tracking-tight">
            {targetRole === 'organization' ? 'Start Your Organization' : 'Setup Personal Account'}
          </h2>
          <p className="text-white/60 text-sm font-chakra mt-2 max-w-xs">
            {targetRole === 'organization' 
              ? 'Tell us about your organization to start managing tournaments.' 
              : 'Complete your personal profile to enjoy the full Gaffer experience.'}
          </p>
        </div>

        {targetRole === 'organization' ? (
          <form onSubmit={orgForm.handleSubmit(onOrgSubmit)} className="space-y-4">
            <AuthInput
              label="Organization Name"
              placeholder="e.g. Premier League"
              error={orgForm.formState.errors.orgName}
              {...orgForm.register('orgName')}
            />
            <AuthInput
              label="Handle"
              prefix="@"
              placeholder="unique_handle"
              error={orgForm.formState.errors.handle}
              {...orgForm.register('handle')}
            />
            <AuthSelect
              label="Sport"
              placeholder="Select Sport"
              options={[
                { value: 'football', label: 'Football' },
                { value: 'basketball', label: 'Basketball' },
                { value: 'tennis', label: 'Tennis' },
              ]}
              error={orgForm.formState.errors.sports}
              {...orgForm.register('sports', { 
                setValueAs: (v) => v ? [v] : [] 
              })}
            />
            <div className="pt-4">
              <GradientButton type="submit" loading={isSubmitting} className="w-full py-4 rounded-xl text-lg uppercase font-black">
                Create Organization
              </GradientButton>
            </div>
          </form>
        ) : (
          <form onSubmit={personalForm.handleSubmit(onPersonalSubmit)} className="space-y-4">
            <AuthInput
              label="Full Name"
              placeholder="Charlie Westervelt"
              error={personalForm.formState.errors.fullName}
              {...personalForm.register('fullName')}
            />
            <AuthInput
              label="Username"
              prefix="@"
              placeholder="charlie_w"
              error={personalForm.formState.errors.username}
              {...personalForm.register('username')}
            />
            <div className="pt-4">
              <GradientButton type="submit" loading={isSubmitting} className="w-full py-4 rounded-xl text-lg uppercase font-black font-chakra">
                Complete Profile
              </GradientButton>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  )
}
