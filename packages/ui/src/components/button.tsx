import type { VariantProps } from 'class-variance-authority'
import type * as React from 'react'
import { cn } from '@conar/ui/lib/utils'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'

// eslint-disable-next-line react-refresh/only-export-components
export const buttonVariants = cva(
  'relative cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 active:scale-97 [&_svg]:pointer-events-none [&_svg:not([class*=\'size-\'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-md shadow-black/3 [text-shadow:0_1px_rgba(0,0,0,0.2)] hover:bg-primary/90',
        destructive:
          'bg-destructive text-white shadow-md shadow-black/3 [text-shadow:0_1px_rgba(0,0,0,0.2)] hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        warning:
          'bg-warning text-white shadow-md shadow-black/3 [text-shadow:0_1px_rgba(0,0,0,0.2)] hover:bg-warning/90 focus-visible:ring-warning/20 dark:focus-visible:ring-warning/40 dark:bg-warning/60',
        outline:
          'border bg-background text-foreground shadow-md shadow-black/3 hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-border dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'text-foreground hover:bg-accent/50 hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        'xs': 'h-6 text-xs rounded-sm shadow-none gap-1 px-2 has-[>svg]:px-2',
        'sm': 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        'default': 'h-9 px-4 py-2 has-[>svg]:px-3',
        'lg': 'h-10 rounded-md px-6 has-[>svg]:px-4',
        'icon': 'size-9',
        'icon-sm': 'size-8',
        'icon-xs': 'size-6 rounded-sm shadow-none',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export function Button({
  className,
  variant,
  size,
  type = 'button',
  asChild = false,
  ...props
}: React.ComponentProps<'button'>
  & VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}
