import { cn } from '@connnect/ui/lib/utils'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
)

function Label({ ref, className, ...props }: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
  VariantProps<typeof labelVariants> & { ref?: React.RefObject<React.ComponentRef<typeof LabelPrimitive.Root>> }) {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(labelVariants(), className)}
      {...props}
    />
  )
}
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
