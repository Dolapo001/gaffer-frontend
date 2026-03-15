'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { resetPassword } from '@/lib/firebase'
import { AuthInput } from '@/components/AuthInput'
import { GradientButton } from '@/components/GradientButton'
import { ChevronLeft, CheckCircle } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
})
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError(null)
    try {
      await resetPassword(data.email)
      setSent(true)
    } catch {
      setError('Failed to send reset email. Please check the address and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gaffer-bg flex flex-col px-6">
      {/* Header */}
      <div className="flex items-center gap-3 pt-12 pb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-gaffer-card border border-gaffer-border text-white"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col"
      >
        {!sent ? (
          <>
            <div className="mb-8">
              <h1 className="font-display font-bold text-3xl text-white leading-tight">
                Reset Password
              </h1>
              <p className="font-body text-gaffer-muted text-sm mt-2 leading-relaxed">
                Enter your email and we&apos;ll send you a link to reset your password.
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
                label="Email Address"
                type="email"
                placeholder="your@email.com"
                error={errors.email}
                {...register('email')}
              />
              <div className="pt-2">
                <GradientButton type="submit" loading={loading}>
                  Send Reset Link
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
              <h2 className="font-display font-bold text-2xl text-white mb-2">Check your inbox</h2>
              <p className="font-body text-gaffer-muted text-sm leading-relaxed">
                We sent a password reset link to{' '}
                <span className="text-white font-medium">{getValues('email')}</span>
              </p>
            </div>
            <GradientButton onClick={() => router.push('/auth/login')}>
              Back to Login
            </GradientButton>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
