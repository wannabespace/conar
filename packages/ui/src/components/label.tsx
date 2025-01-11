import { cn } from '@connnect/ui/lib/utils'
import * as LabelPrimitive from '@radix-ui/react-label'
import * as React from 'react'

function Label({ ref, className, ...props }: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & { ref?: React.RefObject<React.ComponentRef<typeof LabelPrimitive.Root>> }) {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn('mb-2 text-sm leading-none transition-all duration-200 peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)}
      {...props}
    />
  )
}
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
