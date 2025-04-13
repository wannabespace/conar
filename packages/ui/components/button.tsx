import type { VariantProps } from 'class-variance-authority'
import { cn } from '@connnect/ui/lib/utils'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import * as React from 'react'

const beforeClasses = 'before:absolute before:block before:rounded-full before:blur-xl before:h-full before:-top-3 before:opacity-50 before:left-1/2 before:-translate-x-1/2 before:h-5 before:w-1/3'

const buttonVariants = cva(
  'relative overflow-hidden cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*=\'size-\'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
  {
    variants: {
      variant: {
        default:
          `bg-primary text-primary-foreground shadow-md shadow-black/3 [text-shadow:0_1px_rgba(0,0,0,0.2)] hover:bg-primary/90 ${beforeClasses} before:bg-white`,
        destructive:
          `bg-destructive text-white shadow-md shadow-black/3 [text-shadow:0_1px_rgba(0,0,0,0.2)] hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 ${beforeClasses} before:bg-white`,
        outline:
          'border bg-background text-foreground shadow-md shadow-black/3 hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-border dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'text-foreground hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        xs: 'h-6 text-xs rounded-sm shadow-none gap-1 px-2 has-[>svg]:px-2',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        iconSm: 'size-8',
        iconXs: 'size-6 rounded-sm shadow-none',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  type = 'button',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
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

export { Button, buttonVariants }
