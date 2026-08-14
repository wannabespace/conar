import { Input as InputPrimitive } from '@base-ui/react/input'
import { cn } from '@tamery/ui/lib/utils'
import * as React from 'react'

const Input = ({
  className,
  type,
  ...props
}: React.ComponentProps<'input'>) => (
  <InputPrimitive
    type={type}
    data-slot="input"
    className={cn(
      `bg-input ring-foreground/4 file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:border-destructive/60 aria-invalid:ring-destructive/30 h-8 w-full min-w-0 rounded-xl border border-transparent px-2.5 py-1 text-base shadow-xs ring-[0.5px] transition-shadow duration-200 outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 md:text-sm`,
      className
    )}
    {...props}
  />
)

export { Input }
