'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { createOrg } from '@/lib/services/org.service'
import { organizationSignUpSchema, type OrganizationSignUpFormData } from '@/lib/schemas'
import { AuthInput } from '@/components/AuthInput'
import { AuthSelect } from '@/components/AuthSelect'
import { GradientButton } from '@/components/GradientButton'
import { ChevronLeft } from 'lucide-react'
import { getErrorMessage } from '@/lib/api'

const SPORT_OPTIONS = [
  { value: 'football', label: 'Football' },
  { value: 'basketball', label: 'Basketball' },
  // { value: 'tennis', label: 'Tennis' },
  // { value: 'cricket', label: 'Cricket' },
  // { value: 'rugby', label: 'Rugby' },
  // { value: 'baseball', label: 'Baseball' },
  { value: 'volleyball', label: 'Volleyball' },
  // { value: 'hockey', label: 'Hockey' },
]

export default function OrganizationSignupPage() {
  const router = useRouter()
  const { register: registerUser, error, clearError, setRole } = useAuthStore()
  const [step, setStep] = useState<1 | 2>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orgError, setOrgError] = useState<string | null>(null)

  useEffect(() => {
    return () => clearError()
  }, [clearError])

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
    watch,
  } = useForm<OrganizationSignUpFormData>({
    resolver: zodResolver(organizationSignUpSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      email: '',
      handle: '',
      password: '',
      confirmPassword: '',
      sport: '',
      description: '',
    },
  })

  const handleNext = async (e?: React.MouseEvent) => {
    e?.preventDefault()
    const isStep1Valid = await trigger(['name', 'email', 'handle', 'password', 'confirmPassword'])
    if (isStep1Valid) {
      setStep(2)
    }
  }

  const onSubmit = async (data: OrganizationSignUpFormData) => {
    setIsSubmitting(true)
    setOrgError(null)
    try {
      // 1. Register the user
      const user = await registerUser(data.email, data.password)
      
      // 2. Update user profile with name and role flag
      const { updateProfile } = await import('@/lib/services/user.service')
      await updateProfile({
          fullName: data.name,
          isOrgActive: true,
          lastRole: 'organization'
      })
      
      // 3. Create the organization
      await createOrg({
        name: data.name,
        handle: data.handle,
        description: data.description || '',
        sport: data.sport,
        ownerId: user.id
      })
      
      setRole('organization')
      router.replace('/admin')
    } catch (err) {
      setOrgError(getErrorMessage(err))
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
        <div className="flex items-center justify-between px-6 pt-12 pb-4 flex-shrink-0">
          <button
            onClick={(e) => {
              e.preventDefault()
              if (step === 1) {
                router.push('/onboarding/role-select')
              } else {
                setStep(1)
              }
            }}
            aria-label="Go back"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white transition-transform active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="text-white/40 text-xs font-chakra font-medium">
            Step {step} of 2
          </div>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1 flex flex-col px-7 pb-10 pt-4"
        >
          {/* Title Section */}
          <div className="mb-8">
            <h1 className="font-chakra font-semibold text-[28px] text-white leading-tight uppercase tracking-wider">
              Welcome to
            </h1>
            <h1 className="font-chakra font-bold text-[36px] bg-gradient-to-r from-[#FF8904] to-[#E7000B] bg-clip-text text-transparent leading-tight -mt-1 uppercase tracking-widest">
              GAFFER
            </h1>
            <p className="font-chakra text-white text-[15px] mt-4 font-medium italic opacity-90">
              Let&apos;s create your organization
            </p>
          </div>

          {/* Error Message */}
          {(error || orgError) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-100 text-sm font-chakra"
            >
              {error || orgError}
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <AuthInput
                    label="Name"
                    placeholder="Charlie Westervelt"
                    className="bg-white/5 border-white/10 rounded-lg h-14"
                    error={errors.name}
                    {...register('name')}
                  />

                  <AuthInput
                    label="Email"
                    type="email"
                    placeholder="organizationname@gmial.com"
                    className="bg-white/5 border-white/10 rounded-lg h-14"
                    error={errors.email}
                    {...register('email')}
                  />

                  <AuthInput
                    label="Handle"
                    prefix="@"
                    placeholder="westervelt_ac"
                    className="bg-white/5 border-white/10 rounded-lg h-14"
                    error={errors.handle}
                    {...register('handle')}
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

                  <div className="pt-6">
                    <GradientButton 
                      type="button"
                      onClick={handleNext}
                      className="h-16 rounded-xl font-chakra font-bold text-lg bg-gradient-to-r from-[#FF8904] to-[#E7000B] border-none shadow-none"
                    >
                      Next
                    </GradientButton>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <AuthSelect
                    label="Select Sports"
                    placeholder="Select your Sports"
                    options={SPORT_OPTIONS}
                    className="bg-white/5 border-white/10 rounded-lg h-14"
                    error={errors.sport}
                    {...register('sport')}
                  />

                  <div className="space-y-2">
                    <label className="block text-sm font-chakra font-medium text-white/70 pl-1">
                      Description
                    </label>
                    <textarea
                      {...register('description')}
                      placeholder="Charlie Westervelt"
                      rows={5}
                      className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 font-chakra text-sm transition-all duration-200 focus:outline-none focus:border-gaffer-orange focus:ring-1 focus:ring-gaffer-orange/20 resize-none h-40"
                    />
                    {errors.description && (
                      <p className="text-xs text-red-400 pl-1">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="pt-6">
                    <GradientButton 
                      type="submit" 
                      loading={isSubmitting}
                      className="h-16 rounded-xl font-chakra font-bold text-lg bg-gradient-to-r from-[#FF8904] to-[#E7000B] border-none shadow-none"
                    >
                      Get started
                    </GradientButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Progress dots */}
          <div className="mt-8 flex justify-center gap-2">
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-8 bg-gaffer-orange' : 'w-2 bg-white/10'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-8 bg-gaffer-orange' : 'w-2 bg-white/10'}`} />
          </div>

          {step === 1 && (
            <div className="mt-12 text-center pb-8">
              <span className="text-white/40 font-chakra text-sm font-medium italic">Already have an account? </span>
              <button
                onClick={() => router.push('/auth/login')}
                className="text-orange-gaffer font-chakra font-semibold text-sm hover:underline"
              >
                Sign In
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
