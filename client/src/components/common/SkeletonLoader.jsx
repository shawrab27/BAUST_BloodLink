/**
 * SkeletonLoader — Reusable skeleton shimmer components.
 *
 * Requirement: Every list-rendering component must have three explicit states:
 *   1. Loading  → skeleton (this file)
 *   2. Empty    → EmptyState component
 *   3. Error    → ErrorBoundary or inline retry button
 */

// Base skeleton block
export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

// Card skeleton for feed posts / blood request cards
export function CardSkeleton() {
  return (
    <div className="glass-panel rounded-xl p-space-md space-y-space-sm animate-fade-in">
      {/* Header: avatar + name */}
      <div className="flex items-center gap-space-sm">
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      {/* Body */}
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-5/6" />
        <Skeleton className="h-3.5 w-4/6" />
      </div>
      {/* Footer */}
      <div className="flex items-center gap-space-sm pt-1">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

// Donor card skeleton
export function DonorCardSkeleton() {
  return (
    <div className="glass-panel rounded-xl p-space-md flex items-center gap-space-md">
      <Skeleton className="w-14 h-14 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-9 w-24 rounded-lg flex-shrink-0" />
    </div>
  );
}

// Feed skeleton (multiple card placeholders)
export function FeedSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// Table row skeleton for admin panels
export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-3.5 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

// Notification skeleton
export function NotificationSkeleton({ count = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-space-sm p-space-sm">
          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
