'use client'

/**
 * A news picture shown whole. The old cards cropped every picture to a fixed strip, so most of it was cut off.
 * Here the full picture sits inside a frame of fixed shape, and a blurred copy of the same picture fills the
 * space around it. Cards stay the same size and look like news, and nothing is cropped.
 */
export function NewsImage({ src, alt, ratio = '16 / 10', className = '', children }: { src: string; alt: string; ratio?: string; className?: string; children?: React.ReactNode }) {
  return (
    <div className={`relative w-full overflow-hidden bg-black ${className}`} style={{ aspectRatio: ratio }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-60" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="absolute inset-0 w-full h-full object-contain" loading="lazy" />
      {children}
    </div>
  )
}
