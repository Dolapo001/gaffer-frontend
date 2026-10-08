'use client'

import { useState } from 'react'
import { ApiError } from '@/lib/api'

export const errorText = (e: unknown) => (e instanceof ApiError ? e.message : 'Something went wrong. Try again.')

export function Pager({ page, total, pageSize, onPage }: { page: number; total: number; pageSize: number; onPage: (p: number) => void }) {
  const pages = Math.ceil(total / pageSize)
  if (pages <= 1) return null
  return (
    <div className="flex items-center gap-3 font-body text-sm">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="px-3 py-1.5 rounded-xl border border-gaffer-border disabled:opacity-40">Previous</button>
      <span className="text-gaffer-muted">Page {page} of {pages}</span>
      <button disabled={page >= pages} onClick={() => onPage(page + 1)} className="px-3 py-1.5 rounded-xl border border-gaffer-border disabled:opacity-40">Next</button>
    </div>
  )
}

export function Pill({ label, tone }: { label: string; tone: 'good' | 'warn' | 'bad' | 'neutral' }) {
  const cls =
    tone === 'good' ? 'text-green-300 border-green-500/40'
    : tone === 'warn' ? 'text-yellow-300 border-yellow-500/40'
    : tone === 'bad' ? 'text-red-300 border-red-500/40'
    : 'text-gaffer-muted border-gaffer-border'
  return <span className={`text-xs font-body font-semibold border rounded-full px-2 py-0.5 ${cls}`}>{label}</span>
}

/** A button styled like the rest of HQ. */
export function ActionButton({ label, onClick, tone, disabled }: { label: string; onClick: () => void; tone?: 'good' | 'bad'; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-2 rounded-xl text-sm font-body font-semibold border disabled:opacity-50 ${
        tone === 'good' ? 'bg-green-500/15 border-green-500/40 text-green-300'
        : tone === 'bad' ? 'bg-red-500/15 border-red-500/40 text-red-300'
        : 'border-gaffer-border text-white hover:bg-gaffer-card'
      }`}
    >
      {label}
    </button>
  )
}

/** Asks for a short written reason (optional or required) before doing something. */
export function ReasonDialog({
  title, confirmLabel, required, busy, error, onCancel, onConfirm,
}: { title: string; confirmLabel: string; required: boolean; busy: boolean; error: string | null; onCancel: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end md:items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-md bg-gaffer-surface border border-gaffer-border rounded-3xl p-5 space-y-3">
        <h3 className="font-display font-bold text-xl">{title}</h3>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} placeholder={required ? 'Reason' : 'Reason (optional)'} aria-label="Reason" className="w-full rounded-xl bg-gaffer-bg border border-gaffer-border px-3 py-2 font-body text-white" />
        {error && <p role="alert" className="text-sm text-red-400 font-body">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl font-body text-gaffer-muted hover:text-white">Cancel</button>
          <button onClick={() => onConfirm(reason)} disabled={busy || (required && !reason.trim())} className="px-4 py-2 rounded-xl bg-gaffer-orange text-black font-display font-bold disabled:opacity-50">{busy ? 'Working…' : confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

/** For actions that cannot be undone: the person must type the exact name first. */
export function TypeNameDialog({
  title, warning, name, confirmLabel, busy, error, onCancel, onConfirm,
}: { title: string; warning: string; name: string; confirmLabel: string; busy: boolean; error: string | null; onCancel: () => void; onConfirm: (typed: string) => void }) {
  const [typed, setTyped] = useState('')
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end md:items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-md bg-gaffer-surface border border-red-500/40 rounded-3xl p-5 space-y-3">
        <h3 className="font-display font-bold text-xl text-red-200">{title}</h3>
        <p className="text-sm font-body text-gaffer-muted">{warning}</p>
        <label className="block text-sm font-body text-gaffer-muted">Type <b className="text-white">{name}</b> to confirm
          <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" className="mt-1 w-full rounded-xl bg-gaffer-bg border border-gaffer-border px-3 py-2 font-body text-white" />
        </label>
        {error && <p role="alert" className="text-sm text-red-400 font-body">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl font-body text-gaffer-muted hover:text-white">Cancel</button>
          <button onClick={() => onConfirm(typed)} disabled={busy || typed.trim() !== name} className="px-4 py-2 rounded-xl bg-red-500 text-white font-display font-bold disabled:opacity-40">{busy ? 'Deleting…' : confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
