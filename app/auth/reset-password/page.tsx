'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { confirmPasswordReset } from '@/lib/services/auth.service'
import { AuthInput } from '@/components/AuthInput'
import { GradientButton } from '@/components/GradientButton'
import { ChevronLeft, CheckCircle, AlertCircle } from 'lucide-react'

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
type FormData = z.infer<typeof schema>

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new link.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await confirmPasswordReset(token, data.password)
      setDone(true)
    } catch {
      setError('This link has expired or already been used. Please request a new one.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-5">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <AlertCircle size={32} className="text-red-400" />
        </div>
        <div>
          <h2 className="font-display font-bold text-2xl text-white mb-2">Invalid Link</h2>
          <p className="font-body text-gaffer-muted text-sm leading-relaxed">
            This password reset link is missing a token. Please request a new one.
          </p>
        </div>
        <GradientButton onClick={() => router.push('/auth/forgot-password')}>
          Request New Link
        </GradientButton>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col"
    >
      {!done ? (
        <>
          <div className="mb-8">
            <h1 className="font-display font-bold text-3xl text-white leading-tight">
              New Password
            </h1>
            <p className="font-body text-gaffer-muted text-sm mt-2 leading-relaxed">
              Choose a strong password for your account.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-body"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <AuthInput
              label="New Password"
              showPasswordToggle
              placeholder="············"
              error={errors.password}
              {...register('password')}
            />
            <AuthInput
              label="Confirm Password"
              showPasswordToggle
              placeholder="············"
              error={errors.confirmPassword}
              {...register('confirmPassword')}
            />
            <div className="pt-2">
              <GradientButton type="submit" loading={loading}>
                Set New Password
              </GradientButton>
            </div>
          </form>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center text-center gap-5"
        >
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
            <CheckCircle size={32} className="text-green-400" />
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl text-white mb-2">Password Updated</h2>
            <p className="font-body text-gaffer-muted text-sm leading-relaxed">
              Your password has been reset. You can now log in with your new password.
            </p>
          </div>
          <GradientButton onClick={() => router.push('/auth/login')}>
            Go to Login
          </GradientButton>
        </motion.div>
      )}
    </motion.div>
  )
}

export default function ResetPasswordPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gaffer-bg flex flex-col px-6">
      <div className="flex items-center gap-3 pt-12 pb-6">
        <button
          onClick={() => router.push('/auth/login')}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-gaffer-card border border-gaffer-border text-white"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      <Suspense fallback={<div className="flex-1" />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
