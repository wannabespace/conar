import type { VariantProps } from 'class-variance-authority'
import { toggleVariants } from '@connnect/ui/components/toggle'
import { cn } from '@connnect/ui/lib/utils'
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import * as React from 'react'

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: 'default',
  variant: 'default',
})

function ToggleGroup({ ref, className, variant, size, children, ...props }: React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants> & { ref?: React.RefObject<React.ComponentRef<typeof ToggleGroupPrimitive.Root> | null> }) {
  return (
    <ToggleGroupPrimitive.Root
      ref={ref}
      className={cn('inline-flex items-center gap-1', className)}
      {...props}
    >
      <ToggleGroupContext value={{ variant, size }}>
        {children}
      </ToggleGroupContext>
    </ToggleGroupPrimitive.Root>
  )
}

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

function ToggleGroupItem({ ref, className, children, variant, size, ...props }: React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleVariants> & { ref?: React.RefObject<React.ComponentRef<typeof ToggleGroupPrimitive.Item> | null> }) {
  const context = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
}

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }
