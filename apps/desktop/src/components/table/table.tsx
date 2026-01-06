import type { ComponentProps } from 'react'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { cn } from '@conar/ui/lib/utils'
import { useTableContext } from './use-table-context'

export function Table({
  className,
  children,
  ...props
}: Omit<ComponentProps<'div'>, 'ref'>) {
  const scrollRef = useTableContext(state => state.scrollRef)

  return (
    <ScrollArea
      ref={scrollRef}
      className={cn('size-full', className)}
      {...props}
    >
      {children}
    </ScrollArea>
  )
}
