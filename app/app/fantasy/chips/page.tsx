'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Sparkles, ShoppingBag, Zap, Clock, ShieldCheck, HelpCircle, X } from 'lucide-react'
import { listChips, purchaseChip, type ChipType, type ChipInfo } from '@/lib/services/chip.service'
import { getWallet } from '@/lib/services/payment.service'
import { listGameweeks, activateChip } from '@/lib/services/fantasy.service'
import { useGoBack } from '@/hooks/useGoBack'
import { useFantasyStore } from '@/store/fantasyStore'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'

const CHIP_LABELS: Record<string, string> = {
  wildcard: 'Wildcard',
  triple_captain: 'Triple Captain',
  bench_boost: 'Bench Boost',
  free_hit: 'Free Hit'
}

const CHIP_DESCRIPTIONS: Record<string, string> = {
  wildcard: 'Make unlimited transfers for one gameweek for free.',
  triple_captain: 'Your captain gains 3x points instead of 2x.',
  bench_boost: 'Points from your bench players are added to your total.',
  free_hit: 'Make unlimited transfers for ONE gameweek. Your squad reverts next GW.'
}

export default function ChipsPage() {
  const router = useRouter()
  const goBack = useGoBack('/app/fantasy')
  const qc = useQueryClient()
  const toast = useToastStore()
  const { competitionId } = useFantasyStore()
  const [selectedChip, setSelectedChip] = useState<ChipInfo | null>(null)

  // 1. Data Fetching
  const { data: chips, isLoading: isLoadingChips } = useQuery({
    queryKey: ['chips', competitionId],
    queryFn: () => listChips(competitionId!),
    enabled: !!competitionId
  })

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: getWallet
  })

  const { data: gameweeks } = useQuery({
    queryKey: ['gameweeks', competitionId],
    queryFn: () => listGameweeks(competitionId!),
    enabled: !!competitionId
  })

  // Active gameweek: first open one, otherwise the last one
  const activeGameweek = gameweeks?.find((gw) => gw.lockStatus === 'open') ?? gameweeks?.[gameweeks.length - 1]

  // 2. Mutations
  const buyMutation = useMutation({
    mutationFn: (chipType: ChipType) => purchaseChip(competitionId!, chipType),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['chips', competitionId] })
      qc.invalidateQueries({ queryKey: ['wallet'] })
      toast.addToast(`Success! You purchased a ${CHIP_LABELS[data.inventory.chipType]} chip.`, 'success')
      setSelectedChip(null)
    },
    onError: (err) => toast.addToast(getErrorMessage(err), 'error')
  })

  const activateMutation = useMutation({
    mutationFn: (chipType: ChipType) =>
      activateChip(competitionId!, chipType as any, activeGameweek!._id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chips', competitionId] })
      toast.addToast(`Chip activated for Gameweek ${activeGameweek?.number ?? ''}!`, 'success')
      setSelectedChip(null)
    },
    onError: (err) => toast.addToast(getErrorMessage(err), 'error')
  })

  if (!competitionId) return null

  return (
    <div className="min-h-screen bg-[#181928] text-white flex flex-col font-inter">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#181928]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4 px-6 pt-12 pb-4">
          <button onClick={goBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all">
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-chakra font-black uppercase tracking-tight">Tactical Center</h1>
            <p className="text-[10px] text-white/30 font-chakra font-bold uppercase tracking-[2px]">Inventory & Store</p>
          </div>
          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
            <span className="text-orange-500 text-sm">💰</span>
            <span className="text-[14px] font-chakra font-black">{wallet?.balance ?? 0}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-24 space-y-10 no-scrollbar">
        
        {/* Inventory Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-chakra font-black uppercase tracking-[0.2em] text-white/40 ml-1">My Tactical Reserve</h3>
            <span className="text-[10px] bg-gaffer-orange/10 text-gaffer-orange px-2 py-0.5 rounded font-chakra font-black uppercase">Season Use Only</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {isLoadingChips ? (
              [1, 2].map(i => <div key={i} className="h-32 bg-white/5 rounded-[24px] animate-pulse" />)
            ) : chips?.filter(c => c.remaining > 0).map(chip => (
              <div key={chip.chipType} className="bg-[#1E2032] border border-white/5 rounded-[24px] p-5 flex flex-col gap-3 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3">
                   <div className="w-8 h-8 rounded-full bg-gaffer-orange/10 flex items-center justify-center font-chakra font-black text-gaffer-orange text-xs">
                     x{chip.remaining}
                   </div>
                </div>
                <Zap size={24} className="text-gaffer-orange" />
                <div>
                  <h4 className="font-chakra font-black text-sm uppercase tracking-tight">{CHIP_LABELS[chip.chipType]}</h4>
                  <p className="text-[9px] text-white/30 font-bold uppercase leading-tight mt-1 truncate">{CHIP_DESCRIPTIONS[chip.chipType]}</p>
                </div>
                {chip.cooldown.active && (
                   <div className="flex items-center gap-1.5 text-[9px] text-yellow-500 font-chakra font-black uppercase mt-1">
                      <Clock size={10} /> GW {chip.cooldown.nextAvailableGameweek}
                   </div>
                )}
              </div>
            ))}
            {chips?.every(c => c.remaining === 0) && (
               <div className="col-span-2 py-10 text-center bg-white/5 rounded-[24px] border border-dashed border-white/10">
                  <ShieldCheck size={32} className="mx-auto text-white/10 mb-2" />
                  <p className="text-[10px] text-white/40 font-chakra font-black uppercase tracking-widest">No chips in reserve</p>
               </div>
            )}
          </div>
        </section>

        {/* Store Section */}
        <section className="space-y-4">
          <h3 className="text-[11px] font-chakra font-black uppercase tracking-[0.2em] text-white/40 ml-1">Operational Store</h3>
          <div className="space-y-3">
            {chips?.map(chip => (
              <button
                key={chip.chipType}
                onClick={() => setSelectedChip(chip)}
                className="w-full bg-[#1E2032] border border-white/5 rounded-[28px] p-6 flex items-center justify-between group hover:border-gaffer-orange/40 transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${chip.price.coins === 0 ? 'bg-green-500/10' : 'bg-white/5'}`}>
                     <Sparkles size={24} className={chip.price.coins === 0 ? 'text-green-500' : 'text-white/40'} />
                  </div>
                  <div className="text-left">
                    <h4 className="font-chakra font-black text-base text-white uppercase tracking-tight">{CHIP_LABELS[chip.chipType]}</h4>
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{chip.price.coins === 0 ? 'Free Starter' : `${chip.price.coins} Gaffer Coins`}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                   <div className="text-[10px] text-white/20 font-black uppercase tracking-widest">{chip.owned}/{chip.max} Used</div>
                   <div className="px-3 py-1.5 bg-gaffer-orange text-white rounded-xl font-chakra font-black text-[10px] uppercase">Details &rarr;</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Info Card */}
        <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 flex items-start gap-4">
           <HelpCircle className="text-gaffer-orange shrink-0" size={20} />
           <div className="space-y-2">
              <h5 className="font-chakra font-black text-xs uppercase tracking-widest">Tactical Brief</h5>
              <p className="text-[10px] text-white/40 font-medium leading-relaxed">
                Chips allow you to gain a tactical advantage. **Wildcards** and **Free Hits** are best used during double gameweeks. **Triple Captain** should be saved for your top performer against weak opposition.
              </p>
           </div>
        </div>

      </div>

      {/* Purchase Dialog */}
      <AnimatePresence>
        {selectedChip && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/80 backdrop-blur-xl" 
               onClick={() => setSelectedChip(null)} 
             />
             <motion.div 
               initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
               className="relative w-full max-w-lg bg-[#1C1D2B] rounded-t-[40px] sm:rounded-[32px] p-8 border-t border-white/10 space-y-8"
             >
                <div className="flex items-start justify-between">
                   <div className="space-y-1">
                      <h2 className="text-2xl font-chakra font-black uppercase text-white tracking-tighter">{CHIP_LABELS[selectedChip.chipType]}</h2>
                      <p className="text-xs text-gaffer-orange font-bold uppercase tracking-widest">{selectedChip.price.coins === 0 ? 'FREE' : `${selectedChip.price.coins} COINS`}</p>
                   </div>
                   <button onClick={() => setSelectedChip(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/30"><X size={20} /></button>
                </div>

                <div className="space-y-6">
                   <p className="text-sm text-white/60 leading-relaxed font-medium">
                     {CHIP_DESCRIPTIONS[selectedChip.chipType]}
                   </p>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 rounded-2xl space-y-1">
                         <span className="text-[9px] text-white/20 font-black uppercase tracking-widest">Season Limit</span>
                         <p className="font-chakra font-black text-lg text-white">{selectedChip.max} Uses</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl space-y-1">
                         <span className="text-[9px] text-white/20 font-black uppercase tracking-widest">Cooldown</span>
                         <p className="font-chakra font-black text-lg text-white">{selectedChip.cooldownGameweeks} GWs</p>
                      </div>
                   </div>
                </div>

                <div className="pt-4 space-y-3">
                   <button
                     onClick={() => buyMutation.mutate(selectedChip.chipType)}
                     disabled={buyMutation.isPending || (selectedChip.price.coins > (wallet?.balance ?? 0))}
                     className="w-full h-16 rounded-[24px] bg-gradient-to-r from-gaffer-orange to-red-600 text-white font-chakra font-black text-sm uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all disabled:opacity-50"
                   >
                     {buyMutation.isPending ? 'Processing...' : selectedChip.price.coins > (wallet?.balance ?? 0) ? 'Insufficient Coins' : 'Confirm Purchase'}
                   </button>
                   {selectedChip.price.coins > (wallet?.balance ?? 0) && (
                     <button
                        onClick={() => router.push('/app/shop')}
                        className="w-full py-4 text-[10px] text-gaffer-orange font-black uppercase tracking-widest hover:underline"
                     >
                       Buy more coins &rarr;
                     </button>
                   )}
                   {activeGameweek && (
                     <button
                       onClick={() => activateMutation.mutate(selectedChip.chipType)}
                       disabled={activateMutation.isPending || !activeGameweek}
                       className="w-full h-14 rounded-[24px] bg-white/5 border border-white/10 text-white font-chakra font-black text-sm uppercase tracking-[0.2em] active:scale-95 transition-all disabled:opacity-50"
                     >
                       {activateMutation.isPending ? 'Activating...' : `Activate for GW${activeGameweek.number}`}
                     </button>
                   )}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}


