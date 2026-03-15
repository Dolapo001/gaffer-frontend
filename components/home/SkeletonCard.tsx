export function SkeletonCard({ size = 'large' }: { size?: 'large' | 'small' | 'league' }) {
  if (size === 'small') {
    return (
      <div className="flex gap-3 animate-pulse">
        <div className="flex-shrink-0 w-20 h-16 rounded-xl bg-gaffer-card" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-3 bg-gaffer-card rounded w-1/3" />
          <div className="h-3 bg-gaffer-card rounded w-full" />
          <div className="h-3 bg-gaffer-card rounded w-4/5" />
        </div>
      </div>
    )
  }

  if (size === 'league') {
    return (
      <div className="flex items-center gap-3 py-3.5 animate-pulse">
        <div className="w-11 h-11 rounded-full bg-gaffer-card flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-gaffer-card rounded w-2/3" />
          <div className="h-2.5 bg-gaffer-card rounded w-1/2" />
        </div>
        <div className="w-8 h-8 rounded-full bg-gaffer-card" />
      </div>
    )
  }

  return (
    <div className="bg-gaffer-card border border-gaffer-border rounded-2xl overflow-hidden animate-pulse">
      <div className="h-44 bg-gaffer-surface" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gaffer-surface" />
          <div className="h-3 bg-gaffer-surface rounded w-1/3" />
        </div>
        <div className="h-4 bg-gaffer-surface rounded w-full" />
        <div className="h-4 bg-gaffer-surface rounded w-4/5" />
        <div className="h-3 bg-gaffer-surface rounded w-2/3" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-3 bg-gaffer-surface rounded w-16" />
          <div className="h-3 bg-gaffer-surface rounded w-8" />
        </div>
      </div>
    </div>
  )
}
