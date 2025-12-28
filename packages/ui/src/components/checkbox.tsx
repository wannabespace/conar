import type * as React from 'react'
import { cn } from '@conar/ui/lib/utils'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { RiCheckLine } from '@remixicon/react'

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        `
          peer size-4 shrink-0 rounded-[4px] border border-border shadow-xs
          transition-shadow outline-none
          focus-visible:border-ring focus-visible:ring-[3px]
          focus-visible:ring-ring/50
          disabled:cursor-not-allowed disabled:opacity-50
          aria-invalid:border-destructive aria-invalid:ring-destructive/20
          data-[state=checked]:border-primary data-[state=checked]:bg-primary
          data-[state=checked]:text-primary-foreground
          dark:bg-input/30 dark:aria-invalid:ring-destructive/40
          dark:data-[state=checked]:bg-primary
        `,
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className={`
          flex items-center justify-center text-current transition-none
        `}
      >
        <RiCheckLine className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
