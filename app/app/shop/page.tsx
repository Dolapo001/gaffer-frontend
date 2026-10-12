'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import Script from 'next/script'
import {
  listCoinPacks,
  initiatePurchase,
  verifyPayment,
  verifyPendingPayment,
  type CoinPack
} from '@/lib/services/payment.service'
import { ChevronLeft, ShoppingBag, CreditCard, Sparkles, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'
import { useGoBack } from '@/hooks/useGoBack'
import { WalletPill } from '@/components/WalletPill'
import { formatNaira } from '@/lib/format'

export default function ShopPage() {
  const router = useRouter()
  const goBack = useGoBack('/app/dashboard')
  const searchParams = useSearchParams()
  const toast = useToastStore()
  const qc = useQueryClient()
  const reference = searchParams.get('reference')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isManualVerifying, setIsManualVerifying] = useState(false)
  const verifiedRef = useRef<string | null>(null)

  // 1. Fetch data
  const { data: packs, isLoading: isLoadingPacks } = useQuery({
    queryKey: ['coin-packs'],
    queryFn: listCoinPacks
  })

  // Auto-check and reconcile pending payment on mount and app resume/focus
  const checkPending = async (silent = true) => {
    try {
      const res = await verifyPendingPayment()
      if (res.credited) {
        toast.addToast(`Success! ${res.coinsAdded} coins added to your wallet.`, 'success')
        qc.invalidateQueries({ queryKey: ['wallet'] })
        return true
      } else if (!silent) {
        toast.addToast('No pending payment found. If you were debited, please contact support.', 'info')
      }
    } catch (err: any) {
      if (!silent) {
        toast.addToast(err?.message || 'Could not verify payment. Please try again.', 'error')
      }
    }
    return false
  }

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkPending(true)
      }
    }
    window.addEventListener('focus', onVisibilityChange)
    document.addEventListener('visibilitychange', onVisibilityChange)
    checkPending(true)

    return () => {
      window.removeEventListener('focus', onVisibilityChange)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  // 2. Mutations
  const buyMutation = useMutation({
    mutationFn: (packId: string) => initiatePurchase(packId),
    onSuccess: (data) => {
      // If Paystack inline script is loaded, try opening popup first
      if (typeof window !== 'undefined' && (window as any).PaystackPop && data.access_code) {
        try {
          const handler = (window as any).PaystackPop.setup({
            key: process.env.NEXT_PUBLIC_PAYSTACK_KEY,
            access_code: data.access_code,
            callback: async (response: any) => {
              setIsVerifying(true)
              try {
                const res = await verifyPayment(response.reference || data.reference)
                toast.addToast(`Success! ${res.coinsAdded} coins added to your wallet.`, 'success')
                qc.invalidateQueries({ queryKey: ['wallet'] })
              } catch {
                await checkPending(true)
                qc.invalidateQueries({ queryKey: ['wallet'] })
              } finally {
                setIsVerifying(false)
              }
            },
            onClose: () => {
              checkPending(true)
            }
          })
          handler.openIframe()
          return
        } catch {
          // Fallback to direct redirect if popup setup failed
        }
      }

      // Default redirect
      window.location.href = data.authorization_url
    },
    onError: (err) => toast.addToast(getErrorMessage(err), 'error')
  })

  // 3. Handle Payment Verification if returning from Paystack redirect
  useEffect(() => {
    if (reference && verifiedRef.current !== reference) {
      verifiedRef.current = reference
      const verify = async () => {
        setIsVerifying(true)
        try {
          const res = await verifyPayment(reference)
          toast.addToast(`Success! ${res.coinsAdded} coins added to your wallet.`, 'success')
          qc.invalidateQueries({ queryKey: ['wallet'] })
          router.replace('/app/shop')
        } catch (err) {
          toast.addToast('Payment verification failed. If you were debited, please contact support.', 'error')
        } finally {
          setIsVerifying(false)
        }
      }
      verify()
    }
  }, [reference, toast, qc, router])

  const handleManualVerify = async () => {
    setIsManualVerifying(true)
    try {
      await checkPending(false)
    } finally {
      setIsManualVerifying(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#181928] text-white flex flex-col font-inter">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#181928]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4 px-6 pt-12 pb-4">
          <button onClick={goBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all">
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-chakra font-black uppercase tracking-tight">Coins Store</h1>
            <p className="text-[10px] text-white/30 font-chakra font-bold uppercase tracking-[2px]">Power up your game</p>
          </div>
          <WalletPill />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-24 space-y-8 no-scrollbar">
        
        {/* Verification Loader */}
        <AnimatePresence>
          {isVerifying && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-gaffer-orange/10 border border-gaffer-orange/20 rounded-3xl p-6 flex flex-col items-center gap-4 text-center overflow-hidden"
            >
              <div className="w-10 h-10 border-2 border-gaffer-orange border-t-transparent rounded-full animate-spin" />
              <div>
                <h3 className="font-chakra font-black uppercase text-sm text-gaffer-orange">Verifying Payment</h3>
                <p className="text-white/40 text-[11px] font-bold uppercase tracking-wider mt-1">Please don&apos;t close this page...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Featured Card */}
        <div className="relative rounded-[32px] overflow-hidden bg-gradient-to-br from-[#FF8904] to-[#E7000B] p-8 shadow-2xl overflow-hidden group">
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2 text-white/80">
              <Sparkles size={16} />
              <span className="text-[10px] font-chakra font-black uppercase tracking-[0.2em]">Collector&apos;s Edition</span>
            </div>
            <h2 className="text-3xl font-chakra font-black uppercase tracking-tighter leading-none">Get Gaffer Coins</h2>
            <p className="text-white/70 text-sm font-medium leading-tight max-w-[200px]">Unlock legendary chips and premium features.</p>
          </div>
          <ShoppingBag className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10 rotate-12 group-hover:scale-110 transition-transform duration-700" />
        </div>

        {/* Packs List */}
        <div className="space-y-4">
          <h3 className="text-[11px] font-chakra font-black uppercase tracking-widest text-white/40 ml-1">Available Packs</h3>
          
          <div className="grid grid-cols-1 gap-4">
            {isLoadingPacks ? (
              [1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 rounded-[28px] animate-pulse" />)
            ) : packs?.map((pack, idx) => (
              <button
                key={pack._id}
                onClick={() => buyMutation.mutate(pack._id)}
                disabled={buyMutation.isPending}
                className="relative bg-[#1E2032] border border-white/5 rounded-[28px] p-4 flex items-center justify-between group hover:border-gaffer-orange/30 transition-all active:scale-[0.98] overflow-hidden"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-gaffer-orange to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {idx === 2 && (
                  <div className="absolute -top-1 -right-10 bg-gaffer-orange text-white text-[7px] font-black py-4 px-12 rotate-45 uppercase tracking-widest shadow-xl">
                    Best Value
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center relative flex-shrink-0">
                     <span className="text-2xl filter drop-shadow-md group-hover:scale-110 transition-transform duration-500">💰</span>
                  </div>
                  <div className="text-left">
                    <h4 className="font-chakra font-black text-lg text-white uppercase tracking-tight leading-none">
                      {pack.coins} <span className="text-gaffer-orange">Coins</span>
                    </h4>
                    <p className="text-[9px] text-white/30 font-chakra font-bold uppercase tracking-widest mt-1">
                      {pack.coins} Credits
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-1.5 min-w-[100px]">
                  <div className="w-full py-2.5 bg-white text-black rounded-xl font-chakra font-black text-xs uppercase shadow-white-glow group-hover:bg-gaffer-orange group-hover:text-white transition-all text-center">
                    {formatNaira(pack.priceAmount ?? 0)}
                  </div>
                  <div className="flex items-center gap-1 text-[8px] text-gaffer-orange font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    Purchase &rarr;
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-white/5 rounded-[32px] p-8 space-y-6">
          <div className="flex items-center gap-3">
             <CheckCircle2 size={24} className="text-gaffer-orange" />
             <h4 className="font-chakra font-black uppercase text-sm tracking-widest">Why get Coins?</h4>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
               <div className="text-white/60 font-chakra font-bold text-xs uppercase">Power Chips</div>
               <p className="text-[10px] text-white/30 leading-snug">Purchase Wildcards and Triple Captain chips.</p>
            </div>
            <div className="space-y-1">
               <div className="text-white/60 font-chakra font-bold text-xs uppercase">Custom Avatars</div>
               <p className="text-[10px] text-white/30 leading-snug">Unlock exclusive profile customization.</p>
            </div>
          </div>
        </div>

        {/* Manual Reconcile Button */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={handleManualVerify}
            disabled={isManualVerifying}
            className="inline-flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-[11px] font-chakra font-bold uppercase tracking-wider underline disabled:opacity-50"
          >
            <RefreshCw size={12} className={isManualVerifying ? "animate-spin text-gaffer-orange" : ""} />
            {isManualVerifying ? 'Checking Paystack...' : 'Paid but coins not showing? Tap to refresh'}
          </button>
        </div>

        {/* Secure Message */}
        <div className="flex items-center justify-center gap-2 opacity-30 text-[10px] font-chakra font-bold uppercase tracking-widest pt-2">
           <AlertCircle size={12} />
           Secure Payments by Paystack
        </div>

      </div>

      {/* Script for Paystack inline popup */}
      <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />

      {/* Buy Button Overlay (if loading) */}
      <AnimatePresence>
        {buyMutation.isPending && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center"
          >
            <div className="text-center space-y-4">
               <div className="w-12 h-12 border-4 border-gaffer-orange border-t-transparent rounded-full animate-spin mx-auto" />
               <p className="font-chakra font-black uppercase tracking-widest text-white">Opening Paystack...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
