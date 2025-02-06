import type { VariantProps } from 'class-variance-authority'
import type { HTMLMotionProps } from 'motion/react'
import { cn } from '@connnect/ui/lib/utils'
import { RiLoader4Fill } from '@remixicon/react'
// import { Link } from '@tanstack/react-router'
import { cva } from 'class-variance-authority'
import { motion } from 'motion/react'

import * as React from 'react'

const beforeClasses = 'before:absolute before:block before:rounded-full before:blur-lg before:h-full before:-top-3 before:opacity-40 before:left-1/2 before:-translate-x-1/2 before:h-5 before:w-1/3'

const buttonVariants = cva(
  'relative cursor-pointer overflow-hidden inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          `border-y border-b-black/10 border-t-white/30 bg-primary text-white shadow-md shadow-black/2 [text-shadow:0_1px_rgba(0,0,0,0.2)] hover:bg-primary/90 ${beforeClasses} before:bg-white`,
        destructive:
          'bg-destructive text-destructive-foreground shadow-md shadow-black/2 hover:bg-destructive/90',
        outline:
          'bg-background border border-border shadow-md shadow-black/3 hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'>,
  VariantProps<typeof buttonVariants> {
  loading?: boolean
  children: React.ReactNode
}

// const MotionLink = motion.create(Link)

function Button({
  ref,
  children,
  loading,
  disabled,
  className,
  type = 'button',
  variant,
  size,
  ...props
}: ButtonProps & { ref?: React.RefObject<HTMLButtonElement> }) {
  const Comp = motion.button

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      type={type}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      disabled={loading || disabled}
      {...props}
    >
      <span className={cn(loading ? '-translate-y-1/2' : 'translate-y-10', 'duration-150 absolute left-1/2 top-1/2 -translate-x-1/2')}>
        <RiLoader4Fill
          className={cn(
            'animate-spin size-5',
          )}
        />
      </span>
      <span className={cn('flex items-center duration-150 justify-center gap-2', loading ? '-translate-y-14' : 'translate-y-0')}>
        {children}
      </span>
    </Comp>
  )
}
Button.displayName = 'Button'

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants }
