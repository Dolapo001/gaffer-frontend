'use client'

import { useWallet } from '@/hooks/useWallet'
import { formatCoins } from '@/lib/format'

export function WalletPill({ className = '' }: { className?: string }) {
  const { data: wallet } = useWallet()

  return (
    <div className={`bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2 ${className}`}>
      <span className="text-[14px] font-chakra font-black">{formatCoins(wallet?.balance ?? 0)}</span>
    </div>
  )
}
