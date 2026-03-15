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

export default function LoginPage() {
  const router = useRouter()
  const { login, loginWithGoogle, isLoading, error, clearError } = useAuthStore()

  useEffect(() => {
    return () => clearError()
  }, [clearError])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  })

  const getPostLoginRoute = () => {
    // Read role from store at the moment of redirect
    const role = useAuthStore.getState().role
    return role === 'organization' ? '/admin' : '/app/dashboard'
  }

  const onSubmit = async (data: SignInFormData) => {
    try {
      await login(data.email, data.password)
      router.replace(getPostLoginRoute())
    } catch {
      // Error handled in store
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle()
      router.replace(getPostLoginRoute())
    } catch {
      // Error handled in store
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
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
            Enter your email address and password to use the application
          </p>
        </div>

        {/* Firebase error */}
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
            label="Username/Email"
            type="text"
            placeholder="Charlie Westervelt"
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

          {/* Remember Me + Forgot Password */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('rememberMe')}
                className="w-4 h-4 rounded border-gaffer-border bg-gaffer-card accent-gaffer-orange cursor-pointer"
              />
              <span className="text-sm text-white/70 font-body">Remember Me</span>
            </label>
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

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gaffer-border" />
          <span className="text-gaffer-subtle text-xs font-body">Or Login With</span>
          <div className="flex-1 h-px bg-gaffer-border" />
        </div>

        {/* Google login */}
        <GradientButton variant="google" onClick={handleGoogleLogin} loading={isLoading}>
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
          Login with Google
        </GradientButton>

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
