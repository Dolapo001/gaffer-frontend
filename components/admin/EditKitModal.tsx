'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { JerseyEditor } from '@/components/admin/JerseyEditor'
import { DEFAULT_JERSEY_FORM, type JerseyFormConfig } from '@/app/admin/organise/types'
import { updateTeam, type Team as BackendTeam } from '@/lib/services/team.service'
import { coloursLookAlike, isHexColour } from '@/lib/colorDifference'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'

/** Change an existing team's kit colours. The same server rules apply as when the team was created. */
export function EditKitModal({ teamId, teamName, current, orgId, onClose }: {
  teamId: string
  teamName: string
  current?: BackendTeam['jersey'] | null
  orgId?: string
  onClose: () => void
}) {
  const qc = useQueryClient()
  const toast = useToastStore()
  const start = current?.primaryColor && current?.secondaryColor ? current : DEFAULT_JERSEY_FORM.home
  const [kit, setKit] = useState<JerseyFormConfig>({
    home: { primaryColor: start.primaryColor, secondaryColor: start.secondaryColor, jerseyPattern: start.jerseyPattern ?? 'solid' },
    away: DEFAULT_JERSEY_FORM.away,
  })
  const { primaryColor, secondaryColor, jerseyPattern } = kit.home
  const valid = isHexColour(primaryColor) && isHexColour(secondaryColor)
  const lookAlike = coloursLookAlike(primaryColor, secondaryColor)
  const unchanged = primaryColor.toLowerCase() === (current?.primaryColor ?? '').toLowerCase()
    && secondaryColor.toLowerCase() === (current?.secondaryColor ?? '').toLowerCase()

  const save = useMutation({
    mutationFn: () => updateTeam(teamId, { jersey: { primaryColor: primaryColor.trim(), secondaryColor: secondaryColor.trim(), jerseyPattern } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams', orgId] })
      qc.invalidateQueries({ queryKey: ['team-detail', teamId] })
      qc.invalidateQueries({ queryKey: ['competition-teams'] })
      toast.addToast(`${teamName}'s kit is updated. Fantasy and match screens show it within a minute.`, 'success')
      onClose()
    },
    onError: (e) => toast.addToast(getErrorMessage(e), 'error'),
    meta: { suppressGlobalError: true },
  })

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-[10px]" onClick={onClose} />
      <div className="relative w-full max-w-[340px] max-h-[90vh] overflow-y-auto bg-[#1C1D2B] border border-white/10 rounded-[32px] shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Edit kit · {teamName}</p>
          <button onClick={onClose} aria-label="Close" className="text-white/20 hover:text-white"><X size={16} /></button>
        </div>

        <JerseyEditor value={kit} onChange={setKit} singleKit />

        {!valid && <p role="alert" className="text-xs text-red-400">Use colours like #1D4ED8.</p>}
        {valid && lookAlike && (
          <p role="status" className="text-xs text-yellow-300">These two colours look alike on the pitch. Pick colours that stand out from each other.</p>
        )}

        <button
          onClick={() => save.mutate()}
          disabled={!valid || unchanged || save.isPending}
          className="w-full h-12 rounded-2xl bg-gaffer-orange text-white font-black uppercase tracking-widest text-sm disabled:opacity-40"
        >
          {save.isPending ? 'Saving…' : 'Save kit'}
        </button>
      </div>
    </div>
  )
}
