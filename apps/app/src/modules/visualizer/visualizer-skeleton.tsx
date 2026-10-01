import {
  MinusSignIcon,
  PlusSignIcon,
  Structure01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Skeleton } from '@tamery/ui/components/skeleton'
import { cn } from '@tamery/ui/lib/utils'
import type { CSSProperties } from 'react'

const CARD_WIDTH = 256
const HEADER_HEIGHT = 32
const ROW_HEIGHT = 28
const ROWS_TOP = HEADER_HEIGHT + 4

const hub = { rows: 5, x: 0, y: 90 }
const upper = { rows: 3, x: 352, y: 0 }
const lower = { rows: 4, x: 352, y: 208 }
const leaf = { rows: 2, x: 704, y: 90 }
const cards = [hub, upper, lower, leaf]

type Card = (typeof cards)[number]

const edges = [
  { row: 1, source: hub, target: upper },
  { row: 3, source: hub, target: lower },
  { row: 2, source: upper, target: leaf },
]

const edgePath = ({
  row,
  source,
  target,
}: {
  row: number
  source: Card
  target: Card
}) => {
  const startX = source.x + CARD_WIDTH
  const midX = (startX + target.x) / 2
  const startY = source.y + ROWS_TOP + ROW_HEIGHT * row + ROW_HEIGHT / 2
  const endY = target.y + HEADER_HEIGHT / 2
  return `M${startX} ${startY}H${midX}V${endY}H${target.x}`
}

const Pill = ({ className }: { className?: string }) => (
  <div className={cn('bg-background h-8 rounded-xl', className)}>
    <Skeleton className="size-full rounded-xl" />
  </div>
)

const frame =
  'bg-popover ring-foreground/4 absolute z-10 rounded-xl shadow-md ring'

export const VisualizerSkeleton = ({
  drafts,
  schemaPicker,
}: {
  drafts: boolean
  schemaPicker: boolean
}) => (
  <div
    aria-hidden
    // oxlint-disable-next-line shadcn/no-arbitrary-values -- stands in for xyflow's dot background, which no token describes
    className="bg-background relative size-full min-h-0 flex-1 overflow-hidden rounded-lg bg-[radial-gradient(var(--color-border)_1px,transparent_0)] bg-size-[20px_20px]"
  >
    <div className="absolute inset-x-3 top-3 z-10 flex flex-col items-center">
      <div className="flex w-full max-w-3xl flex-wrap items-start gap-2">
        {schemaPicker && <Pill className="w-40" />}
        <Pill className="min-w-40 flex-1" />
        {drafts && (
          <div className="flex items-center gap-1">
            <Pill className="w-8" />
            <Pill className="w-20" />
          </div>
        )}
        <Pill className="w-20" />
      </div>
    </div>
    <div className={cn(frame, 'bottom-3.75 left-3.75 overflow-hidden')}>
      {[PlusSignIcon, MinusSignIcon, Structure01Icon].map((icon, index) => (
        <div
          // oxlint-disable-next-line react/no-array-index-key
          key={index}
          className="border-foreground/6 text-muted-foreground flex size-6.5 items-center justify-center border-b last:border-b-0"
        >
          <HugeiconsIcon icon={icon} strokeWidth={2} className="size-3" />
        </div>
      ))}
    </div>
    <div className={cn(frame, 'right-3.75 bottom-3.75 h-37.5 w-50')} />
    <div className="flex size-full items-center justify-center">
      <div className="relative h-90 w-240 shrink-0 scale-60">
        <svg className="stroke-foreground/10 absolute inset-0 size-full animate-pulse fill-none stroke-[1.5]">
          {edges.map((edge) => (
            <path key={edgePath(edge)} d={edgePath(edge)} />
          ))}
        </svg>
        {cards.map(({ rows, x, y }) => (
          <div
            key={`${x}-${y}`}
            style={{ '--x': `${x}px`, '--y': `${y}px` } as CSSProperties}
            className="bg-popover ring-foreground/4 absolute top-(--y) left-(--x) w-64 rounded-xl shadow-md ring"
          >
            <div className="border-foreground/6 flex h-8 items-center gap-2 border-b px-3">
              <Skeleton className="size-4 shrink-0" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
            <div className="py-1">
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <div
                  // oxlint-disable-next-line react/no-array-index-key
                  key={rowIndex}
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
  </div>
)
