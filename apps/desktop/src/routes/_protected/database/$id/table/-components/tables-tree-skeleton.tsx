export function TablesTreeSkeleton() {
  return (
    <div className="w-full space-y-3">
      {Array.from({ length: 10 }, (_, i) => (
        <div key={`skeleton-${i}`} className="flex h-5 items-center gap-2 px-2">
          <div className="h-full w-5 shrink-0 animate-pulse rounded-md bg-muted" />
          <div
            className="h-full animate-pulse rounded-md bg-muted"
            style={{ width: `${Math.random() * 40 + 60 - 30}%` }}
          />
        </div>
      ))}
    </div>
  )
}
