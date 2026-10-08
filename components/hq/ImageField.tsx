'use client'

import { useRef, useState } from 'react'
import { hqService } from '@/lib/services/hq.service'
import { ApiError } from '@/lib/api'

/** Pick an image from the device, upload it, and show it. `value` is the uploaded image's address. */
export function ImageField({ value, onChange, label = 'Image' }: { value: string; onChange: (url: string) => void; label?: string }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pick = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const { imageUrl } = await hqService.uploadNewsImage(file)
      onChange(imageUrl)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'The upload did not work. Try a smaller image.')
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div>
      <span className="text-sm font-body text-gaffer-muted">{label}</span>
      {value ? (
        <div className="mt-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="max-h-48 rounded-xl border border-gaffer-border" />
          <button type="button" onClick={() => onChange('')} className="mt-2 text-sm font-body text-red-300 hover:text-red-200">Remove image</button>
        </div>
      ) : (
        <div className="mt-1">
          <input ref={input} type="file" accept="image/*" aria-label={label} onChange={(e) => pick(e.target.files?.[0])} className="block w-full text-sm font-body text-gaffer-muted file:mr-3 file:rounded-xl file:border-0 file:bg-gaffer-card file:px-4 file:py-2 file:text-white" />
          {busy && <p className="text-sm font-body text-gaffer-muted mt-1">Uploading…</p>}
        </div>
      )}
      {error && <p role="alert" className="text-sm font-body text-red-400 mt-1">{error}</p>}
    </div>
  )
}
