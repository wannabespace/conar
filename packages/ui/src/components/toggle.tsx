'use client'

import type { VariantProps } from 'class-variance-authority'
import { cn } from '@connnect/ui/lib/utils'
import * as TogglePrimitive from '@radix-ui/react-toggle'
import { cva } from 'class-variance-authority'
import * as React from 'react'

const toggleVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline:
          'bg-transparent border border-border shadow-md shadow-black/2 hover:bg-accent/70 hover:text-accent-foreground',
      },
      size: {
        default: 'h-9 px-3 min-w-9',
        sm: 'h-8 px-2 min-w-8',
        lg: 'h-10 px-4 min-w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Toggle({ ref, className, variant, size, ...props }: React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants> & { ref?: React.RefObject<React.ComponentRef<typeof TogglePrimitive.Root> | null> }) {
  return (
    <TogglePrimitive.Root
      ref={ref}
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

Toggle.displayName = TogglePrimitive.Root.displayName

// eslint-disable-next-line react-refresh/only-export-components
export { Toggle, toggleVariants }
