import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import { cn } from '@tamery/ui/lib/utils'
import type { ComponentProps } from 'react'

import { useTableContext } from './table-context'

export function Table({ className, children, ...props }: Omit<ComponentProps<'div'>, 'ref'>) {
  const scrollRef = useTableContext(state => state.scrollRef)

  return (
    <ScrollArea ref={scrollRef} className={cn('size-full', className)} {...props}>
      {children}
    </ScrollArea>
  )
}
