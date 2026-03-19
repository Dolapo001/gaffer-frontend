'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Rocket, CheckCircle2, AlertCircle, ChevronRight, DollarSign } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getFantasySeason, 
  enableFantasy, 
  getTeamPricing,
  finalizeAllPricing
} from '@/lib/services/fantasy.service'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'

interface Props {
  competitionId: string
}

export function FantasyAdminPanel({ competitionId }: Props) {
  const router = useRouter()
  const qc = useQueryClient()
  const toast = useToastStore()
  const [isEnabling, setIsEnabling] = useState(false)

  const { data: season, isLoading: isLoadingSeason } = useQuery({
    queryKey: ['fantasy-season', competitionId],
    queryFn: () => getFantasySeason(competitionId),
    retry: false
  })

  const { data: teamPricing } = useQuery({
    queryKey: ['team-pricing', competitionId],
    queryFn: () => getTeamPricing(competitionId),
    enabled: !!season
  })

  const enableMutation = useMutation({
    mutationFn: (budget: number) => enableFantasy(competitionId, budget),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fantasy-season', competitionId] })
      toast.addToast('Fantasy enabled', 'success')
      setIsEnabling(false)
    },
    onError: (err) => toast.addToast(getErrorMessage(err), 'error')
  })

  const finalizeAllMutation = useMutation({
    mutationFn: () => finalizeAllPricing(competitionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fantasy-season', competitionId] })
      toast.addToast('Global pricing finalized', 'success')
    },
    onError: (err) => toast.addToast(getErrorMessage(err), 'error')
  })

  if (isLoadingSeason) return <div className="p-10 text-center animate-pulse text-gaffer-muted">Loading Fantasy...</div>

  if (!season) {
    return (
      <div className="bg-gaffer-card border border-gaffer-border rounded-2xl p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-gaffer-orange/10 rounded-full flex items-center justify-center mx-auto">
          <Rocket size={40} className="text-gaffer-orange" />
        </div>
        <div>
          <h3 className="text-xl font-display font-bold text-white uppercase tracking-tight">Enable Fantasy</h3>
          <p className="text-gaffer-muted text-sm mt-2 max-w-sm mx-auto">
            Ready to turn this competition into a fantasy league? 
            Once enabled, you can set player prices and allow users to build squads.
          </p>
        </div>
        <button 
          onClick={() => enableMutation.mutate(100)} // Default 100M budget
          disabled={enableMutation.isPending}
          className="px-8 py-3 rounded-xl bg-orange-gradient-btn text-white font-display font-bold uppercase tracking-widest shadow-lg shadow-gaffer-orange/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {enableMutation.isPending ? 'Enabling...' : 'Initialize Fantasy'}
        </button>
      </div>
    )
  }

  const teams = (teamPricing as any)?.teams || []
  const allFinalized = teams.length > 0 && teams.every((t: any) => t.pricingFinalized)

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="bg-gaffer-card border border-gaffer-border rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${season.pricingFinalized ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-yellow-500 animate-pulse'}`} />
            <h3 className="font-display font-bold text-white uppercase tracking-tight">
              {season.pricingFinalized ? 'Market Open' : 'Pricing Phase'}
            </h3>
          </div>
          <p className="text-gaffer-muted text-xs">
            {season.pricingFinalized 
              ? 'Registration is open and users can buy players.' 
              : 'Complete team-level pricing to open the global market.'}
          </p>
        </div>

        {!season.pricingFinalized && (
          <button 
            disabled={!allFinalized || finalizeAllMutation.isPending}
            onClick={() => finalizeAllMutation.mutate()}
            className={`px-6 py-3 rounded-xl font-display font-bold text-xs uppercase tracking-widest transition-all ${
              allFinalized 
                ? 'bg-orange-gradient-btn text-white shadow-lg active:scale-95' 
                : 'bg-gaffer-surface text-gaffer-subtle border border-gaffer-border cursor-not-allowed'
            }`}
          >
            {finalizeAllMutation.isPending ? 'Processing...' : 'Finalize All Pricing'}
          </button>
        )}
      </div>

      {/* Team Pricing List */}
      <div className="space-y-3">
        <h4 className="text-gaffer-muted text-[10px] font-body uppercase tracking-widest px-2">Team Pricing Status</h4>
        <div className="grid grid-cols-1 gap-3">
          {teams.map((t: any, i: number) => (
            <motion.button 
              key={t.teamId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => router.push(`/admin/fantasy/${competitionId}/pricing/${t.teamId}`)}
              className="w-full bg-gaffer-card border border-gaffer-border rounded-2xl p-4 flex items-center gap-4 group hover:border-gaffer-orange/30 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-gaffer-surface flex items-center justify-center text-xl overflow-hidden">
                {t.logoUrl ? <img src={t.logoUrl} className="w-full h-full object-cover" /> : '⚽'}
              </div>
              
              <div className="flex-1 text-left">
                <p className="text-white font-display font-bold text-sm truncate uppercase tracking-tight">{t.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                   <div className="flex items-center gap-1 text-[10px] font-body">
                      {t.pricedCount === t.totalCount ? (
                        <span className="text-green-400 font-bold">ALL PRICED</span>
                      ) : (
                        <span className="text-gaffer-muted">{t.pricedCount}/{t.totalCount} PRICED</span>
                      )}
                   </div>
                   {t.pricingFinalized && (
                     <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded-full">
                        <CheckCircle2 size={8} className="text-green-400" />
                        <span className="text-[8px] font-black text-green-400 uppercase tracking-tighter italic">FINAL</span>
                     </div>
                   )}
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-gaffer-surface flex items-center justify-center text-gaffer-subtle group-hover:bg-gaffer-orange/10 group-hover:text-gaffer-orange transition-all">
                <ChevronRight size={16} />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}
