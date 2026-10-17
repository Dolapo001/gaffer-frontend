'use client'

/**
 * A news picture shown whole, in a frame that is exactly the picture's own size and shape: full width, with the
 * height following the picture, so nothing is cropped and there are no bars around it.
 */
export function NewsImage({ src, alt, className = '', children }: { src: string; alt: string; ratio?: string; className?: string; children?: React.ReactNode }) {
  return (
    <div className={`relative w-full overflow-hidden bg-black ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="block w-full h-auto" loading="lazy" />
      {children}
    </div>
  )
}
