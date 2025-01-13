import { cn } from '@connnect/ui/lib/utils'
import * as React from 'react'

function Input({ ref, className, type, ...props }: React.ComponentProps<'input'> & { ref?: React.RefObject<HTMLInputElement> | React.RefCallback<HTMLInputElement> }) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-background file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className,
      )}
      ref={ref}
      autoCorrect="off"
      {...props}
    />
  )
}
Input.displayName = 'Input'

export { Input }
