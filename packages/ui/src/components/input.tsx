import type { VariantProps } from 'class-variance-authority'
import { cn } from '@connnect/ui/lib/utils'
import { cva } from 'class-variance-authority'
import * as React from 'react'

const inputVariants = cva(
  'flex w-full rounded-md bg-element border border-border py-1 text-base shadow-md shadow-black/2 transition-colors file:border-0 file:bg-background file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
  {
    variants: {
      size: {
        default: 'h-9 px-3 py-1',
        sm: 'h-8 px-2 text-xs',
        lg: 'h-10 px-4',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
)

export interface InputProps extends Omit<React.ComponentProps<'input'>, 'size'>, VariantProps<typeof inputVariants> {
  ref?: React.RefObject<HTMLInputElement> | React.RefCallback<HTMLInputElement>
}

function Input({ ref, className, type, size, ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(inputVariants({ size, className }))}
      ref={ref}
      autoCorrect="off"
      {...props}
    />
  )
}
Input.displayName = 'Input'

export { Input }
