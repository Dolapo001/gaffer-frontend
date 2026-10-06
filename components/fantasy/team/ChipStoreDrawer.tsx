'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Sparkles, Zap, Clock, ShieldCheck, HelpCircle, X } from 'lucide-react'
import { listChips, purchaseChip, activateChip, type ChipType, type ChipInfo } from '@/lib/services/chip.service'
import { listGameweeks, getMyFantasyTeam } from '@/lib/services/fantasy.service'
import { useFantasyStore } from '@/store/fantasyStore'
import { useToastStore } from '@/store/toastStore'
import { useWallet } from '@/hooks/useWallet'
import { WalletPill } from '@/components/WalletPill'
import { getErrorMessage } from '@/lib/api'
import { formatCoins } from '@/lib/format'

const CHIP_LABELS: Record<string, string> = {
  wildcard: 'Wildcard',
  triple_captain: 'Triple Captain',
  bench_boost: 'Bench Boost',
  free_hit: 'Free Hit',
}

const CHIP_DESCRIPTIONS: Record<string, string> = {
  wildcard: 'Make unlimited transfers for one gameweek for free.',
  triple_captain: 'Your captain gains 3x points instead of 2x.',
  bench_boost: 'Points from your bench players are added to your total.',
  free_hit: 'Make unlimited transfers for ONE gameweek. Your squad reverts next GW.',
}

interface ChipStoreDrawerProps {
  competitionId: string
  onClose: () => void
}

export function ChipStoreDrawer({ competitionId, onClose }: ChipStoreDrawerProps) {
  const qc = useQueryClient()
  const toast = useToastStore()
  const setActiveChipType = useFantasyStore((s) => s.setActiveChipType)
  const [selectedChip, setSelectedChip] = useState<ChipInfo | null>(null)

  const { data: chipsData, isLoading: isLoadingChips } = useQuery({
    queryKey: ['chips', competitionId],
    queryFn: () => listChips(competitionId),
  })

  const chips = Array.isArray(chipsData) ? chipsData : chipsData?.chips

  const { data: wallet } = useWallet()

  const { data: gameweeks } = useQuery({
    queryKey: ['fantasy-gameweeks', competitionId],
    queryFn: () => listGameweeks(competitionId),
  })

  // The backend locks a gameweek by the clock (1h before its deadline) and never
  // flips lockStatus, so that flag alone can't say what is still open. The team's
  // editingGameweekId is the first gameweek that is genuinely open for changes.
  const { data: myTeam } = useQuery({
    queryKey: ['fantasy-team-editing', competitionId],
    queryFn: () => getMyFantasyTeam(competitionId),
    retry: false,
  })
  const editingGw = (gameweeks ?? []).find((gw) => gw._id === myTeam?.editingGameweekId)

  // ── Eligible Gameweeks for Chip Activation ──────────────────────────────
  // Exclude completed or locked gameweeks and anything before the open one.
  const eligibleGameweeks = (gameweeks ?? [])
    .filter((gw) => gw.completionStatus !== 'completed' && gw.lockStatus !== 'locked')
    .filter((gw) => !editingGw || gw.gameweekNumber >= editingGw.gameweekNumber)
    .sort((a, b) => a.gameweekNumber - b.gameweekNumber)

  const [targetGameweekId, setTargetGameweekId] = useState<string | null>(null)

  useEffect(() => {
    if (eligibleGameweeks.length > 0 && !targetGameweekId) {
      setTargetGameweekId(eligibleGameweeks[0]._id)
    }
  }, [eligibleGameweeks, targetGameweekId])

  const selectedTargetGw = eligibleGameweeks.find((gw) => gw._id === targetGameweekId) ?? eligibleGameweeks[0]

  // ── Auto-claim the free first Bench Boost when inventory is missing ───────
  const benchBoostInfo = chips?.find((c) => c.chipType === 'bench_boost')
  useEffect(() => {
    if (!isLoadingChips && chips !== undefined && !benchBoostInfo) {
      purchaseChip(competitionId, 'bench_boost')
        .then(() => qc.invalidateQueries({ queryKey: ['chips', competitionId] }))
        .catch(() => {}) // silent — already at max or other server-side guard
    }
  }, [isLoadingChips, chips, benchBoostInfo, competitionId, qc])

  const buyMutation = useMutation({
    mutationFn: (chipType: ChipType) => purchaseChip(competitionId, chipType),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['chips', competitionId] })
      qc.invalidateQueries({ queryKey: ['wallet'] })
      toast.addToast(`Success! You purchased a ${CHIP_LABELS[data.inventory.chipType]} chip.`, 'success')
      setSelectedChip(null)
    },
    onError: (err) => toast.addToast(getErrorMessage(err), 'error'),
  })

  const activateMutation = useMutation({
    mutationFn: (chipType: ChipType) => {
      if (!selectedTargetGw) throw new Error('No valid target gameweek selected')
      return activateChip(competitionId, chipType, selectedTargetGw._id)
    },
    onSuccess: (_, chipType) => {
      qc.invalidateQueries({ queryKey: ['chips', competitionId] })
      setActiveChipType(chipType)
      toast.addToast(`Chip activated for Gameweek ${selectedTargetGw?.gameweekNumber ?? ''}!`, 'success')
      setSelectedChip(null)
    },
    onError: (err) => toast.addToast(getErrorMessage(err), 'error'),
  })

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] flex items-end"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full bg-gaffer-surface border-t border-gaffer-border rounded-t-[2.5rem] max-w-md md:max-w-xl lg:max-w-2xl mx-auto shadow-2xl mt-auto overflow-y-auto"
          style={{ maxHeight: '88dvh' }}
        >
          <div className="flex items-center gap-4 px-6 pt-6 pb-4 sticky top-0 bg-gaffer-surface z-10">
            <div className="flex-1">
              <h1 className="text-lg font-chakra font-black uppercase tracking-tight text-white">Tactical Center</h1>
              <p className="text-[10px] text-gaffer-muted font-chakra font-bold uppercase tracking-[2px]">Inventory &amp; Store</p>
            </div>
            <WalletPill />
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/40">
              <X size={18} />
            </button>
          </div>

          <div className="px-6 pb-10 space-y-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-chakra font-black uppercase tracking-[0.2em] text-white/40">My Tactical Reserve</h3>
                <span className="text-[10px] bg-gaffer-orange/10 text-gaffer-orange px-2 py-0.5 rounded font-chakra font-black uppercase">Season Use Only</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {isLoadingChips ? (
                  [1, 2].map((i) => <div key={i} className="h-32 bg-white/5 rounded-[24px] animate-pulse" />)
                ) : (
                  chips?.filter((c) => c.remaining > 0).map((chip) => (
                    <div key={chip.chipType} className={`bg-gaffer-card border border-white/5 rounded-[24px] p-5 flex flex-col gap-3 relative ${chip.available === false ? 'opacity-50' : ''}`}>
                      <div className="absolute top-0 right-0 p-3">
                        <div className="w-8 h-8 rounded-full bg-gaffer-orange/10 flex items-center justify-center font-chakra font-black text-gaffer-orange text-xs">
                          x{chip.remaining}
                        </div>
                      </div>
                      <Zap size={24} className="text-gaffer-orange" />
                      <div>
                        <h4 className="font-chakra font-black text-sm uppercase tracking-tight text-white">{CHIP_LABELS[chip.chipType]}</h4>
                        <p className="text-[9px] text-white/30 font-bold uppercase leading-tight mt-1">{CHIP_DESCRIPTIONS[chip.chipType]}</p>
                      </div>
                      {chip.available === false && (
                        <div className="text-[9px] text-white/60 font-chakra font-black uppercase mt-1">Coming soon: can&apos;t be played yet</div>
                      )}
                      {chip.available !== false && chip.cooldown.active && (
                        <div className="flex items-center gap-1.5 text-[9px] text-yellow-500 font-chakra font-black uppercase mt-1">
                          <Clock size={10} /> GW {chip.cooldown.nextAvailableGameweek}
                        </div>
                      )}
                    </div>
                  ))
                )}
                {chips?.every((c) => c.remaining === 0) && (
                  <div className="col-span-2 py-10 text-center bg-white/5 rounded-[24px] border border-dashed border-white/10">
                    <ShieldCheck size={32} className="mx-auto text-white/10 mb-2" />
                    <p className="text-[10px] text-white/40 font-chakra font-black uppercase tracking-widest">No chips in reserve</p>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[11px] font-chakra font-black uppercase tracking-[0.2em] text-white/40">Operational Store</h3>
              <div className="space-y-3">
                {chips?.map((chip) => chip.available === false ? (
                  // Not applied by scoring yet: shown greyed, no details / buy
                  <div
                    key={chip.chipType}
                    aria-disabled="true"
                    className="w-full bg-gaffer-card border border-white/5 rounded-[28px] p-6 flex items-center justify-between opacity-50 cursor-not-allowed"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5">
                        <Sparkles size={24} className="text-white/30" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-chakra font-black text-base text-white uppercase tracking-tight">{CHIP_LABELS[chip.chipType]}</h4>
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{formatCoins(chip.price.coins)}</p>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 bg-white/10 text-white/70 rounded-xl font-chakra font-black text-[10px] uppercase">Coming soon</div>
                  </div>
                ) : (
                  <button
                    key={chip.chipType}
                    onClick={() => setSelectedChip(chip)}
                    className="w-full bg-gaffer-card border border-white/5 rounded-[28px] p-6 flex items-center justify-between hover:border-gaffer-orange/40 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${chip.price.coins === 0 ? 'bg-green-500/10' : 'bg-white/5'}`}>
                        <Sparkles size={24} className={chip.price.coins === 0 ? 'text-green-500' : 'text-white/40'} />
                      </div>
                      <div className="text-left">
                        <h4 className="font-chakra font-black text-base text-white uppercase tracking-tight">{CHIP_LABELS[chip.chipType]}</h4>
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                          {chip.price.coins === 0 ? 'Free Starter' : formatCoins(chip.price.coins)}
                        </p>
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

            <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 flex items-start gap-4">
              <HelpCircle className="text-gaffer-orange shrink-0" size={20} />
              <div className="space-y-2">
                <h5 className="font-chakra font-black text-xs uppercase tracking-widest text-white">Tactical Brief</h5>
                <p className="text-[10px] text-white/40 font-medium leading-relaxed">
                  Chips allow you to gain a tactical advantage. Wildcards and Free Hits are best used during double gameweeks. Triple Captain should be saved for your top performer against weak opposition.
                </p>
              </div>
            </div>
          </div>

          {/* Purchase / activate dialog */}
          <AnimatePresence>
            {selectedChip && (
              <div className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center p-0 sm:p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                  onClick={() => setSelectedChip(null)}
                />
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  className="relative w-full max-w-lg bg-gaffer-card rounded-t-[40px] sm:rounded-[32px] p-8 border-t border-white/10 space-y-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-chakra font-black uppercase text-white tracking-tighter">{CHIP_LABELS[selectedChip.chipType]}</h2>
                      <p className="text-xs text-gaffer-orange font-bold uppercase tracking-widest">
                        {selectedChip.price.coins === 0 ? 'FREE' : formatCoins(selectedChip.price.coins)}
                      </p>
                    </div>
                    <button onClick={() => setSelectedChip(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/30">
                      <X size={20} />
                    </button>
                  </div>

                  <p className="text-sm text-white/60 leading-relaxed">{CHIP_DESCRIPTIONS[selectedChip.chipType]}</p>

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

                  {/* Gameweek Selector for Chip Activation */}
                  {eligibleGameweeks.length > 0 ? (
                    <div className="bg-white/5 p-4 rounded-2xl space-y-2 border border-white/10">
                      <label className="text-[10px] text-gaffer-orange font-chakra font-black uppercase tracking-widest block">
                        Target Gameweek
                      </label>
                      <select
                        value={selectedTargetGw?._id ?? ''}
                        onChange={(e) => setTargetGameweekId(e.target.value)}
                        className="w-full bg-gaffer-surface border border-white/20 rounded-xl px-3 py-2 text-white font-chakra font-bold text-sm focus:outline-none focus:border-gaffer-orange"
                      >
                        {eligibleGameweeks.map((gw) => (
                          <option key={gw._id} value={gw._id} className="bg-gaffer-surface text-white">
                            Gameweek {gw.gameweekNumber} ({gw.lockStatus === 'open' ? 'Open' : 'Upcoming'})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-center">
                      <span className="text-red-400 text-xs font-chakra font-bold">No open gameweeks available for activation</span>
                    </div>
                  )}

                  <div className="pt-2 space-y-3">
                    <button
                      onClick={() => buyMutation.mutate(selectedChip.chipType)}
                      disabled={buyMutation.isPending || selectedChip.price.coins > (wallet?.balance ?? 0)}
                      className="w-full h-16 rounded-[24px] bg-orange-gradient-btn text-white font-chakra font-black text-sm uppercase tracking-[0.2em] shadow-orange-glow disabled:opacity-50"
                    >
                      {buyMutation.isPending
                        ? 'Processing...'
                        : selectedChip.price.coins > (wallet?.balance ?? 0)
                          ? 'Insufficient Coins'
                          : 'Confirm Purchase'}
                    </button>
                    {selectedTargetGw && (
                      <button
                        onClick={() => activateMutation.mutate(selectedChip.chipType)}
                        disabled={activateMutation.isPending || !selectedTargetGw}
                        className="w-full h-14 rounded-[24px] bg-white/5 border border-white/10 text-white font-chakra font-black text-sm uppercase tracking-[0.2em] hover:bg-white/10 transition-all disabled:opacity-50"
                      >
                        {activateMutation.isPending ? 'Activating...' : `Activate for GW${selectedTargetGw.gameweekNumber}`}
                      </button>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
