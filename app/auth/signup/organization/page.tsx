'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { organizationSignUpSchema, type OrganizationSignUpFormData } from '@/lib/schemas'
import { AuthInput } from '@/components/AuthInput'
import { TextArea } from '@/components/TextArea'
import { GradientButton } from '@/components/GradientButton'
import { ChevronLeft, Check } from 'lucide-react'

const sportsList = [
  'Football', 'Basketball', 'Tennis', 'Cricket', 'Rugby', 
  'Athletics', 'Swimming', 'Cycling', 'Golf', 'Boxing'
]

export default function OrganizationSignupPage() {
  const router = useRouter()
  const { register: registerUser, isLoading, error, clearError, setRole } = useAuthStore()
  const [step, setStep] = useState(1)
  const [selectedSports, setSelectedSports] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<OrganizationSignUpFormData>({
    resolver: zodResolver(organizationSignUpSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      email: '',
      handle: '@',
      password: '',
      confirmPassword: '',
      sports: [],
      description: '',
    },
  })

  useEffect(() => {
    return () => clearError()
  }, [clearError])

  const handleNext = async () => {
    const isStep1Valid = await trigger(['name', 'email', 'handle', 'password', 'confirmPassword'])
    if (isStep1Valid) {
      setStep(2)
    }
  }

  const toggleSport = (sport: string) => {
    const newSports = selectedSports.includes(sport)
      ? selectedSports.filter(s => s !== sport)
      : [...selectedSports, sport]
    
    setSelectedSports(newSports)
    setValue('sports', newSports, { shouldValidate: true })
  }

  const onSubmit = async (data: OrganizationSignUpFormData) => {
    try {
      await registerUser(data.email, data.password)
      setRole('organization')
      router.replace('/admin')
    } catch {
      // Error displayed from store
    }
  }

  return (
    <div className="min-h-screen bg-gaffer-bg flex flex-col overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-12 pb-4 flex-shrink-0 z-10">
        <button
          onClick={() => step === 1 ? router.back() : setStep(1)}
          aria-label="Go back"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-gaffer-card border border-gaffer-border text-white transition-transform active:scale-95"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-xs text-gaffer-muted font-body tracking-wide">New Account</span>
      </div>

      <div className="flex-1 flex flex-col px-6 pb-10 relative">
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gaffer-orange/5 blur-[100px] pointer-events-none" />

        <motion.div
          key={step}
          initial={{ opacity: 0, x: step === 1 ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: step === 1 ? 20 : -20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex-1 flex flex-col"
        >
          {/* Title Area */}
          <div className="mb-8 mt-2">
            <h1 className="font-chakra font-bold text-[36px] text-white leading-[1.1]">Welcome to</h1>
            <h1 className="font-chakra font-black text-[40px] text-gradient-orange leading-[1.1] mb-2 uppercase">
              GAFFER
            </h1>
            <p className="font-body text-gaffer-muted text-[15px] font-medium opacity-80">
              Let's create your organization
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 flex-1 flex flex-col">
            {step === 1 ? (
              <div className="space-y-5">
                <AuthInput
                  label="Name"
                  placeholder="Charlie Westervelt"
                  error={errors.name}
                  {...register('name')}
                />
                <AuthInput
                  label="Email"
                  type="email"
                  placeholder="organizationname@gmail.com"
                  error={errors.email}
                  {...register('email')}
                />
                <AuthInput
                  label="Handle"
                  placeholder="@organization"
                  error={errors.handle}
                  {...register('handle')}
                />
                <AuthInput
                  label="Password"
                  type="password"
                  showPasswordToggle
                  placeholder="••••••••••••"
                  error={errors.password}
                  {...register('password')}
                />
                <AuthInput
                  label="Confirm Password"
                  type="password"
                  showPasswordToggle
                  placeholder="••••••••••••"
                  error={errors.confirmPassword}
                  {...register('confirmPassword')}
                />
                
                <div className="pt-4 mt-auto">
                  <GradientButton 
                    onClick={(e) => {
                      e.preventDefault()
                      handleNext()
                    }}
                    style={{ background: 'linear-gradient(90deg, #FF8A00 0%, #FF0000 100%)' }}
                    className="h-[58px] rounded-2xl shadow-lg shadow-orange-900/20"
                  >
                    Next
                  </GradientButton>
                </div>
              </div>
            ) : (
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="space-y-1.5">
                  <label className="block text-sm font-body font-medium text-white/80 pl-1">
                    Select Sports
                  </label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {sportsList.map(sport => {
                      const isSelected = selectedSports.includes(sport)
                      return (
                        <button
                          key={sport}
                          type="button"
                          onClick={() => toggleSport(sport)}
                          className={`
                            px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-300
                            flex items-center gap-2 border
                            ${isSelected 
                              ? 'bg-gaffer-orange border-gaffer-orange text-white shadow-lg shadow-orange-500/30' 
                              : 'bg-gaffer-card border-gaffer-border text-gaffer-subtle hover:border-gaffer-orange/50'}
                          `}
                        >
                          {isSelected && <Check size={12} />}
                          {sport}
                        </button>
                      )
                    })}
                  </div>
                  {errors.sports && (
                    <p className="text-xs text-red-400 pl-1 mt-1">{errors.sports.message}</p>
                  )}
                </div>

                <TextArea
                  label="Description"
                  placeholder="Tell us about your organization..."
                  error={errors.description}
                  {...register('description')}
                />

                <div className="pt-4 mt-auto">
                  <GradientButton 
                    type="submit" 
                    loading={isLoading}
                    style={{ background: 'linear-gradient(90deg, #FF8A00 0%, #FF0000 100%)' }}
                    className="h-[58px] rounded-2xl shadow-lg shadow-orange-900/20"
                  >
                    Get started
                  </GradientButton>
                </div>
              </div>
            )}
          </form>
        </motion.div>
      </div>

      {/* Progress indicator */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${step === 1 ? 'w-6 bg-gaffer-orange' : 'bg-gaffer-border'}`} />
        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${step === 2 ? 'w-6 bg-gaffer-orange' : 'bg-gaffer-border'}`} />
      </div>
    </div>
  )
}
