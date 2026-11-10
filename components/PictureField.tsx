'use client'

import { useRef, useState } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import { uploadOrgAsset } from '@/lib/services/org.service'
import { getErrorMessage, getImageUrl } from '@/lib/api'

const MAX_BYTES = 5 * 1024 * 1024

/**
 * Shows a team's or tournament's picture with Change and Remove. A new picture is uploaded as soon as it is
 * picked; `onChange` gets its address (or null when removed) and the form saves it with everything else.
 */
export function PictureField({ orgId, value, onChange, label, shape = 'round', fallback }: {
  orgId: string | undefined
  value: string | null
  onChange: (url: string | null) => void
  label: string
  shape?: 'round' | 'wide'
  fallback?: string
}) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pick = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setError('Use a JPG, PNG or WebP picture.')
    if (file.size > MAX_BYTES) return setError('That picture is over 5 MB. Pick a smaller one.')
    if (!orgId) return setError('Could not find your organisation. Reload the page and try again.')
    setBusy(true)
    try {
      const { url } = await uploadOrgAsset(orgId, file)
      onChange(url)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  const frame = shape === 'round' ? 'w-20 h-20 rounded-full' : 'w-full h-28 rounded-2xl'
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-display font-black text-gaffer-subtle uppercase tracking-widest ml-1">{label}</p>
      <div className={shape === 'round' ? 'flex items-center gap-4' : 'space-y-3'}>
        <div className={`${frame} shrink-0 overflow-hidden bg-[#11121C] border border-white/10 flex items-center justify-center`}>
          {value ? (
            <img src={getImageUrl(value)} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="font-display font-black text-white/30 text-lg">{fallback || <Camera size={20} />}</span>
          )}
        </div>
        <div className={shape === 'round' ? 'flex flex-col gap-2' : 'flex gap-2'}>
          <button type="button" onClick={() => input.current?.click()} disabled={busy}
            className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold flex items-center gap-2 whitespace-nowrap disabled:opacity-50">
            <Camera size={14} /> {busy ? 'Uploading…' : value ? 'Change picture' : 'Add picture'}
          </button>
          {value && !busy && (
            <button type="button" onClick={() => onChange(null)} aria-label={`Remove ${label.toLowerCase()}`}
              className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-red-400 text-xs font-bold flex items-center gap-2 whitespace-nowrap">
              <Trash2 size={14} /> Remove
            </button>
          )}
        </div>
      </div>
      {error && <p role="alert" className="text-xs text-red-400 ml-1">{error}</p>}
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  )
}
