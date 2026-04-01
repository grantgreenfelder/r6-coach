// Animated skeleton shown as a Suspense fallback during lazy route loads.
// Uses the same card/surface tokens as the rest of the site so the transition
// is seamless rather than jarring.

function Bone({ className }) {
  return (
    <div className={`bg-siege-border/60 rounded animate-pulse ${className}`} />
  )
}

function CardSkeleton({ lines = 3, className = '' }) {
  return (
    <div className={`card space-y-3 ${className}`}>
      <Bone className="h-3 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Bone key={i} className={`h-2 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  )
}

// Dashboard-shaped skeleton: KPI row + player grid + bottom row
function DashboardSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Bone className="h-6 w-40" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <CardSkeleton key={i} lines={2} />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5].map(i => <CardSkeleton key={i} lines={4} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CardSkeleton lines={6} />
        <CardSkeleton lines={6} className="lg:col-span-2" />
      </div>
    </div>
  )
}

// Generic list/detail skeleton: header card + content cards
function GenericSkeleton({ cards = 2 }) {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Bone className="h-4 w-16" />
      <CardSkeleton lines={4} />
      <div className="flex gap-4">
        {[1, 2, 3].map(i => <Bone key={i} className="h-8 w-20 rounded-full" />)}
      </div>
      {Array.from({ length: cards }).map((_, i) => (
        <CardSkeleton key={i} lines={5} />
      ))}
    </div>
  )
}

export default function PageSkeleton({ page = 'generic' }) {
  if (page === 'dashboard') return <DashboardSkeleton />
  return <GenericSkeleton cards={page === 'detail' ? 3 : 2} />
}
