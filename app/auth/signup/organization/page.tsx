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
  const { user, register: registerUser, isAuthenticated, error, clearError, setRole } = useAuthStore()
  const [step, setStep] = useState<1 | 2>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orgError, setOrgError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated && step === 1) {
      setStep(2)
    }
  }, [isAuthenticated, step])

  useEffect(() => {
    return () => clearError()
  }, [clearError])

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
    watch,
    setValue,
  } = useForm<OrganizationSignUpFormData>({
    resolver: zodResolver(organizationSignUpSchema),
    mode: 'onTouched',
    defaultValues: {
      orgName: '',
      fullName: '',
      email: '',
      handle: '',
      password: '',
      confirmPassword: '',
      sports: [],
      description: '',
      phone: '',
      socialLink: '',
    },
  })

  const handleNext = async (e?: React.MouseEvent) => {
    const fields: any[] = ['orgName', 'handle']
    if (!isAuthenticated) {
      fields.push('fullName', 'email', 'password', 'confirmPassword')
    }
    const isStep1Valid = await trigger(fields)
    if (isStep1Valid) {
      setStep(2)
    }
  }

  const onSubmit = async (data: OrganizationSignUpFormData) => {
    setIsSubmitting(true)
    setOrgError(null)
    try {
      let finalUser = user

      // 1. Register the user ONLY if they are not already logged in
      if (!finalUser) {
        if (!data.email || !data.password) {
           throw new Error("Email and password are required for registration");
        }
        finalUser = await registerUser(data.email, data.password)
      }

      // 2. Create the organization and update user profile in one backend operation
      await createOrg({
        name: data.orgName,
        handle: data.handle,
        description: data.description || '',
        sports: data.sports,
        phone: data.phone || undefined,
        socialLinks: data.socialLink ? [data.socialLink] : undefined,
        ownerId: finalUser.id,
        userFullName: data.fullName || finalUser.fullName || undefined,
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
                    label="Organization Name"
                    placeholder="Westervelt Athletic Club"
                    className="bg-white/5 border-white/10 rounded-lg h-14"
                    error={errors.orgName}
                    {...register('orgName')}
                  />

                  <AuthInput
                    label="Handle"
                    prefix="@"
                    placeholder="westervelt_ac"
                    className="bg-white/5 border-white/10 rounded-lg h-14"
                    error={errors.handle}
                    {...register('handle')}
                  />

                  {!isAuthenticated && (
                    <>
                      <AuthInput
                        label="Your Full Name"
                        placeholder="Charlie Westervelt"
                        className="bg-white/5 border-white/10 rounded-lg h-14"
                        error={errors.fullName}
                        {...register('fullName')}
                      />
                      <AuthInput
                        label="Email"
                        type="email"
                        placeholder="organization@email.com"
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
                    </>
                  )}

                  <div className="space-y-2">
                    <label className="block text-sm font-chakra font-medium text-white/70 pl-1">
                      Phone number (optional)
                    </label>
                    <input
                      {...register('phone')}
                      type="tel"
                      autoComplete="tel"
                      placeholder="So we can reach you about your application"
                      className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 font-chakra text-sm transition-all duration-200 focus:outline-none focus:border-gaffer-orange focus:ring-1 focus:ring-gaffer-orange/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-chakra font-medium text-white/70 pl-1">
                      Social page or website (optional)
                    </label>
                    <input
                      {...register('socialLink')}
                      placeholder="Instagram, X, Facebook or a website"
                      className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 font-chakra text-sm transition-all duration-200 focus:outline-none focus:border-gaffer-orange focus:ring-1 focus:ring-gaffer-orange/20"
                    />
                    <p className="text-xs text-white/40 pl-1">
                      Gaffer reviews every new organisation. You can set everything up now, and publishing opens once you are approved.
                    </p>
                  </div>

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
                  <div className="space-y-2">
                    <label className="block text-sm font-chakra font-medium text-white/70 pl-1">
                      Select Sports
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SPORT_OPTIONS.map((opt) => {
                        const currentSports = watch('sports') || []
                        const isSelected = currentSports.includes(opt.value)
                        
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setValue('sports', currentSports.filter(s => s !== opt.value), { shouldValidate: true })
                              } else {
                                setValue('sports', [...currentSports, opt.value], { shouldValidate: true })
                              }
                            }}
                            className={`px-4 py-2 rounded-xl font-chakra text-sm transition-all duration-200 border ${
                              isSelected 
                                ? 'bg-gradient-to-r from-[#FF8904] to-[#E7000B] text-white border-transparent shadow-[0_0_15px_rgba(255,137,4,0.3)]' 
                                : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:border-white/30'
                            }`}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                    {errors.sports && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-400 pl-1"
                      >
                        {errors.sports.message}
                      </motion.p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-chakra font-medium text-white/70 pl-1">
                      Description
                    </label>
                    <textarea
                      {...register('description')}
                      placeholder="Tell us about your league: who plays, how often, and roughly how many teams."
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
