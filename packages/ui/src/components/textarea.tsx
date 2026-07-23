import { cn } from '@tamery/ui/lib/utils'
import * as React from 'react'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        `
          flex field-sizing-content min-h-16 w-full resize-none rounded-2xl
          border border-transparent bg-input px-2.5 py-2 text-base
          transition-[color,box-shadow] duration-200 outline-none
          placeholder:text-muted-foreground
          focus-visible:border-ring focus-visible:ring-3
          focus-visible:ring-ring/30
          disabled:cursor-not-allowed disabled:opacity-50
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

export { Textarea }
