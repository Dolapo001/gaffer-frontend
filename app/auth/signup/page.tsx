'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { signUpSchema, type SignUpFormData } from '@/lib/schemas'
import { AuthInput } from '@/components/AuthInput'
import { SelectInput } from '@/components/SelectInput'
import { GradientButton } from '@/components/GradientButton'
import { ChevronLeft } from 'lucide-react'

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
]

export default function SignUpPage() {
  const router = useRouter()
  const { register: registerUser, registerWithGoogle, isLoading, error, clearError, role } =
    useAuthStore()

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
      gender: '',
    },
  })

  const onSubmit = async (data: SignUpFormData) => {
    try {
      await registerUser(data.email, data.password)
      router.replace(role === 'organization' ? '/admin' : '/app/dashboard')
    } catch {
      // Error displayed from store
    }
  }

  const handleGoogleSignUp = async () => {
    try {
      await registerWithGoogle()
      router.replace(role === 'organization' ? '/admin' : '/app/dashboard')
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
            Enter your email address and password to use the application
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
            placeholder="Charlie Westervelt"
            autoComplete="email"
            error={errors.email}
            {...register('email')}
          />

          <AuthInput
            label="Password"
            showPasswordToggle
            placeholder="••••••••••••"
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

          <SelectInput
            label="Gender"
            options={genderOptions}
            placeholder="Select gender"
            error={errors.gender}
            {...register('gender')}
          />

          <div className="pt-2">
            <GradientButton type="submit" loading={isLoading}>
              Get Started
            </GradientButton>
          </div>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gaffer-border" />
          <span className="text-gaffer-subtle text-xs font-body">Or</span>
          <div className="flex-1 h-px bg-gaffer-border" />
        </div>

        {/* Google sign-up */}
        <GradientButton variant="google" onClick={handleGoogleSignUp} loading={isLoading}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign Up with Google
        </GradientButton>

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
