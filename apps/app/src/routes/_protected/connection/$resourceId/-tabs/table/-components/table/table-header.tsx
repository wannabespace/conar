import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiDatabase2Line,
} from '@remixicon/react'
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
import { useEffect, useState } from 'react'
import { createThrottledFn } from 'seitu'

import { INTERNAL_COLUMN_IDS } from '~/entities/connection/components/table/cell'

import type { tablePageType } from '../../-lib/store'
import { useTablePageStore } from '../../-lib/store'

interface HeaderColumn {
  id: string
  size: number
  scrollLeft: number
}

const getVisibleColumns = (element: HTMLElement) => {
  const columns = [...element.querySelectorAll<HTMLElement>('[data-column-id]')]
  const { scrollLeft } = element
  const scrollRight = scrollLeft + element.clientWidth
  const visible: HeaderColumn[] = []

  for (const el of columns) {
    const id = el.dataset.columnId

    if (!id) {
      continue
    }

    const left = el.offsetLeft
    const right = left + el.offsetWidth

    if (right > scrollLeft && left < scrollRight) {
      visible.push({ id, size: el.offsetWidth, scrollLeft: left })
    }
  }

  return visible
}

const getNotVisibleColumns = (
  element: HTMLElement,
  allColumns: ColumnRenderer[],
  store: typeof tablePageType.infer
): {
  left: HeaderColumn[]
  right: HeaderColumn[]
} => {
  const notVisibleColumns: { left: HeaderColumn[]; right: HeaderColumn[] } = {
    left: [],
    right: [],
  }
  const visibleColumns = getVisibleColumns(element)

  let accumulatedLeft = 0
  for (const column of allColumns) {
    const isVisible = visibleColumns.find((v) => v.id === column.id)
    const scrollLeft = accumulatedLeft
    const size = store.columnSizes[column.id] || column.size

    accumulatedLeft += size

    if (Object.values(INTERNAL_COLUMN_IDS).includes(column.id)) {
      continue
    }

    if (!isVisible) {
      if (scrollLeft < element.scrollLeft) {
        notVisibleColumns.left.push({ id: column.id, size, scrollLeft })
      } else {
        notVisibleColumns.right.push({ id: column.id, size, scrollLeft })
      }
    }
  }

  return notVisibleColumns
}

const Header = ({ className }: { className?: string }) => {
  const store = useTablePageStore()
  const scrollRef = useTableContext((state) => state.scrollRef)
  const direction = useTableContext((state) => state.scrollDirection)
  const columns = useTableContext((state) => state.columns)
  const [notVisibleColumns, setNotVisibleColumns] = useState<{
    left: HeaderColumn[]
    right: HeaderColumn[]
  }>({ left: [], right: [] })

  const scrollToColumn = (column: HeaderColumn, side: 'left' | 'right') => {
    const scrollEl = scrollRef.current

    if (!scrollEl) {
      return
    }

    const extraSpace = side === 'left' ? -40 : 40
    const targetScrollLeft =
      (side === 'left'
        ? column.scrollLeft
        : column.scrollLeft + column.size - scrollEl.clientWidth) + extraSpace

    animate(scrollEl.scrollLeft, targetScrollLeft, {
      onUpdate: (latest) => {
        scrollEl.scrollLeft = latest
      },
      duration: 0.5,
      ease: 'easeInOut',
    })
  }

  const updateScrollLeft = createThrottledFn((el: HTMLElement) => {
    if (direction === 'up' || direction === 'down') {
      return
    }

    setNotVisibleColumns(getNotVisibleColumns(el, columns, store.get()))
  }, 200)

  useEffect(() => {
    const el = scrollRef.current

    if (!el) {
      return
    }

    const handleScroll = () => updateScrollLeft(el)

    el.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      el.removeEventListener('scroll', handleScroll)
    }
  }, [scrollRef, updateScrollLeft])

  useEffect(() => {
    queueMicrotask(() => {
      const el = scrollRef.current
      if (el) {
        setNotVisibleColumns(getNotVisibleColumns(el, columns, store.get()))
      }
    })
  }, [columns, store, scrollRef])

  if (columns.length === 0) {
    return null
  }

  return (
    <TableHeader
      className={cn('flex', className)}
      before={
        <div className="sticky inset-y-0 left-0 z-20 flex w-0 items-center">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger
                render={
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label="Columns off-screen to the left"
                        className={cn(
                          `group absolute top-1/2 left-2 -translate-y-1/2 transition-opacity duration-150`,
                          notVisibleColumns.left.length > 0
                            ? 'opacity-100'
                            : 'pointer-events-none opacity-0'
                        )}
                      />
                    }
                  />
                }
              >
                <RiArrowLeftSLine className="relative z-10 size-4" />
              </TooltipTrigger>
              <TooltipContent side="bottom">Columns off-screen</TooltipContent>
            </Tooltip>
            <DropdownMenuContent
              side="bottom"
              align="start"
              className="min-w-48"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel>Scroll to column</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notVisibleColumns.left.map((column) => (
                  <DropdownMenuItem
                    key={column.id}
                    onClick={() => scrollToColumn(column, 'left')}
                  >
                    <RiDatabase2Line />
                    {column.id}
                  </DropdownMenuItem>
                ))}
                {notVisibleColumns.left.length === 0 && (
                  <DropdownMenuItem className="text-xs" disabled>
                    No more columns to scroll to
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
      after={
        <div className="sticky inset-y-0 right-0 z-20 flex w-0 items-center">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger
                render={
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label="Columns off-screen to the right"
                        className={cn(
                          `group absolute top-1/2 right-2 -translate-y-1/2 shadow-none transition-opacity duration-150`,
                          notVisibleColumns.right.length > 0
                            ? 'opacity-100'
                            : `pointer-events-none opacity-0`
                        )}
                      />
                    }
                  />
                }
              >
                <RiArrowRightSLine className="relative z-10 size-4" />
              </TooltipTrigger>
              <TooltipContent side="bottom">Columns off-screen</TooltipContent>
            </Tooltip>
            <DropdownMenuContent side="bottom" align="end" className="min-w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Scroll to column</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notVisibleColumns.right.map((column) => (
                  <DropdownMenuItem
                    key={column.id}
                    onClick={() => scrollToColumn(column, 'right')}
                  >
                    <RiDatabase2Line />
                    {column.id}
                  </DropdownMenuItem>
                ))}
                {notVisibleColumns.right.length === 0 && (
                  <DropdownMenuItem className="text-xs" disabled>
                    No more columns to scroll to
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    />
  )
}

export { Header as TableHeader }
