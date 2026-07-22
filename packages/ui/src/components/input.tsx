import { Input as InputPrimitive } from '@base-ui/react/input'
import { cn } from '@tamery/ui/lib/utils'
import * as React from 'react'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        `
          h-8 w-full min-w-0 rounded-xl border border-transparent bg-input
          px-2.5 py-1 text-base shadow-xs
          ring-[0.5px] ring-foreground/4 transition-shadow duration-200
          outline-none
          file:inline-flex file:h-6 file:border-0 file:bg-transparent
          file:text-sm file:font-medium file:text-foreground
          placeholder:text-muted-foreground
          focus-visible:border-ring focus-visible:ring-3
          focus-visible:ring-ring/30
          disabled:pointer-events-none disabled:cursor-not-allowed
          disabled:opacity-50
          aria-invalid:border-destructive/60 aria-invalid:ring-3
          aria-invalid:ring-destructive/30
          md:text-sm
        `,
        className,
      )}
      {...props}
    />
  )
}

export { Input }
