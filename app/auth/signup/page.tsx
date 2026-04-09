'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { signUpSchema, type SignUpFormData } from '@/lib/schemas'
import { AuthInput } from '@/components/AuthInput'
import { AuthSelect } from '@/components/AuthSelect'
import { GradientButton } from '@/components/GradientButton'
import { ChevronLeft } from 'lucide-react'

import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { useGoogleLogin } from '@react-oauth/google'
import { googleAuth } from '@/lib/services/auth.service'
import { useGoBack } from '@/hooks/useGoBack'

export default function SignUpPage() {
  const router = useRouter()
  const goBack = useGoBack('/')
  const { register: registerUser, error, clearError, setRole } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    return () => clearError()
  }, [clearError])

  const handleGoogleAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        await googleAuth(tokenResponse.access_token)
        const currentRole = useAuthStore.getState().role
        router.replace(currentRole === 'organization' ? '/admin' : '/app/dashboard')
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
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      gender: undefined,
    },
  })

  const onSubmit = async (data: SignUpFormData) => {
    setIsSubmitting(true)
    try {
      await registerUser(data.email, data.password)

      // Set role immediately so useAuthGuard('personal') can resolve without
      // waiting for updateProfile. If updateProfile is slow or fails, the guard
      // would otherwise see role=null and show a permanent loading spinner.
      setRole('personal')

      const { updateProfile } = await import('@/lib/services/user.service')
      await updateProfile({
          isPersonalActive: true,
          lastRole: 'personal',
      })

      router.replace('/app/dashboard')
    } catch {
      // Error displayed from store
    } finally {
      setIsSubmitting(false)
    }
  }

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
            <h1 className="font-chakra font-semibold text-[28px] text-white leading-tight uppercase tracking-wider">
              Welcome to
            </h1>
            <h1 className="font-chakra font-bold text-[36px] bg-gradient-to-r from-[#FF8904] to-[#E7000B] bg-clip-text text-transparent leading-tight -mt-1 uppercase tracking-widest">
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <AuthInput
              label="Email"
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

            <AuthInput
              label="Confirm Password"
              showPasswordToggle
              placeholder="************"
              className="bg-white/5 border-white/10 rounded-lg h-14"
              error={errors.confirmPassword}
              {...register('confirmPassword')}
            />

            <AuthSelect
              label="Gender"
              placeholder="Select Gender"
              className="bg-white/5 border-white/10 rounded-lg h-14"
              error={errors.gender}
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
              ]}
              {...register('gender')}
            />

            <div className="pt-6 flex flex-col gap-6 text-center">
              <GradientButton 
                type="submit" 
                loading={isSubmitting}
                className="h-16 rounded-xl font-chakra font-bold text-lg bg-gradient-to-r from-[#FF8904] to-[#E7000B] border-none shadow-none uppercase"
              >
                Get started
              </GradientButton>

              <div className="text-white/40 font-chakra text-sm font-medium">Or</div>

              <GradientButton
                variant="google"
                loading={false}
                onClick={() => handleGoogleAuth()}
                className="h-16 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 font-chakra font-semibold text-[15px]"
              >
                <img src="/icons/google.svg" alt="" className="hidden" /> {/* We'll use our GoogleIcon component if we can't find the file */}
                <GoogleIcon className="w-6 h-6 mr-3" />
                Sign Up with Google
              </GradientButton>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-12 text-center pb-8">
            <span className="text-white/40 font-chakra text-sm font-medium italic">Already have an account? </span>
            <button
              onClick={() => router.push('/auth/login')}
              className="text-orange-gaffer font-chakra font-semibold text-sm hover:underline"
            >
              Sign In
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
