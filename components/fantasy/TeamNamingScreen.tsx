'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useFantasyStore } from '@/store/fantasyStore'

interface TeamNamingScreenProps {
  onComplete: (name: string) => void
}

export const TeamNamingScreen: React.FC<TeamNamingScreenProps> = ({ onComplete }) => {
  const [name, setName] = useState('')
  const { createTeamOnApi, saveTeamToApi, isSaving, saveError } = useFantasyStore()

  const handleConfirm = async () => {
    if (!name.trim()) return;
    try {
      // Create the team record on backend
      await createTeamOnApi(name.trim());
      onComplete(name.trim());
    } catch (err: any) {
      console.error('Final team naming failed:', err);
    }
  };

  return (
    <div className="fixed inset-0 w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto bg-[#1b1c28] flex flex-col font-sans z-20">
      <div className="flex-1 overflow-y-auto px-8 pt-24">
        <h1 className="text-white text-[28px] font-bold text-center mb-12 tracking-tight">
          Choose your team&apos;s name
        </h1>

        <div className="space-y-2 mb-6">
          <label className="text-white/60 text-[14px] font-medium ml-1">Team name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            maxLength={50}
            className="w-full h-[64px] bg-[#222232] rounded-2xl border border-white/5 px-6 text-white text-[18px] font-bold focus:outline-none focus:border-[#ff4d00]/30 transition-colors uppercase tracking-wider"
          />
          <p className="text-white/30 text-xs ml-1">{name.length}/50 characters</p>
        </div>

        {saveError && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm text-center mb-4 px-4"
          >
            {saveError}
          </motion.p>
        )}

        {/* Phone mockup */}
        <div className="relative w-full aspect-[4/5] bg-transparent flex justify-center pt-8">
          <div className="w-[85%] h-full rounded-t-[50px] border-[5px] border-white/10 bg-[#222232] relative overflow-hidden">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-3 bg-white/10 rounded-full" />
            <div className="mt-20 px-8">
              <div className="w-full h-8 bg-white/5 rounded-lg mb-4" />
              <div className="w-2/3 h-8 bg-white/5 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-28">
        <button
          onClick={handleConfirm}
          disabled={!name.trim() || isSaving}
          className="w-full h-[64px] rounded-2xl bg-gradient-to-r from-[#ff4d00] to-[#ff8a00] text-white font-bold text-[18px] shadow-[0_8px_30px_rgba(255,77,0,0.3)] active:scale-95 transition-all disabled:opacity-50"
        >
          {isSaving ? 'Creating...' : 'Confirm'}
        </button>
      </div>
    </div>
  )
}
