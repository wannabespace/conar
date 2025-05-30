import type { ComponentProps } from 'react'
import { ScrollArea } from '@connnect/ui/components/custom/scroll-area'
import { cn } from '@connnect/ui/lib/utils'
import { useTableContext } from './provider'

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
