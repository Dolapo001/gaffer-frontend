'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  listCoinPacks, 
  getWallet, 
  initiatePurchase, 
  verifyPayment,
  type CoinPack
} from '@/lib/services/payment.service'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'

// --- Custom Premium Icons ---
const CoinIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="20" cy="20" r="18" fill="url(#coin_grad1)" />
    <circle cx="20" cy="20" r="15" fill="url(#coin_grad2)" />
    <path d="M22.5 14H16.5C14.567 14 13 15.567 13 17.5V22.5C13 24.433 14.567 26 16.5 26H23.5C25.433 26 27 24.433 27 22.5V19.5H19V22H24V22.5C24 22.7761 23.7761 23 23.5 23H16.5C16.2239 23 16 22.7761 16 22.5V17.5C16 17.2239 16.2239 17 16.5 17H22.5V14Z" fill="#FFF2D1" />
    <defs>
      <linearGradient id="coin_grad1" x1="2" y1="2" x2="38" y2="38" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFA000" />
        <stop offset="1" stopColor="#FF4D00" />
      </linearGradient>
      <linearGradient id="coin_grad2" x1="20" y1="5" x2="20" y2="35" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFD54F" />
        <stop offset="1" stopColor="#FF8A00" />
      </linearGradient>
    </defs>
  </svg>
)

const BackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const SparkleIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C12 2 12 10 20 12C12 14 12 22 12 22C12 22 12 14 4 12C12 10 12 2 12 2Z" fill="currentColor"/>
    <path d="M20 5C20 5 20 8 23 9C20 10 20 13 20 13C20 13 20 10 17 9C20 8 20 5 20 5Z" fill="currentColor"/>
    <path d="M5 19C5 19 5 21.5 7.5 22.5C5 23.5 5 26 5 26C5 26 5 23.5 2.5 22.5C5 21.5 5 19 5 19Z" fill="currentColor"/>
  </svg>
)

const TreasureBoxIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path opacity="0.1" d="M15 40L50 20L85 40V75L50 95L15 75V40Z" fill="currentColor" />
    <path d="M50 20L85 40M50 20L15 40M50 20V5M85 40V75L50 95M85 40L50 60M15 40V75L50 95M15 40L50 60M50 95V60" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="50" cy="60" r="10" fill="currentColor" />
  </svg>
)

const CheckMarkIcon = ({ className = "w-6 h-6 text-gaffer-orange" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const AlertIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="16" r="1" fill="currentColor"/>
  </svg>
)

export default function ShopPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToastStore()
  const reference = searchParams.get('reference')
  const [isVerifying, setIsVerifying] = useState(false)

  // 1. Fetch data
  const { data: packs, isLoading: isLoadingPacks } = useQuery({
    queryKey: ['coin-packs'],
    queryFn: listCoinPacks
  })

  const { data: wallet, refetch: refetchWallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: getWallet
  })

  // 2. Mutations
  const buyMutation = useMutation({
    mutationFn: (packId: string) => initiatePurchase(packId),
    onSuccess: (data) => {
      // Redirect to Paystack
      window.location.href = data.authorization_url
    },
    onError: (err) => toast.addToast(getErrorMessage(err), 'error')
  })

  // 3. Handle Payment Verification if returning from Paystack
  useEffect(() => {
    if (reference) {
      const verify = async () => {
        setIsVerifying(true)
        try {
          const res = await verifyPayment(reference)
          toast.addToast(`Success! ${res.coinsAdded} coins added to your wallet.`, 'success')
          refetchWallet()
          // Clear query params
          router.replace('/app/shop')
        } catch (err) {
          toast.addToast('Payment verification failed. If you were debited, please contact support.', 'error')
        } finally {
          setIsVerifying(false)
        }
      }
      verify()
    }
  }, [reference, toast, refetchWallet, router])

  return (
    <div className="min-h-screen bg-[#181928] text-white flex flex-col font-inter pb-32">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#181928]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4 px-4 md:px-6 pt-12 pb-4">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all active:scale-95">
            <BackIcon />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-chakra font-black uppercase tracking-tight">Coins Store</h1>
            <p className="text-[10px] text-white/30 font-chakra font-bold uppercase tracking-[2px]">Power up your game</p>
          </div>
          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
            <CoinIcon className="w-4 h-4" />
            <span className="text-[14px] font-chakra font-black">{wallet?.balance ?? 0}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-8 pb-32 space-y-8 no-scrollbar">
        
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
                <p className="text-white/40 text-[11px] font-bold uppercase tracking-wider mt-1">Please don't close this page...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Featured Card */}
        <div className="relative rounded-[32px] overflow-hidden bg-gradient-to-br from-[#FF8904] to-[#E7000B] p-8 shadow-2xl group cursor-pointer border border-white/10">
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2 text-white/80">
              <SparkleIcon />
              <span className="text-[10px] font-chakra font-black uppercase tracking-[0.2em]">Collector's Edition</span>
            </div>
            <h2 className="text-3xl font-chakra font-black uppercase tracking-tighter leading-none">Get Gaffer Coins</h2>
            <p className="text-white/70 text-sm font-medium leading-tight max-w-[200px]">Unlock legendary chips and premium features.</p>
          </div>
          <TreasureBoxIcon className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10 rotate-12 group-hover:scale-110 transition-transform duration-700" />
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
                className="relative bg-[#1E2032] border border-white/5 rounded-[28px] p-4 flex items-center justify-between group hover:border-[#ff6b00]/60 hover:bg-white/5 hover:-translate-y-1 shadow-md hover:shadow-gaffer-orange/20 transition-all duration-300 active:scale-[0.98] overflow-hidden"
              >
                {/* Visual Accent */}
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff6b00]/70 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                <div className="absolute top-1/2 right-10 w-24 h-24 bg-[#ff6b00]/10 blur-[30px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                
                {idx === 2 && (
                  <div className="absolute top-0 right-0 bg-[#ff6b00] text-white text-[8px] font-black py-1 px-4 rounded-bl-2xl uppercase tracking-widest shadow-[0_4px_12px_rgba(255,107,0,0.3)] z-20">
                    Best Value
                  </div>
                )}

                <div className="flex items-center gap-4 relative z-10 w-full mt-1">
                  <div className="w-14 h-14 rounded-[20px] bg-[#2a2b3d] border border-white/5 flex items-center justify-center relative flex-shrink-0 group-hover:bg-[#ff6b00]/10 shadow-inner group-hover:shadow-[0_4px_8px_rgba(255,107,0,0.4)] transition-all duration-300">
                     <CoinIcon className="w-8 h-8 filter drop-shadow-md group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500 ease-out" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <h4 className="font-chakra font-black text-lg text-white uppercase tracking-tight leading-none mb-1">
                      {pack.coins} <span className="text-gaffer-orange">Coins</span>
                    </h4>
                    <p className="text-[9px] text-white/30 font-chakra font-bold uppercase tracking-widest">
                      {pack.coins} Match Credits
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <div className="bg-white text-black px-4 py-2.5 rounded-xl font-chakra font-black text-xs uppercase shadow-white-glow group-hover:bg-gaffer-orange group-hover:text-white group-hover:shadow-[0_4px_16px_rgba(255,107,0,0.4)] transition-all duration-300">
                      {pack.currency || 'NGN'} {(pack.priceAmount ?? 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-white/5 rounded-[32px] p-8 space-y-6 hover:bg-white/10 transition-colors duration-300">
          <div className="flex items-center gap-3">
             <CheckMarkIcon />
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

        {/* Secure Message */}
        <div className="flex items-center justify-center gap-2 opacity-30 text-[10px] font-chakra font-bold uppercase tracking-widest pt-4">
           <AlertIcon />
           Secure Payments by Paystack
        </div>

      </div>

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
               <p className="font-chakra font-black uppercase tracking-widest text-white">Redirecting to Paystack...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
