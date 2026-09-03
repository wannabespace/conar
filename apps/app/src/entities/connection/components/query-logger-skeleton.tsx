import { Skeleton } from '@tamery/ui/components/skeleton'
import { cn } from '@tamery/ui/lib/utils'

const skeletonQueryWidths = [
  'w-40',
  'w-64',
  'w-32',
  'w-56',
  'w-48',
  'w-72',
  'w-36',
  'w-60',
]

export const QueryLoggerSkeleton = () => (
  <div className="flex h-full min-h-0 flex-col">
    <div className="flex h-8 shrink-0 items-center gap-1 border-b pr-1 pl-3">
      <Skeleton className="h-2.5 w-24 rounded-full" />
      <div className="ml-auto flex items-center gap-1">
        <Skeleton className="size-6 rounded-md" />
        <Skeleton className="size-6 rounded-md" />
      </div>
    </div>
    <div className="min-h-0 flex-1 overflow-hidden">
      {skeletonQueryWidths.map((width) => (
        <div key={width} className="flex h-7 items-center gap-2.5 px-3">
          <span className="flex w-3 shrink-0 justify-center">
            <Skeleton className="size-1.5 rounded-full" />
          </span>
          <Skeleton className={cn('h-2.5 rounded-full', width)} />
          <span className="ml-auto flex items-center gap-3">
            <Skeleton className="h-2.5 w-12 rounded-full" />
            <Skeleton className="h-2.5 w-12 rounded-full" />
          </span>
        </div>
      ))}
    </div>
  </div>
)
