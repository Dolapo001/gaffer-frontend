'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { ChevronLeft, Trophy } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { createOrg } from '@/lib/services/org.service'
import { getErrorMessage } from '@/lib/api'
import { organizationSignUpSchema, type OrganizationSignUpFormData } from '@/lib/schemas'
import { AuthInput } from '@/components/AuthInput'
import { AuthSelect } from '@/components/AuthSelect'
import { GradientButton } from '@/components/GradientButton'

/**
 * Isolated org-creation page — mounted under /onboarding/ layout which
 * renders NO bottom navbar, NO sidebar, NO personal shell. This is
 * intentional: when a personal user tries to switch to an organization
 * account they don't yet have, we route here instead of opening a modal
 * overlay on top of the personal layout (which causes z-index conflicts
 * with the sidebar at z-[110] and the BottomNavbar at z-[100]).
 */
export default function OrganizationSetupPage() {
  const router = useRouter()
  const { user, updateUser, setRole, isAuthenticated, isLoading } = useAuthStore()
  const toast = useToastStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<OrganizationSignUpFormData>({
    resolver: zodResolver(organizationSignUpSchema),
    defaultValues: { email: user?.email ?? '', sports: [] },
  })

  // Guard: if auth resolves and user is not logged in, send to login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login')
    }
  }, [isLoading, isAuthenticated, router])

  // Guard: if user already has an active org, skip setup and go straight to admin
  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.isOrgActive) {
      setRole('organization')
      router.replace('/admin')
    }
  }, [isLoading, isAuthenticated, user?.isOrgActive, router, setRole])

  const onSubmit = async (data: OrganizationSignUpFormData) => {
    if (!user) return
    setIsSubmitting(true)
    try {
      await createOrg({
        name: data.orgName,
        handle: data.handle,
        sports: data.sports,
        description: data.description,
        ownerId: user.id,
      })
      updateUser({ isOrgActive: true, lastRole: 'organization' })
      setRole('organization')
      toast.addToast('Organization created successfully!', 'success')
      router.replace('/admin')
    } catch (err) {
      toast.addToast(getErrorMessage(err), 'error')
      setIsSubmitting(false)
    }
  }

  // Show spinner while auth is resolving
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#181928] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/10 border-t-orange-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#181928] flex flex-col px-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-10">
      {/* Back */}
      <button
        onClick={() => router.replace('/app/dashboard')}
        className="self-start flex items-center gap-1 text-white/50 hover:text-white mb-8 transition-colors active:scale-95"
      >
        <ChevronLeft size={20} />
        <span className="text-sm font-chakra">Back</span>
      </button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center mb-10"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF8904] to-[#E7000B] flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
          <Trophy size={32} className="text-white" />
        </div>
        <h1 className="font-chakra font-black text-2xl text-white uppercase tracking-tight">
          Start Your Organization
        </h1>
        <p className="text-white/50 text-sm font-chakra mt-2 max-w-xs leading-relaxed">
          Tell us about your organization to start managing tournaments and leagues.
        </p>
      </motion.div>

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 w-full max-w-sm mx-auto"
      >
        <AuthInput
          label="Organization Name"
          placeholder="e.g. Premier League"
          error={form.formState.errors.orgName}
          {...form.register('orgName')}
        />
        <AuthInput
          label="Handle"
          prefix="@"
          placeholder="unique_handle"
          error={form.formState.errors.handle}
          {...form.register('handle')}
        />
        <AuthSelect
          label="Sport"
          placeholder="Select Sport"
          options={[
            { value: 'football', label: 'Football' },
            { value: 'basketball', label: 'Basketball' },
            { value: 'tennis', label: 'Tennis' },
          ]}
          error={form.formState.errors.sports as any}
          {...form.register('sports', { setValueAs: (v) => (v ? [v] : []) })}
        />

        <div className="pt-6">
          <GradientButton
            type="submit"
            loading={isSubmitting}
            className="w-full py-4 rounded-xl text-lg uppercase font-black font-chakra"
          >
            Create Organization
          </GradientButton>
        </div>
      </motion.form>
    </div>
  )
}
