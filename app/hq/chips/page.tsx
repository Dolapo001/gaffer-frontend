'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { hqService, type ChipLayer, type ChipRules, type ChipType } from '@/lib/services/hq.service'
import { ApiError } from '@/lib/api'

const CHIP_LABEL: Record<ChipType, string> = {
  bench_boost: 'Bench Boost',
  triple_captain: 'Triple Captain',
  wildcard: 'Wildcard',
  free_hit: 'Free Hit',
}
const ORDER: ChipType[] = ['bench_boost', 'triple_captain', 'wildcard', 'free_hit']

const errorText = (e: unknown) => (e instanceof ApiError ? e.message : 'Something went wrong. Try again.')
const num = 'w-20 rounded-lg bg-gaffer-bg border border-gaffer-border px-2 py-1 font-body text-white'
const card = 'rounded-2xl bg-gaffer-card border border-gaffer-border p-4 space-y-4'

/** Rules as the form edits them: numbers become strings while typing. */
interface Form {
  purchasesEnabled: boolean
  onJoin: boolean
  atGameweek: string
  chips: Record<ChipType, { available: boolean; freeGranted: string; coins: string; max: string; cooldown: string }>
}

function toForm(r: ChipRules): Form {
  return {
    purchasesEnabled: r.purchasesEnabled,
    onJoin: r.grants.onJoin,
    atGameweek: r.grants.atGameweek ? String(r.grants.atGameweek) : '',
    chips: Object.fromEntries(
      ORDER.map((t) => [t, { available: r.chips[t].available, freeGranted: String(r.chips[t].freeGranted), coins: String(r.chips[t].coins), max: String(r.chips[t].max), cooldown: String(r.chips[t].cooldown) }])
    ) as Form['chips'],
  }
}

const toInt = (s: string) => (s.trim() === '' ? undefined : Number(s))

/** The form as a rules layer. With a `base`, only what differs from it is kept, so everything else keeps inheriting. */
function toLayer(f: Form, base?: ChipRules): ChipLayer {
  const layer: ChipLayer = { chips: {} }
  if (!base || f.purchasesEnabled !== base.purchasesEnabled) layer.purchasesEnabled = f.purchasesEnabled
  const at = f.atGameweek.trim() === '' ? null : Number(f.atGameweek)
  const grants: NonNullable<ChipLayer['grants']> = {}
  if (!base || f.onJoin !== base.grants.onJoin) grants.onJoin = f.onJoin
  if (!base || at !== base.grants.atGameweek) grants.atGameweek = at
  if (Object.keys(grants).length) layer.grants = grants
  for (const t of ORDER) {
    const c = f.chips[t]
    const next = { available: c.available, freeGranted: toInt(c.freeGranted), coins: toInt(c.coins), max: toInt(c.max), cooldown: toInt(c.cooldown) }
    const diff: Record<string, number | boolean> = {}
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined) continue
      if (!base || base.chips[t][k as keyof typeof next] !== v) diff[k] = v
    }
    if (Object.keys(diff).length) (layer.chips as Record<string, unknown>)[t] = diff
  }
  if (!Object.keys(layer.chips ?? {}).length) delete layer.chips
  return layer
}

function RulesForm({ form, setForm, scope }: { form: Form; setForm: (f: Form) => void; scope: 'global' | 'tournament' }) {
  const set = (t: ChipType, k: keyof Form['chips'][ChipType], v: string | boolean) => setForm({ ...form, chips: { ...form.chips, [t]: { ...form.chips[t], [k]: v } } })
  return (
    <div className="space-y-4">
      <label className="flex items-start gap-2 font-body text-sm">
        <input type="checkbox" className="mt-1" checked={form.purchasesEnabled} onChange={(e) => setForm({ ...form, purchasesEnabled: e.target.checked })} />
        <span>
          <b>Players can buy chips with coins.</b>
          <span className="block text-gaffer-muted">Turn this off while payments are not ready. Free chips still work.</span>
        </span>
      </label>

      <fieldset className="space-y-2">
        <legend className="font-display font-bold">When free chips are given</legend>
        <label className="flex items-center gap-2 font-body text-sm">
          <input type="checkbox" checked={form.onJoin} onChange={(e) => setForm({ ...form, onJoin: e.target.checked })} /> When a player joins the tournament
        </label>
        <label className="flex items-center gap-2 font-body text-sm">
          Another batch when the tournament reaches gameweek
          <input aria-label="Gameweek for the second batch" type="number" min={1} max={60} placeholder="off" value={form.atGameweek} onChange={(e) => setForm({ ...form, atGameweek: e.target.value })} className={num} />
        </label>
      </fieldset>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-body text-sm">
          <thead className="text-gaffer-muted">
            <tr>
              <th className="pr-3 py-1 font-semibold">Chip</th>
              <th className="pr-3 font-semibold">Can be used</th>
              <th className="pr-3 font-semibold">Free chips given</th>
              <th className="pr-3 font-semibold">Coin price</th>
              <th className="pr-3 font-semibold">Most per season</th>
              <th className="font-semibold">Wait between uses (gameweeks)</th>
            </tr>
          </thead>
          <tbody>
            {ORDER.map((t) => (
              <tr key={t} className="border-t border-gaffer-border">
                <th scope="row" className="pr-3 py-2 font-semibold">{CHIP_LABEL[t]}</th>
                <td className="pr-3"><input type="checkbox" aria-label={`${CHIP_LABEL[t]} can be used`} checked={form.chips[t].available} onChange={(e) => set(t, 'available', e.target.checked)} /></td>
                <td className="pr-3"><input aria-label={`${CHIP_LABEL[t]} free chips`} type="number" min={0} max={10} value={form.chips[t].freeGranted} onChange={(e) => set(t, 'freeGranted', e.target.value)} className={num} /></td>
                <td className="pr-3"><input aria-label={`${CHIP_LABEL[t]} coin price`} type="number" min={0} value={form.chips[t].coins} onChange={(e) => set(t, 'coins', e.target.value)} className={num} /></td>
                <td className="pr-3"><input aria-label={`${CHIP_LABEL[t]} season maximum`} type="number" min={0} max={20} value={form.chips[t].max} onChange={(e) => set(t, 'max', e.target.value)} className={num} /></td>
                <td><input aria-label={`${CHIP_LABEL[t]} wait between uses`} type="number" min={0} max={30} value={form.chips[t].cooldown} onChange={(e) => set(t, 'cooldown', e.target.value)} className={num} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {scope === 'global' && <p className="text-xs font-body text-gaffer-muted">A price of 0 makes the chip free for everyone to take.</p>}
    </div>
  )
}

function GlobalRules() {
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['hq', 'chips'], queryFn: hqService.getChips })
  const [form, setForm] = useState<Form | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => { if (data) setForm(toForm(data.effective)) }, [data])

  const save = useMutation({
    mutationFn: () => hqService.setChipsGlobal(toLayer(form!)),
    onSuccess: () => { setMsg({ ok: true, text: 'Saved. It applies to every tournament that has no override of its own.' }); qc.invalidateQueries({ queryKey: ['hq', 'chips'] }) },
    onError: (e) => setMsg({ ok: false, text: errorText(e) }),
  })

  if (!form) return <p className="text-gaffer-muted font-body">Loading…</p>
  return (
    <form onSubmit={(e) => { e.preventDefault(); setMsg(null); save.mutate() }} className={card}>
      <h2 className="font-display font-bold text-xl">Rules for every tournament</h2>
      <RulesForm form={form} setForm={setForm} scope="global" />
      {msg && <p role={msg.ok ? 'status' : 'alert'} className={`text-sm font-body ${msg.ok ? 'text-green-300' : 'text-red-400'}`}>{msg.text}</p>}
      <button type="submit" disabled={save.isPending} className="px-4 py-2 rounded-xl bg-gaffer-orange text-black font-display font-bold disabled:opacity-50">{save.isPending ? 'Saving…' : 'Save rules'}</button>
    </form>
  )
}

function TournamentOverride() {
  const qc = useQueryClient()
  const { data: all } = useQuery({ queryKey: ['hq', 'chips'], queryFn: hqService.getChips })
  const [id, setId] = useState('')
  const { data } = useQuery({ queryKey: ['hq', 'chips', 'competition', id], queryFn: () => hqService.getChipsForCompetition(id), enabled: !!id })
  const [form, setForm] = useState<Form | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => { if (data) setForm(toForm(data.effective)) }, [data])
  useEffect(() => { setForm(null); setMsg(null) }, [id])

  const refresh = () => { qc.invalidateQueries({ queryKey: ['hq', 'chips'] }) }
  const save = useMutation({
    // keep only what differs from the global rules, so the rest keeps following them
    mutationFn: () => hqService.setChipsForCompetition(id, toLayer(form!, all!.effective)),
    onSuccess: () => { setMsg({ ok: true, text: 'Saved for this tournament only.' }); refresh() },
    onError: (e) => setMsg({ ok: false, text: errorText(e) }),
  })
  const reset = useMutation({
    mutationFn: () => hqService.clearChipsForCompetition(id),
    onSuccess: () => { setMsg({ ok: true, text: 'This tournament now follows the rules for every tournament.' }); refresh() },
    onError: (e) => setMsg({ ok: false, text: errorText(e) }),
  })

  return (
    <section className={card} aria-labelledby="ov-h">
      <h2 id="ov-h" className="font-display font-bold text-xl">One tournament different</h2>
      <p className="text-sm font-body text-gaffer-muted">Pick a tournament and change only what should be different there. Everything else keeps following the rules above.</p>
      <label className="block font-body text-sm text-gaffer-muted">Tournament
        <select value={id} onChange={(e) => setId(e.target.value)} className="mt-1 w-full rounded-xl bg-gaffer-bg border border-gaffer-border px-3 py-2 text-white">
          <option value="">Choose…</option>
          {all?.competitions.map((c) => <option key={c.id} value={c.id}>{c.name}{c.hasOverride ? ' (has its own rules)' : ''}</option>)}
        </select>
      </label>
      {id && form && (
        <form onSubmit={(e) => { e.preventDefault(); setMsg(null); save.mutate() }} className="space-y-4">
          <RulesForm form={form} setForm={setForm} scope="tournament" />
          {msg && <p role={msg.ok ? 'status' : 'alert'} className={`text-sm font-body ${msg.ok ? 'text-green-300' : 'text-red-400'}`}>{msg.text}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={save.isPending} className="px-4 py-2 rounded-xl bg-gaffer-orange text-black font-display font-bold disabled:opacity-50">{save.isPending ? 'Saving…' : 'Save for this tournament'}</button>
            <button type="button" onClick={() => reset.mutate()} disabled={reset.isPending} className="px-3 py-2 font-body text-gaffer-muted hover:text-white">Use the rules for every tournament</button>
          </div>
        </form>
      )}
    </section>
  )
}

function GiveNow() {
  const { data: all } = useQuery({ queryKey: ['hq', 'chips'], queryFn: hqService.getChips })
  const [competitionId, setCompetitionId] = useState('')
  const [chipType, setChipType] = useState<ChipType>('triple_captain')
  const [count, setCount] = useState('')
  const [email, setEmail] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const give = useMutation({
    mutationFn: () => hqService.giveChips({ competitionId, chipType, count: toInt(count), email: email.trim() || undefined }),
    onSuccess: (r) => { setConfirming(false); setMsg({ ok: true, text: `Done. ${r.count} ${CHIP_LABEL[r.chipType]} given to ${r.players} ${r.players === 1 ? 'player' : 'players'}.` }) },
    onError: (e) => { setConfirming(false); setMsg({ ok: false, text: errorText(e) }) },
  })
  const comp = all?.competitions.find((c) => c.id === competitionId)
  const who = email.trim() ? email.trim() : 'everyone who joined'
  const field = 'mt-1 w-full rounded-xl bg-gaffer-bg border border-gaffer-border px-3 py-2 font-body text-white'

  return (
    <section className={card} aria-labelledby="give-h">
      <h2 id="give-h" className="font-display font-bold text-xl">Give chips now</h2>
      <p className="text-sm font-body text-gaffer-muted">Hand out chips straight away to one player, or to everyone in a tournament. Each gift is its own, so pressing it again gives more.</p>
      <form onSubmit={(e) => { e.preventDefault(); setMsg(null); setConfirming(true) }} className="grid md:grid-cols-2 gap-3">
        <label className="block font-body text-sm text-gaffer-muted">Tournament
          <select required value={competitionId} onChange={(e) => setCompetitionId(e.target.value)} className={field}>
            <option value="">Choose…</option>
            {all?.competitions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="block font-body text-sm text-gaffer-muted">Chip
          <select value={chipType} onChange={(e) => setChipType(e.target.value as ChipType)} className={field}>
            {ORDER.map((t) => <option key={t} value={t}>{CHIP_LABEL[t]}</option>)}
          </select>
        </label>
        <label className="block font-body text-sm text-gaffer-muted">How many (blank uses the free chips set above)
          <input type="number" min={1} max={10} value={count} onChange={(e) => setCount(e.target.value)} className={field} />
        </label>
        <label className="block font-body text-sm text-gaffer-muted">Player email (blank gives to everyone who joined)
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
        </label>
        <div className="md:col-span-2">
          <button type="submit" className="px-4 py-2 rounded-xl bg-gaffer-orange text-black font-display font-bold">Give chips…</button>
        </div>
      </form>
      {confirming && (
        <div role="dialog" aria-modal="true" aria-label="Confirm" className="rounded-xl border border-gaffer-orange/50 bg-gaffer-orange/10 p-3 space-y-2 font-body text-sm">
          <p>Give {count.trim() ? count : 'the free amount of'} {CHIP_LABEL[chipType]} to <b>{who}</b> in <b>{comp?.name}</b>?</p>
          <div className="flex gap-2">
            <button onClick={() => give.mutate()} disabled={give.isPending} className="px-3 py-1.5 rounded-xl bg-gaffer-orange text-black font-display font-bold disabled:opacity-50">{give.isPending ? 'Giving…' : 'Yes, give'}</button>
            <button onClick={() => setConfirming(false)} className="px-3 py-1.5 text-gaffer-muted hover:text-white">Cancel</button>
          </div>
        </div>
      )}
      {msg && <p role={msg.ok ? 'status' : 'alert'} className={`text-sm font-body ${msg.ok ? 'text-green-300' : 'text-red-400'}`}>{msg.text}</p>}
    </section>
  )
}

export default function HqChipsPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="font-display font-extrabold text-3xl">Chips</h1>
      <GlobalRules />
      <TournamentOverride />
      <GiveNow />
    </div>
  )
}
