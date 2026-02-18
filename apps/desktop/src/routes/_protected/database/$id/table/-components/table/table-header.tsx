import type { ColumnRenderer } from '@conar/table'
import type { storeState } from '../../-store'
import { TableHeader, useTableContext } from '@conar/table'
import { Button } from '@conar/ui/components/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { useIsScrolled } from '@conar/ui/hookas/use-is-scrolled'
import { useThrottledCallback } from '@conar/ui/hookas/use-throttled-callback'
import { cn } from '@conar/ui/lib/utils'
import { RiArrowLeftSLine, RiArrowRightSLine, RiDatabase2Line } from '@remixicon/react'
import { animate } from 'motion'
import { useEffect, useState } from 'react'
import { INTERNAL_COLUMN_IDS } from '../../-lib'
import { usePageStoreContext } from '../../-store'

interface HeaderColumn {
  id: string
  size: number
  scrollLeft: number
}

function getVisibleColumns(element: HTMLElement) {
  const columns = Array.from(element.querySelectorAll<HTMLElement>('[data-column-id]'))
  const scrollLeft = element.scrollLeft
  const scrollRight = scrollLeft + element.clientWidth

  return columns.reduce<HeaderColumn[]>((acc, el) => {
    const id = el.getAttribute('data-column-id')

    if (!id)
      return acc

    const left = el.offsetLeft
    const right = left + el.offsetWidth

    if (right > scrollLeft && left < scrollRight) {
      acc.push({ id, size: el.offsetWidth, scrollLeft: left })
    }

    return acc
  }, [])
}

function getNotVisibleColumns(element: HTMLElement, allColumns: ColumnRenderer[], store: typeof storeState.infer): {
  left: HeaderColumn[]
  right: HeaderColumn[]
} {
  const notVisibleColumns: { left: HeaderColumn[], right: HeaderColumn[] } = { left: [], right: [] }
  const visibleColumns = getVisibleColumns(element)

  let accumulatedLeft = 0
  for (const column of allColumns) {
    const isVisible = visibleColumns.find(v => v.id === column.id)
    const scrollLeft = accumulatedLeft
    const size = store.columnSizes[column.id] || column.size

    accumulatedLeft += size

    if (Object.values(INTERNAL_COLUMN_IDS).includes(column.id))
      continue

    if (!isVisible) {
      if (scrollLeft < element.scrollLeft) {
        notVisibleColumns.left.push({ id: column.id, size, scrollLeft })
      }
      else {
        notVisibleColumns.right.push({ id: column.id, size, scrollLeft })
      }
    }
  }

  return notVisibleColumns
}

function Header() {
  const store = usePageStoreContext()
  const scrollRef = useTableContext(state => state.scrollRef)
  const direction = useTableContext(state => state.scrollDirection)
  const columns = useTableContext(state => state.columns)
  const isScrolled = useIsScrolled(scrollRef, { direction: 'vertical' })
  const [{ left, right }, setNotVisibleColumns] = useState<{ left: HeaderColumn[], right: HeaderColumn[] }>({ left: [], right: [] })

  function scrollToColumn(column: HeaderColumn, direction: 'left' | 'right') {
    const scrollEl = scrollRef.current

    if (!scrollEl)
      return

    const extraSpace = direction === 'left' ? -40 : 40
    const targetScrollLeft = (direction === 'left'
      ? column.scrollLeft
      : column.scrollLeft + column.size - scrollEl.clientWidth
    ) + extraSpace

    animate(scrollEl.scrollLeft, targetScrollLeft, {
      onUpdate: (latest) => {
        scrollEl.scrollLeft = latest
      },
      duration: 0.5,
      ease: 'easeInOut',
    })
  }

  const updateScrollLeft = useThrottledCallback(() => {
    const el = scrollRef.current

    if (!el || direction === 'up' || direction === 'down')
      return

    setNotVisibleColumns(getNotVisibleColumns(el, columns, store.state))
  }, [direction, columns, store], 200)

  useEffect(() => {
    const el = scrollRef.current

    if (!el)
      return

    el.addEventListener('scroll', updateScrollLeft, { passive: true })

    return () => {
      el.removeEventListener('scroll', updateScrollLeft)
    }
  }, [scrollRef, updateScrollLeft])

  useEffect(() => {
    Promise.resolve().then(() => {
      scrollRef.current?.dispatchEvent(new Event('scroll'))
    })
  }, [scrollRef, columns])

  if (columns.length === 0)
    return null

  return (
    <TableHeader
      className={cn('flex transition-shadow duration-300', isScrolled && `
        shadow-lg shadow-black/3
      `)}
      before={(
        <div className="sticky inset-y-0 left-0 z-20 flex w-0 items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                className={cn(
                  `
                    group absolute top-1/2 -translate-y-1/2 shadow-none
                    transition-[left,opacity] duration-150
                  `,
                  left.length > 0
                    ? 'left-2 opacity-100'
                    : 'pointer-events-none left-0 opacity-0',
                )}
              >
                <RiArrowLeftSLine className="relative z-10 size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="bottom"
              align="start"
              className="min-w-48"
            >
              <DropdownMenuLabel>Scroll to column</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {left.map(column => (
                <DropdownMenuItem
                  key={column.id}
                  onClick={() => scrollToColumn(column, 'left')}
                >
                  <RiDatabase2Line className="size-4 text-muted-foreground" />
                  {column.id}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      after={(
        <div className="sticky inset-y-0 right-0 z-20 flex w-0 items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                className={cn(
                  `
                    group absolute top-1/2 -translate-y-1/2 shadow-none
                    transition-[right,opacity] duration-150
                  `,
                  right.length > 0
                    ? 'right-2 opacity-100'
                    : `pointer-events-none right-0 opacity-0`,
                )}
              >
                <RiArrowRightSLine className="relative z-10 size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="min-w-48">
              <DropdownMenuLabel>Scroll to column</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {right.map(column => (
                <DropdownMenuItem
                  key={column.id}
                  onClick={() => scrollToColumn(column, 'right')}
                >
                  <RiDatabase2Line className="size-4 text-muted-foreground" />
                  {column.id}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    />
  )
}

export { Header as TableHeader }
