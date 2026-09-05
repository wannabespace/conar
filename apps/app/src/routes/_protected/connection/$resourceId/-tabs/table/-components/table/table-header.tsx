import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  DatabaseIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { ColumnRenderer } from '@tamery/table'
import { TableHeader } from '@tamery/table'
import { useTableContext } from '@tamery/table/hooks'
import { Button } from '@tamery/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@tamery/ui/components/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { animate } from 'motion'
import { useSubscription } from 'seitu/react'
import { createScrollState } from 'seitu/web'

import { INTERNAL_COLUMN_IDS } from '~/entities/connection/components/table/cell'

import { useTablePageStore } from '../../-lib/store'

type Side = 'left' | 'right'

interface ColumnSpan {
  end: number
  id: string
  start: number
}

const BUTTON_CLEARANCE_PX = 40

const internalColumnIds = new Set<string>(Object.values(INTERNAL_COLUMN_IDS))

const getColumnSpans = (
  columns: ColumnRenderer[],
  columnSizes: Record<string, number>
) => {
  const spans: ColumnSpan[] = []
  let start = 0

  for (const column of columns) {
    const end = start + (columnSizes[column.id] || column.size)
    if (!internalColumnIds.has(column.id)) {
      spans.push({ end, id: column.id, start })
    }
    start = end
  }

  return spans
}

const OffscreenColumnsMenu = ({
  columns,
  onSelect,
  side,
}: {
  columns: ColumnSpan[]
  onSelect: (column: ColumnSpan) => void
  side: Side
}) => (
  <div
    className={cn(
      'sticky inset-y-0 z-20 flex w-0 items-center',
      side === 'left' ? 'left-0' : 'right-0'
    )}
  >
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label={`Columns off-screen to the ${side}`}
                  className={cn(
                    'absolute top-1/2 -translate-y-1/2 transition-opacity duration-150',
                    side === 'left' ? 'left-2' : 'right-2',
                    columns.length === 0 && 'pointer-events-none opacity-0'
                  )}
                />
              }
            />
          }
        >
          <HugeiconsIcon
            icon={side === 'left' ? ArrowLeft01Icon : ArrowRight01Icon}
            strokeWidth={2}
          />
        </TooltipTrigger>
        <TooltipContent side="bottom">Columns off-screen</TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        side="bottom"
        align={side === 'left' ? 'start' : 'end'}
        className="min-w-48"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>Scroll to column</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {columns.map((column) => (
            <DropdownMenuItem key={column.id} onClick={() => onSelect(column)}>
              <HugeiconsIcon icon={DatabaseIcon} strokeWidth={2} />
              <span data-mask>{column.id}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
)

const Header = ({ className }: { className?: string }) => {
  const store = useTablePageStore()
  const columnSizes = useSubscription(store, {
    selector: (state) => state.columnSizes,
  })
  const scrollRef = useTableContext((state) => state.scrollRef)
  const columns = useTableContext((state) => state.columns)
  const tableWidth = useTableContext((state) => state.tableWidth)
  const spans = getColumnSpans(columns, columnSizes)
  const offscreen = useSubscription(
    () =>
      createScrollState({
        direction: 'horizontal',
        element: () => scrollRef.current,
      }),
    {
      deps: [scrollRef],
      selector: ({ left, right }) => ({
        left: spans.filter((span) => span.end <= left.remaining),
        right: spans.filter(
          (span) => tableWidth - span.start <= right.remaining
        ),
      }),
    }
  )

  const scrollToColumn = (column: ColumnSpan, side: Side) => {
    const el = scrollRef.current
    if (!el) {
      return
    }

    const target =
      side === 'left'
        ? column.start - BUTTON_CLEARANCE_PX
        : column.end - el.clientWidth + BUTTON_CLEARANCE_PX

    animate(el.scrollLeft, target, {
      duration: 0.5,
      ease: 'easeInOut',
      onUpdate: (latest) => {
        el.scrollLeft = latest
      },
    })
  }

  if (columns.length === 0) {
    return null
  }

  return (
    <TableHeader
      className={cn('flex', className)}
      before={
        <OffscreenColumnsMenu
          side="left"
          columns={offscreen.left}
          onSelect={(column) => scrollToColumn(column, 'left')}
        />
      }
      after={
        <OffscreenColumnsMenu
          side="right"
          columns={offscreen.right}
          onSelect={(column) => scrollToColumn(column, 'right')}
        />
      }
    />
  )
}

export { Header as TableHeader }
