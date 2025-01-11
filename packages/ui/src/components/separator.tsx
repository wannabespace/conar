import { cn } from '@connnect/ui/lib/utils'
import * as SeparatorPrimitive from '@radix-ui/react-separator'

import * as React from 'react'

function Separator({ ref, className, orientation = 'horizontal', decorative = true, ...props }: React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> & { ref?: React.RefObject<React.ComponentRef<typeof SeparatorPrimitive.Root>> }) {
  return (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
        className,
      )}
      {...props}
    />
  )
}
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
