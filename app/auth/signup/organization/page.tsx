'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { createOrg } from '@/lib/services/org.service'
import { signUpSchema, createOrgSchema, type SignUpFormData, type CreateOrgFormData } from '@/lib/schemas'
import { AuthInput } from '@/components/AuthInput'
import { GradientButton } from '@/components/GradientButton'
import { ChevronLeft } from 'lucide-react'
import { getErrorMessage } from '@/lib/api'

export default function OrganizationSignupPage() {
  const router = useRouter()
  const { register: registerUser, isLoading: authLoading, error, clearError, setRole } = useAuthStore()
  const [step, setStep] = useState<1 | 2>(1)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [isCreatingOrg, setIsCreatingOrg] = useState(false)
  const [orgError, setOrgError] = useState<string | null>(null)

  useEffect(() => {
    return () => clearError()
  }, [clearError])

  // Step 1: user credentials
  const authForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '', confirmPassword: '' },
  })

  // Step 2: org details
  const orgForm = useForm<Pick<CreateOrgFormData, 'name' | 'handle' | 'description'>>(
    {
      mode: 'onTouched',
      defaultValues: { name: '', handle: '', description: '' },
    }
  )

  const handleStep1 = async (data: SignUpFormData) => {
    try {
      await registerUser(data.email, data.password)
      setRegisteredEmail(data.email)
      setStep(2)
    } catch {
      // Error displayed from store
    }
  }

  const handleStep2 = async (data: Pick<CreateOrgFormData, 'name' | 'handle' | 'description'>) => {
    setIsCreatingOrg(true)
    setOrgError(null)
    try {
      await createOrg({
        name: data.name,
        handle: data.handle,
        description: data.description,
      })
      setRole('organization')
      router.replace('/admin')
    } catch (err) {
      setOrgError(getErrorMessage(err))
    } finally {
      setIsCreatingOrg(false)
    }
  }

  const isLoading = authLoading || isCreatingOrg

  return (
    <div className="min-h-screen bg-gaffer-bg flex flex-col overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-12 pb-4 flex-shrink-0 z-10">
        <button
          onClick={() => (step === 1 ? router.back() : setStep(1))}
          aria-label="Go back"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-gaffer-card border border-gaffer-border text-white transition-transform active:scale-95"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-xs text-gaffer-muted font-body tracking-wide">
          {step === 1 ? 'Create Account' : 'Organization Details'}
        </span>
        <span className="ml-auto text-xs text-gaffer-subtle font-body">{step}/2</span>
      </div>

      <div className="flex-1 flex flex-col px-6 pb-10">
        {/* Title */}
        <div className="mb-8 mt-2">
          <h1 className="font-display font-bold text-3xl text-white leading-tight">Welcome to</h1>
          <h1 className="font-display font-bold text-3xl text-gradient-orange leading-tight uppercase">
            GAFFER
          </h1>
          <p className="font-body text-gaffer-muted text-sm mt-2">
            {step === 1 ? "Let's create your account" : "Tell us about your organization"}
          </p>
        </div>

        {/* Auth error (step 1) */}
        {error && step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-body"
          >
            {error}
          </motion.div>
        )}

        {/* Org error (step 2) */}
        {orgError && step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-body"
          >
            {orgError}
          </motion.div>
        )}

        {step === 1 ? (
          <form onSubmit={authForm.handleSubmit(handleStep1)} className="space-y-4" noValidate>
            <AuthInput
              label="Email"
              type="email"
              placeholder="you@organization.com"
              autoComplete="email"
              error={authForm.formState.errors.email}
              {...authForm.register('email')}
            />
            <AuthInput
              label="Password"
              showPasswordToggle
              placeholder="Min 8 characters"
              autoComplete="new-password"
              error={authForm.formState.errors.password}
              {...authForm.register('password')}
            />
            <AuthInput
              label="Confirm Password"
              showPasswordToggle
              placeholder="••••••••••••"
              autoComplete="new-password"
              error={authForm.formState.errors.confirmPassword}
              {...authForm.register('confirmPassword')}
            />
            <div className="pt-2">
              <GradientButton type="submit" loading={authLoading}>
                Next
              </GradientButton>
            </div>
          </form>
        ) : (
          <form onSubmit={orgForm.handleSubmit(handleStep2)} className="space-y-4" noValidate>
            <div>
              <label className="block text-gaffer-muted text-xs font-body mb-1">Organization Name *</label>
              <input
                {...orgForm.register('name', { required: 'Name is required', maxLength: { value: 100, message: 'Max 100 characters' } })}
                placeholder="Westervelt Athletic Club"
                className="w-full bg-gaffer-card border border-gaffer-border rounded-xl px-4 py-3 text-white text-sm font-body placeholder:text-gaffer-subtle focus:outline-none focus:border-gaffer-orange/50"
              />
              {orgForm.formState.errors.name && (
                <p className="text-red-400 text-xs mt-1">{orgForm.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-gaffer-muted text-xs font-body mb-1">
                Handle * <span className="text-gaffer-subtle">(lowercase, letters/numbers/underscores)</span>
              </label>
              <input
                {...orgForm.register('handle', {
                  required: 'Handle is required',
                  minLength: { value: 3, message: 'Min 3 characters' },
                  maxLength: { value: 30, message: 'Max 30 characters' },
                  pattern: { value: /^[a-z0-9_]+$/, message: 'Only lowercase letters, numbers, underscores' },
                })}
                placeholder="westervelt_ac"
                className="w-full bg-gaffer-card border border-gaffer-border rounded-xl px-4 py-3 text-white text-sm font-body placeholder:text-gaffer-subtle focus:outline-none focus:border-gaffer-orange/50"
              />
              {orgForm.formState.errors.handle && (
                <p className="text-red-400 text-xs mt-1">{orgForm.formState.errors.handle.message}</p>
              )}
            </div>

            <div>
              <label className="block text-gaffer-muted text-xs font-body mb-1">Description</label>
              <textarea
                {...orgForm.register('description', { maxLength: { value: 500, message: 'Max 500 characters' } })}
                placeholder="Tell us about your organization..."
                rows={3}
                className="w-full bg-gaffer-card border border-gaffer-border rounded-xl px-4 py-3 text-white text-sm font-body placeholder:text-gaffer-subtle focus:outline-none focus:border-gaffer-orange/50 resize-none"
              />
              {orgForm.formState.errors.description && (
                <p className="text-red-400 text-xs mt-1">{orgForm.formState.errors.description.message}</p>
              )}
            </div>

            <div className="pt-2">
              <GradientButton type="submit" loading={isCreatingOrg}>
                Create Organization
              </GradientButton>
            </div>
          </form>
        )}

        {step === 1 && (
          <p className="text-center text-gaffer-muted text-xs font-body mt-6">
            Already have an account?{' '}
            <button
              onClick={() => router.push('/auth/login')}
              className="text-gaffer-orange font-medium hover:underline"
            >
              Sign In
            </button>
          </p>
        )}
      </div>

      {/* Progress dots */}
      <div className="pb-8 flex justify-center gap-2">
        <div className={`h-2 rounded-full transition-all duration-300 ${step === 1 ? 'w-6 bg-gaffer-orange' : 'w-2 bg-gaffer-border'}`} />
        <div className={`h-2 rounded-full transition-all duration-300 ${step === 2 ? 'w-6 bg-gaffer-orange' : 'w-2 bg-gaffer-border'}`} />
      </div>
    </div>
  )
}
