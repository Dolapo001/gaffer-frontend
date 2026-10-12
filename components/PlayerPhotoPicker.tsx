'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
import { initialsOf } from '@/lib/playerDisplay'

const MAX_BYTES = 8 * 1024 * 1024

interface Props {
  /** The name typed so far: its initials show until a photo is chosen */
  name: string
  file: File | null
  onChange: (file: File | null) => void
}

/**
 * An optional photo for a registration form. Without one, the player's initials are used everywhere, so nobody
 * has to add a picture to register.
 */
export function PlayerPhotoPicker({ name, file, onChange }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!file) { setPreview(null); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { setError('Use a JPG, PNG or WebP photo.'); return }
    if (f.size > MAX_BYTES) { setError('That photo is too big. Choose one under 8 MB.'); return }
    setError(null)
    onChange(f)
  }

  return (
    <div className="flex items-center gap-4">
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pick} aria-label="Choose a photo" />
      <div className="relative flex-shrink-0">
        <button
          type="button"
          onClick={() => input.current?.click()}
          aria-label={file ? 'Change photo' : 'Add a photo'}
          className="w-20 h-20 rounded-full overflow-hidden bg-[#1C1F2D] border-2 border-dashed border-white/20 hover:border-orange-400/60 transition-colors flex items-center justify-center"
        >
          {preview ? (
            <img src={preview} alt="" className="w-full h-full object-cover object-top" />
          ) : (
            <span className="text-white/40 font-black text-2xl select-none">{initialsOf(name)}</span>
          )}
        </button>
        {file && (
          <button type="button" aria-label="Remove photo" onClick={() => onChange(null)} className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center shadow-lg">
            <X size={12} className="text-white" />
          </button>
        )}
      </div>
      <div className="min-w-0">
        <button type="button" onClick={() => input.current?.click()} className="inline-flex items-center gap-2 text-sm font-semibold text-orange-400 hover:text-orange-300">
          <Camera size={16} />
          {file ? 'Change photo' : 'Add a photo'}
        </button>
        <p className="text-xs text-white/40 mt-1">Optional. Without one, your initials are shown.</p>
        {error && <p role="alert" className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
    </div>
  )
}
