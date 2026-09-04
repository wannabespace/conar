import { cn } from '@tamery/ui/lib/utils'
import * as React from 'react'

const Textarea = ({
  className,
  ...props
}: React.ComponentProps<'textarea'>) => (
  <textarea
    data-slot="textarea"
    className={cn(
      `bg-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:border-destructive/60 aria-invalid:ring-destructive/30 flex field-sizing-content min-h-16 w-full resize-none rounded-xl border border-transparent px-2.5 py-2 text-base transition-[color,box-shadow] duration-200 outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 md:text-sm`,
      className
    )}
    {...props}
  />
)

export { Textarea }
