'use client'

interface ProgressRingProps {
  completed: number
  total: number
  size?: number
  className?: string
}

export function ProgressRing({ completed, total, size = 44, className = '' }: ProgressRingProps) {
  const stroke = 4
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = total > 0 ? Math.min(1, Math.max(0, completed / total)) : 0
  const offset = circumference * (1 - pct)

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#252D3D"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#FF6B00"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute font-chakra font-black text-white" style={{ fontSize: size * 0.26 }}>
        {completed}/{total}
      </span>
    </div>
  )
}
