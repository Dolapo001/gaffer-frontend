'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { signInSchema, type SignInFormData } from '@/lib/schemas'
import { AuthInput } from '@/components/AuthInput'
import { GradientButton } from '@/components/GradientButton'
import { ChevronLeft } from 'lucide-react'
import { getErrorMessage } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading, error, clearError, role } = useAuthStore()

  useEffect(() => {
    return () => clearError()
  }, [clearError])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const getPostLoginRoute = () => {
    const currentRole = useAuthStore.getState().role
    return currentRole === 'organization' ? '/admin' : '/app/dashboard'
  }

  const onSubmit = async (data: SignInFormData) => {
    try {
      await login(data.email, data.password)
      router.replace(getPostLoginRoute())
    } catch {
      // Error is displayed from store
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
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex-1 flex flex-col px-6 pb-10"
      >
        {/* Title */}
        <div className="mb-6 mt-2">
          <h1 className="font-display font-bold text-3xl text-white leading-tight">
            Welcome Back,
          </h1>
          <h1 className="font-display font-bold text-3xl text-gradient-orange leading-tight">
            GAFFER
          </h1>
          <p className="font-body text-gaffer-muted text-sm mt-2">
            Enter your email address and password to continue
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
            placeholder="••••••••••••"
            autoComplete="current-password"
            error={errors.password}
            {...register('password')}
          />

          {/* Forgot Password */}
          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              onClick={() => router.push('/auth/forgot-password')}
              className="text-sm text-gaffer-orange font-body font-medium hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          <div className="pt-2">
            <GradientButton type="submit" loading={isLoading}>
              Login
            </GradientButton>
          </div>
        </form>

        {/* Sign up link */}
        <p className="text-center text-gaffer-muted text-xs font-body mt-6">
          Don&apos;t have an account?{' '}
          <button
            onClick={() => router.push('/onboarding/role-select')}
            className="text-gaffer-orange font-medium hover:underline"
          >
            Sign Up
          </button>
        </p>
      </motion.div>
    </div>
  )
}
