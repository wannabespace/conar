import { Button } from '@conar/ui/components/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { useIsScrolled } from '@conar/ui/hookas/use-is-scrolled'
import { useThrottledCallback } from '@conar/ui/hookas/use-throttled-callback'
import { cn } from '@conar/ui/lib/utils'
import { RiArrowLeftSLine, RiArrowRightSLine, RiDatabase2Line } from '@remixicon/react'
import { animate } from 'motion'
import { useEffect, useState } from 'react'

import { TableHeader, useTableContext } from '~/components/table'

interface HeaderColumn {
  name: string
  el: HTMLElement
}

function getNotVisibleColumns(element: HTMLDivElement) {
  const columns = Array.from(element.querySelectorAll<HTMLElement>('[data-column-name]'))
  const scrollLeft = element.scrollLeft
  const scrollRight = scrollLeft + element.clientWidth

  return columns.reduce<{
    left: HeaderColumn[]
    right: HeaderColumn[]
  }>((acc, el) => {
    const name = el.getAttribute('data-column-name')

    if (!name)
      return acc

    const left = el.offsetLeft
    const right = left + el.offsetWidth

    if (right <= scrollLeft) {
      acc.left.push({ name, el })
    }
    else if (left >= scrollRight) {
      acc.right.push({ name, el })
    }

    return acc
  }, { left: [], right: [] })
}

function Header() {
  const scrollRef = useTableContext(state => state.scrollRef)
  const direction = useTableContext(state => state.scrollDirection)
  const columns = useTableContext(state => state.columns)
  const isScrolled = useIsScrolled(scrollRef, { direction: 'vertical' })
  const [{ left, right }, setNotVisibleColumns] = useState<{ left: HeaderColumn[], right: HeaderColumn[] }>({ left: [], right: [] })

  function scrollToColumn(column: HeaderColumn, direction: 'left' | 'right') {
    const scrollEl = scrollRef.current

    if (!scrollEl)
      return

    const isFirst = column.el.getAttribute('data-first') === 'true'
    const isLast = column.el.getAttribute('data-last') === 'true'
    const extraSpace = isFirst || isLast ? 0 : direction === 'left' ? -40 : 40
    const targetScrollLeft = (direction === 'left'
      ? column.el.offsetLeft
      : column.el.offsetLeft + column.el.offsetWidth - scrollEl.clientWidth
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

    setNotVisibleColumns(getNotVisibleColumns(el))
  }, [direction], 200)

  useEffect(() => {
    const el = scrollRef.current

    if (!el)
      return

    el.addEventListener('scroll', updateScrollLeft)

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
      className={cn('flex transition-shadow duration-300', isScrolled && 'shadow-lg shadow-black/3')}
      before={(
        <div className="sticky z-20 left-0 inset-y-0 w-0 flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                className={cn(
                  'group absolute top-1/2 -translate-y-1/2 duration-150 transition-[left,opacity] shadow-none',
                  left.length > 0 ? 'opacity-100 left-2' : 'opacity-0 left-0 pointer-events-none',
                )}
              >
                <RiArrowLeftSLine className="relative z-10 size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="start" className="min-w-[12rem]">
              <DropdownMenuLabel>Scroll to column</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {left.map(column => (
                <DropdownMenuItem
                  key={column.name}
                  onClick={() => scrollToColumn(column, 'left')}
                >
                  <RiDatabase2Line className="size-4 text-muted-foreground" />
                  {column.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      after={(
        <div className="sticky z-20 right-0 inset-y-0 w-0 flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                className={cn(
                  'group absolute top-1/2 -translate-y-1/2 duration-150 transition-[right,opacity] shadow-none',
                  right.length > 0 ? 'opacity-100 right-2' : 'opacity-0 right-0 pointer-events-none',
                )}
              >
                <RiArrowRightSLine className="relative z-10 size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="min-w-[12rem]">
              <DropdownMenuLabel>Scroll to column</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {right.map(column => (
                <DropdownMenuItem
                  key={column.name}
                  onClick={() => scrollToColumn(column, 'right')}
                >
                  <RiDatabase2Line className="size-4 text-muted-foreground" />
                  {column.name}
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
