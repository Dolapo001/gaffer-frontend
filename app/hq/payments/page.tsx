'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { hqService } from '@/lib/services/hq.service'
import { Pager, Pill } from '@/components/hq/ui'

const naira = (n: number) => `₦${n.toLocaleString()}`

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl bg-gaffer-card border border-gaffer-border p-4">
      <p className="text-xs uppercase tracking-wider text-gaffer-muted font-body">{label}</p>
      <p className="font-chakra font-bold text-2xl text-white mt-1">{value}</p>
      {hint && <p className="text-xs text-gaffer-muted font-body mt-1">{hint}</p>}
    </div>
  )
}

function RevenueChart({ data }: { data: { date: string; naira: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.naira))
  const w = 600
  const h = 120
  const bar = w / data.length
  return (
    <svg viewBox={`0 0 ${w} ${h + 20}`} role="img" aria-label="Revenue per day, last 30 days" className="w-full h-auto">
      {data.map((d, i) => {
        const bh = (d.naira / max) * h
        return <rect key={d.date} x={i * bar + 2} y={h - bh} width={bar - 4} height={Math.max(bh, d.naira ? 2 : 0)} rx={2} className="fill-gaffer-orange"><title>{`${d.date}: ${naira(d.naira)}`}</title></rect>
      })}
      <line x1={0} y1={h} x2={w} y2={h} className="stroke-gaffer-border" />
      <text x={0} y={h + 15} className="fill-gaffer-muted" fontSize={11}>{data[0]?.date}</text>
      <text x={w} y={h + 15} textAnchor="end" className="fill-gaffer-muted" fontSize={11}>{data[data.length - 1]?.date}</text>
    </svg>
  )
}

const TONE = { paid: 'good', pending: 'warn', failed: 'bad' } as const

export default function HqPaymentsPage() {
  const [tab, setTab] = useState<'purchases' | 'coins'>('purchases')
  const [status, setStatus] = useState('')
  const [source, setSource] = useState('')
  const [page, setPage] = useState(1)
  const summary = useQuery({ queryKey: ['hq', 'payments', 'summary'], queryFn: hqService.paymentsSummary })
  const purchases = useQuery({ queryKey: ['hq', 'payments', 'purchases', status, page], queryFn: () => hqService.paymentsPurchases({ status: status || undefined, page }), enabled: tab === 'purchases' })
  const txs = useQuery({ queryKey: ['hq', 'payments', 'transactions', source, page], queryFn: () => hqService.paymentsTransactions({ source: source || undefined, page }), enabled: tab === 'coins' })

  const s = summary.data
  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="font-display font-extrabold text-3xl">Payments and coins</h1>

      {summary.isLoading ? <p className="text-gaffer-muted font-body">Loading…</p> : !s ? <p role="alert" className="text-red-400 font-body">Could not load the figures.</p> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Revenue" value={naira(s.revenueNaira)} hint={`${s.paidPurchases} paid ${s.paidPurchases === 1 ? 'purchase' : 'purchases'}`} />
            <Stat label="Coins sold" value={s.coinsSold.toLocaleString()} />
            <Stat label="Coins in wallets" value={s.coinsInWallets.toLocaleString()} hint={`${s.walletsWithCoins} wallets`} />
            <Stat label="Spent on chips" value={s.coinsSpentOnChips.toLocaleString()} hint={`${s.chipsBought} chips bought`} />
            <Stat label="Pending" value={s.pendingPurchases} hint="Started but not paid" />
            <Stat label="Failed" value={s.failedPurchases} />
          </div>
          <div className="rounded-2xl bg-gaffer-card border border-gaffer-border p-4">
            <p className="text-sm font-body text-gaffer-muted mb-2">Revenue per day</p>
            <RevenueChart data={s.revenueByDay} />
          </div>
        </>
      )}

      <div role="tablist" aria-label="Payment lists" className="flex gap-1">
        {([['purchases', 'Coin purchases'], ['coins', 'Every coin movement']] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => { setTab(id); setPage(1) }} className={`rounded-xl px-3 py-1.5 text-sm font-body font-semibold ${tab === id ? 'bg-gaffer-card text-white border border-gaffer-orange' : 'text-gaffer-muted border border-transparent hover:text-white'}`}>{label}</button>
        ))}
      </div>

      {tab === 'purchases' ? (
        <div className="space-y-3">
          <select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="rounded-xl bg-gaffer-surface border border-gaffer-border px-3 py-2 font-body text-white">
            <option value="">All</option><option value="paid">Paid</option><option value="pending">Pending</option><option value="failed">Failed</option>
          </select>
          {purchases.isLoading ? <p className="text-gaffer-muted font-body">Loading…</p> : !purchases.data || purchases.data.purchases.length === 0 ? <p className="text-gaffer-muted font-body">No purchases.</p> : (
            <ul className="space-y-2">
              {purchases.data.purchases.map((p) => (
                <li key={p.id} className="rounded-2xl bg-gaffer-card border border-gaffer-border p-3 flex items-center justify-between gap-3 font-body text-sm">
                  <span className="min-w-0"><span className="block font-semibold truncate">{p.user?.email ?? 'Unknown user'}</span><span className="block text-xs text-gaffer-muted">{p.coins} coins · {naira(p.amountNaira)} · {new Date(p.createdAt).toLocaleString()}</span></span>
                  <Pill label={p.status} tone={TONE[p.status]} />
                </li>
              ))}
            </ul>
          )}
          {purchases.data && <Pager page={page} total={purchases.data.total} pageSize={purchases.data.pageSize} onPage={setPage} />}
        </div>
      ) : (
        <div className="space-y-3">
          <select aria-label="Filter by kind" value={source} onChange={(e) => { setSource(e.target.value); setPage(1) }} className="rounded-xl bg-gaffer-surface border border-gaffer-border px-3 py-2 font-body text-white">
            <option value="">All</option><option value="coin_purchase">Coin purchases</option><option value="chip_purchase">Chip purchases</option><option value="chip_refund">Chip refunds</option><option value="hq_adjustment">HQ changes</option>
          </select>
          {txs.isLoading ? <p className="text-gaffer-muted font-body">Loading…</p> : !txs.data || txs.data.transactions.length === 0 ? <p className="text-gaffer-muted font-body">Nothing yet.</p> : (
            <ul className="space-y-2">
              {txs.data.transactions.map((t) => (
                <li key={t.id} className="rounded-2xl bg-gaffer-card border border-gaffer-border p-3 flex items-center justify-between gap-3 font-body text-sm">
                  <span className="min-w-0"><span className="block font-semibold truncate">{t.user?.email ?? 'Unknown user'}</span><span className="block text-xs text-gaffer-muted">{t.source.replace('_', ' ')} · balance after {t.balanceAfter} · {new Date(t.createdAt).toLocaleString()}</span></span>
                  <span className={`font-chakra font-bold ${t.type === 'credit' ? 'text-green-300' : 'text-red-300'}`}>{t.type === 'credit' ? '+' : '−'}{t.coins}</span>
                </li>
              ))}
            </ul>
          )}
          {txs.data && <Pager page={page} total={txs.data.total} pageSize={txs.data.pageSize} onPage={setPage} />}
        </div>
      )}
    </div>
  )
}
