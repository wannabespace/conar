import { Skeleton } from '@tamery/ui/components/skeleton'

const NODES_COUNT = 3
const COLUMNS_COUNT = 5

export const VisualizerSkeleton = () => (
  <div
    aria-hidden
    className="bg-background relative size-full min-h-0 flex-1 overflow-hidden rounded-lg bg-[radial-gradient(var(--color-border)_1px,transparent_0)] bg-size-[20px_20px]"
  >
    <div className="absolute inset-x-3 top-3 z-10 flex flex-col items-center">
      <div className="flex w-full max-w-3xl items-start gap-2">
        <Skeleton className="h-8 w-40 rounded-xl" />
        <Skeleton className="h-8 flex-1 rounded-xl" />
        <div className="flex items-center gap-1">
          <Skeleton className="size-8 rounded-xl" />
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
      </div>
    </div>
    <Skeleton className="absolute bottom-3 left-3 z-10 h-20 w-7 rounded-xl" />
    <div className="flex size-full items-center justify-center gap-24">
      {Array.from({ length: NODES_COUNT }).map((_, nodeIndex) => (
        <div
          // oxlint-disable-next-line react/no-array-index-key
          key={nodeIndex}
          className="bg-popover ring-foreground/4 w-64 rounded-xl shadow-md ring"
        >
          <div className="border-foreground/6 flex h-8 items-center gap-2 border-b px-3">
            <Skeleton className="size-4 shrink-0" />
            <Skeleton className="h-3.5 w-1/2" />
          </div>
          <div className="py-1">
            {Array.from({ length: COLUMNS_COUNT }).map((__, columnIndex) => (
              <div
                // oxlint-disable-next-line react/no-array-index-key
                key={columnIndex}
                className="flex h-7 items-center justify-between gap-2 px-3"
              >
                <Skeleton className="h-3 w-2/5" />
                <Skeleton className="h-3 w-1/5" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)
