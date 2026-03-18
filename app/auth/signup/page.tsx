'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { signUpSchema, type SignUpFormData } from '@/lib/schemas'
import { AuthInput } from '@/components/AuthInput'
import { GradientButton } from '@/components/GradientButton'
import { ChevronLeft } from 'lucide-react'

export default function SignUpPage() {
  const router = useRouter()
  const { register: registerUser, isLoading, error, clearError, setRole } = useAuthStore()

  useEffect(() => {
    return () => clearError()
  }, [clearError])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: SignUpFormData) => {
    try {
      await registerUser(data.email, data.password)
      setRole('personal')
      router.replace('/app/dashboard')
    } catch {
      // Error displayed from store
    }
  }

  return (
    <div className="min-h-screen bg-gaffer-bg flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-12 pb-4 flex-shrink-0">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-gaffer-card border border-gaffer-border text-white"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-xs text-gaffer-muted font-body tracking-wide">New Account</span>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 flex flex-col px-6 pb-10"
      >
        {/* Title */}
        <div className="mb-6 mt-2">
          <h1 className="font-display font-bold text-3xl text-white leading-tight">Welcome to</h1>
          <h1 className="font-display font-bold text-3xl text-gradient-orange leading-tight">
            GAFFER
          </h1>
          <p className="font-body text-gaffer-muted text-sm mt-2">
            Create your account to get started
          </p>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-body"
          >
            {error}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <AuthInput
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email}
            {...register('email')}
          />

          <AuthInput
            label="Password"
            showPasswordToggle
            placeholder="Min 8 characters"
            autoComplete="new-password"
            error={errors.password}
            {...register('password')}
          />

          <AuthInput
            label="Confirm Password"
            showPasswordToggle
            placeholder="••••••••••••"
            autoComplete="new-password"
            error={errors.confirmPassword}
            {...register('confirmPassword')}
          />

          <div className="pt-2">
            <GradientButton type="submit" loading={isLoading}>
              Get Started
            </GradientButton>
          </div>
        </form>

        {/* Sign in link */}
        <p className="text-center text-gaffer-muted text-xs font-body mt-6">
          Already have an account?{' '}
          <button
            onClick={() => router.push('/auth/login')}
            className="text-gaffer-orange font-medium hover:underline"
          >
            Sign In
          </button>
        </p>
      </motion.div>
    </div>
  )
}
