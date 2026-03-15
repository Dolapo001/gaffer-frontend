'use client'

interface GafferLogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function GafferLogo({ size = 'md', className = '' }: GafferLogoProps) {
  const sizes = {
    sm: 'text-3xl',
    md: 'text-5xl',
    lg: 'text-6xl',
  }

  return (
    <div className={`font-display font-black tracking-wider ${sizes[size]} ${className}`}>
      <span style={{ color: '#FF6B00' }}>G</span>
      <span style={{ color: '#FF7A00' }}>A</span>
      <span style={{ color: '#FF5500' }}>F</span>
      <span style={{ color: '#EE3A00' }}>F</span>
      <span style={{ color: '#E02000' }}>E</span>
      <span style={{ color: '#CC1500' }}>R</span>
    </div>
  )
}

export function GafferLogoFull({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-start ${className}`}>
      <span className="text-white font-display font-bold text-lg tracking-[0.3em] uppercase opacity-80">THE</span>
      <div className="font-display font-black text-[52px] leading-none tracking-wider">
        <span style={{ color: '#FF6B00' }}>G</span>
        <span style={{ color: '#FF7A00' }}>A</span>
        <span style={{ color: '#FF5500' }}>F</span>
        <span style={{ color: '#EE3A00' }}>F</span>
        <span style={{ color: '#E02000' }}>E</span>
        <span style={{ color: '#CC1500' }}>R</span>
      </div>
    </div>
  )
}
