'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function TournamentJoinRedirect() {
  const router = useRouter()
  const params = useParams()
  const code = params.code as string

  useEffect(() => {
    if (code) {
      router.replace(`/app/league?code=${code}`)
    } else {
      router.replace('/app/league')
    }
  }, [code, router])

  return (
    <div className="min-h-screen bg-[#181928] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#FF8904] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
