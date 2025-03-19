import type { VariantProps } from 'class-variance-authority'
import { cn } from '@connnect/ui/lib/utils'
import { RiLoader4Fill } from '@remixicon/react'
import { cva } from 'class-variance-authority'
import { motion } from 'motion/react'
import * as React from 'react'

const beforeClasses = 'before:absolute before:block before:rounded-full before:blur-lg before:h-full before:-top-3 before:opacity-40 before:left-1/2 before:-translate-x-1/2 before:h-5 before:w-1/3'

const buttonVariants = cva(
  'relative cursor-pointer overflow-hidden inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          `border-b border-b-black/10 bg-primary text-white shadow-md shadow-black/2 [text-shadow:0_1px_rgba(0,0,0,0.2)] hover:bg-primary/80 ${beforeClasses} before:bg-white`,
        destructive:
          `border-b border-b-black/10 bg-destructive text-destructive-foreground shadow-md shadow-black/2 [text-shadow:0_1px_rgba(0,0,0,0.2)] hover:bg-destructive/80 ${beforeClasses} before:bg-white`,
        outline:
          'bg-element border border-border shadow-md shadow-black/2 hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        xs: 'h-6 rounded-sm px-2 text-xs [&_svg]:size-3',
        sm: 'h-8 rounded-md px-3 text-xs [&_svg]:size-3',
        default: 'h-9 px-4 py-2',
        lg: 'h-10 rounded-md px-8',
        icon: 'size-9',
        iconSm: 'size-8 [&_svg]:size-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps extends Pick<React.ComponentProps<'button'>, 'type' | 'disabled' | 'className'>, VariantProps<typeof buttonVariants> {
  loading?: boolean
  children: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
}

function Button({
  children,
  loading,
  disabled,
  className,
  type = 'button',
  variant,
  size,
  onClick,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      className={cn(buttonVariants({ variant, size, className }))}
      type={type}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      disabled={loading || disabled}
      onClick={onClick}
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
    </motion.button>
  )
}
Button.displayName = 'Button'

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants }
