'use client'

import React from 'react'
import {
  Trophy, Target, AlertTriangle, Zap, ShieldCheck, XCircle,
  Repeat, Play, Pause, Flag, CornerDownRight, Crosshair,
  AlertOctagon, MessageSquare, Clock, ShieldAlert
} from 'lucide-react'

interface CommentaryIconProps {
  type: string
  size?: number
  className?: string
}

export function CommentaryIcon({ type, size = 18, className = '' }: CommentaryIconProps) {
  const raw = type ? type.toLowerCase() : ''

  switch (raw) {
    case 'goal':
    case 'penalty_scored':
      return (
        <div className={`relative flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)] ${className}`}>
          <Trophy size={size} className="animate-pulse" />
        </div>
      )

    case 'own_goal':
      return (
        <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 ${className}`}>
          <AlertTriangle size={size} />
        </div>
      )

    case 'penalty_awarded':
    case 'penalty':
      return (
        <div className={`relative flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20 border border-red-500/50 text-red-400 shadow-[0_0_14px_rgba(239,68,68,0.4)] ${className}`}>
          <Zap size={size} className="animate-bounce" />
        </div>
      )

    case 'penalty_saved':
      return (
        <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)] ${className}`}>
          <ShieldCheck size={size} />
        </div>
      )

    case 'penalty_missed':
      return (
        <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 ${className}`}>
          <XCircle size={size} />
        </div>
      )

    case 'second_yellow':
      return (
        <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.3)] ${className}`}>
          <div className="relative flex items-center justify-center">
            <div className="w-[9px] h-[13px] bg-yellow-400 rounded-[2px] -rotate-12 -mr-1 shadow-[0_0_8px_rgba(250,204,21,0.6)] z-0" />
            <div className="w-[9px] h-[13px] bg-red-500 rounded-[2px] rotate-12 shadow-[0_0_8px_rgba(239,68,68,0.6)] z-10" />
          </div>
        </div>
      )

    case 'yellow_card':
      return (
        <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/10 border border-yellow-500/30 ${className}`}>
          <div className="w-[11px] h-[15px] bg-yellow-400 rounded-[2px] shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
        </div>
      )

    case 'red_card':
      return (
        <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 border border-red-500/30 ${className}`}>
          <div className="w-[11px] h-[15px] bg-red-500 rounded-[2px] shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
        </div>
      )

    case 'substitution':
      return (
        <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 ${className}`}>
          <Repeat size={size} />
        </div>
      )

    case 'start':
    case 'match_resumed':
      return (
        <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 ${className}`}>
          <Play size={size} className="fill-green-400 ml-0.5" />
        </div>
      )

    case 'halftime':
      return (
        <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 ${className}`}>
          <Pause size={size} />
        </div>
      )

    case 'fulltime':
      return (
        <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 ${className}`}>
          <Flag size={size} />
        </div>
      )

    case 'save':
      return (
        <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 ${className}`}>
          <ShieldCheck size={size} />
        </div>
      )

    case 'motm':
    case 'motm_award':
      return (
        <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 ${className}`}>
          <Trophy size={size} />
        </div>
      )

    case 'attempt_missed':
      return (
        <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-400 ${className}`}>
          <Crosshair size={size} />
        </div>
      )

    case 'corner':
      return (
        <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-400 ${className}`}>
          <CornerDownRight size={size} />
        </div>
      )

    case 'match_suspended':
      return (
        <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 ${className}`}>
          <AlertOctagon size={size} />
        </div>
      )

    default:
      return (
        <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10 text-white/40 ${className}`}>
          <MessageSquare size={size} />
        </div>
      )
  }
}
