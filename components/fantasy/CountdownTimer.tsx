'use client'

import { useEffect, useState } from 'react'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function getTimeLeft(deadline: Date): TimeLeft {
  const diff = deadline.getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

interface CountdownTimerProps {
  deadline: Date
  label: string
}

export function CountdownTimer({ deadline, label }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft(deadline))

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(deadline)), 1000)
    return () => clearInterval(id)
  }, [deadline])

  const units = [
    { label: 'Days', value: pad(timeLeft.days) },
    { label: 'Hours', value: pad(timeLeft.hours) },
    { label: 'Mins', value: pad(timeLeft.minutes) },
    { label: 'Secs', value: pad(timeLeft.seconds) },
  ]

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-gaffer-muted text-xs font-body text-center leading-snug">
        {label}
      </p>
      <div className="flex items-center gap-1.5">
        {units.map((unit, i) => (
          <div key={unit.label} className="flex items-center gap-1.5">
            <div className="flex flex-col items-center">
              <div className="bg-gaffer-card border border-gaffer-border rounded-lg w-11 h-11 flex items-center justify-center">
                <span className="font-display font-black text-lg text-white leading-none">
                  {unit.value}
                </span>
              </div>
              <span className="text-[9px] font-body text-gaffer-muted mt-0.5">
                {unit.label}
              </span>
            </div>
            {i < units.length - 1 && (
              <span className="font-display font-bold text-gaffer-orange text-base mb-3 leading-none">
                :
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
