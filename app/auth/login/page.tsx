'use client'

import { useState, useEffect } from 'react'
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

import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { useGoogleLogin } from '@react-oauth/google'
import { googleAuth } from '@/lib/services/auth.service'
import { useGoBack } from '@/hooks/useGoBack'

export default function LoginPage() {
  const router = useRouter()
  const goBack = useGoBack('/')
  const { login, error, clearError } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    return () => clearError()
  }, [clearError])

  const handleGoogleAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        await googleAuth(tokenResponse.access_token)
        const { role } = useAuthStore.getState()
        router.replace(role === 'organization' ? '/admin' : '/app/dashboard')
      } catch {
        // error handled by store
      }
    },
    onError: () => {},
  })

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

  const onSubmit = async (data: SignInFormData) => {
    setIsSubmitting(true)
    try {
      await login(data.email, data.password)
      const { role } = useAuthStore.getState()
      router.replace(role === 'organization' ? '/admin' : '/app/dashboard')
    } catch {
      // Error is displayed from store
    } finally {
      setIsSubmitting(false)
    }
  }

  // suppress unused variable warning
  void getErrorMessage

  return (
    <div className="relative min-h-screen bg-[#181928] flex flex-col overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/hero-bg.jpg"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#181928]/85 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-12 pb-4 flex-shrink-0">
          <button
            onClick={goBack}
            aria-label="Go back"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1 flex flex-col px-7 pb-10 pt-4"
        >
          {/* Title Section */}
          <div className="mb-10">
            <h1 className="font-chakra font-semibold text-[28px] text-white leading-tight">
              Welcome Back,
            </h1>
            <h1 className="font-chakra font-bold text-[32px] bg-gradient-to-r from-[#FF8904] to-[#E7000B] bg-clip-text text-transparent leading-tight -mt-1 uppercase tracking-wider">
              GAFFER
            </h1>
            <p className="font-chakra text-white/60 text-[14px] mt-4 font-medium sm:max-w-xs">
              Enter your email address and password to use the application
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-100 text-sm font-chakra"
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <AuthInput
              label="Username/Email"
              type="email"
              placeholder="Charlie Westervelt"
              className="bg-white/5 border-white/10 rounded-lg h-14"
              error={errors.email}
              {...register('email')}
            />

            <AuthInput
              label="Password"
              showPasswordToggle
              placeholder="************"
              className="bg-white/5 border-white/10 rounded-lg h-14"
              error={errors.password}
              {...register('password')}
            />

            {/* Remember Me & Forget Password */}
            <div className="flex items-center justify-between pb-2">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div className="relative w-5 h-5 rounded border-2 border-white/20 bg-white/5 flex items-center justify-center group-hover:border-white/40 transition-all">
                  <input type="checkbox" className="peer absolute opacity-0 w-full h-full cursor-pointer z-10" />
                  <div className="w-2.5 h-2.5 bg-orange-gaffer rounded-[2px] opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span className="text-[14px] font-chakra text-white/60 font-medium select-none group-hover:text-white/80 transition-colors">Remember Me</span>
              </label>

              <button
                type="button"
                onClick={() => router.push('/auth/forgot-password')}
                className="text-[14px] font-chakra text-orange-gaffer font-medium hover:brightness-110 transition-all"
              >
                Forget Password?
              </button>
            </div>

            <div className="pt-4 flex flex-col gap-5 text-center">
              <GradientButton
                type="submit"
                loading={isSubmitting}
                className="h-16 rounded-lg font-chakra font-bold text-lg bg-gradient-to-r from-[#FF8904] to-[#E7000B] border-none shadow-none"
              >
                Login
              </GradientButton>

              <div className="text-white/40 font-chakra text-sm font-medium">Or Login With</div>

              <GradientButton
                variant="google"
                onClick={() => handleGoogleAuth()}
                className="h-16 rounded-lg bg-white/5 border-white/10 hover:bg-white/10 font-chakra font-semibold text-[15px]"
              >
                <GoogleIcon className="w-6 h-6 mr-3" />
                Login with Google
              </GradientButton>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-12 text-center pb-8">
            <span className="text-white/40 font-chakra text-sm font-medium">Don&apos;t have an account? </span>
            <button
              onClick={() => router.push('/onboarding/role-select')}
              className="text-orange-gaffer font-chakra font-semibold text-sm hover:underline"
            >
              Sign Up
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
