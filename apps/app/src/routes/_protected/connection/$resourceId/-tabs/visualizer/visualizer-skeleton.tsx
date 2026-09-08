import { Skeleton } from '@tamery/ui/components/skeleton'

const NODES_COUNT = 3
const COLUMNS_COUNT = 5

export const VisualizerSkeleton = () => (
  <div
    aria-hidden
    className="bg-background relative size-full min-h-0 flex-1 overflow-hidden rounded-lg bg-[radial-gradient(var(--color-border)_1px,transparent_0)] bg-size-[20px_20px]"
  >
    <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
      <Skeleton className="h-8 w-56 rounded-lg" />
      <Skeleton className="h-8 w-45 rounded-lg" />
    </div>
    <div className="flex size-full items-center justify-center gap-16">
      {Array.from({ length: NODES_COUNT }).map((_, nodeIndex) => (
        <div
          // oxlint-disable-next-line react/no-array-index-key
          key={nodeIndex}
          className="bg-card w-66 rounded-xl"
        >
          <div className="border-border/80 from-background/50 flex items-center gap-2 border-b bg-linear-to-t px-4 py-3">
            <Skeleton className="size-5 shrink-0 rounded-md" />
            <Skeleton className="h-4 w-1/2 rounded-md" />
          </div>
          <div className="py-2">
            {Array.from({ length: COLUMNS_COUNT }).map((__, columnIndex) => (
              <div
                // oxlint-disable-next-line react/no-array-index-key
                key={columnIndex}
                className="flex items-center justify-between gap-2 px-4 py-2"
              >
                <Skeleton className="h-3 w-2/5 rounded-md" />
                <Skeleton className="h-3 w-1/5 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)
