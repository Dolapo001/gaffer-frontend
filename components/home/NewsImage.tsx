'use client'

/**
 * A news picture shown whole, in a frame that is exactly the picture's own size and shape: full width, with the
 * height following the picture, so nothing is cropped and there are no bars around it.
 *
 * When the "picture" is really the publisher's logo (the post came with no picture of its own), it is shown whole
 * and centred on a soft blurred copy of itself, in a fixed wide frame, so a small square logo is neither stretched
 * nor left floating in a huge empty block.
 */
export function NewsImage({ src, alt, isLogo = false, className = '', children }: { src: string; alt: string; isLogo?: boolean; ratio?: string; className?: string; children?: React.ReactNode }) {
  if (isLogo) {
    return (
      <div className={`relative w-full aspect-[16/9] overflow-hidden bg-gaffer-bg ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-40" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-center justify-center p-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="h-full max-h-40 w-auto max-w-[60%] rounded-full object-cover border border-white/10 shadow-xl bg-black/20" loading="lazy" />
        </div>
        {children}
      </div>
    )
  }
  return (
    <div className={`relative w-full overflow-hidden bg-black ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="block w-full h-auto" loading="lazy" />
      {children}
    </div>
  )
}
