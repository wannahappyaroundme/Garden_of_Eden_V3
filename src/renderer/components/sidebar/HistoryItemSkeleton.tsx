/**
 * History Item Skeleton
 * Loading placeholder for conversation history items
 */

export function HistoryItemSkeleton() {
  return (
    <div className="mb-2 p-3 rounded-lg border border-border bg-card animate-pulse">
      {/* Title skeleton */}
      <div className="h-4 bg-muted rounded w-3/4 mb-2" />

      {/* Preview text skeleton */}
      <div className="h-3 bg-muted rounded w-full mb-1" />
      <div className="h-3 bg-muted rounded w-2/3 mb-2" />

      {/* Timestamp skeleton */}
      <div className="h-3 bg-muted rounded w-1/3" />
    </div>
  );
}

/**
 * Multiple skeleton loaders
 */
export function HistoryListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <HistoryItemSkeleton key={index} />
      ))}
    </>
  );
}
