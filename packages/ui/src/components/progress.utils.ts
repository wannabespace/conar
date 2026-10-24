import { cva } from 'class-variance-authority'

export const progressIndicatorVariants = cva(
  'ease-house data-indeterminate:animate-progress-sweep h-full rounded-full transition-[width] duration-450 data-indeterminate:w-[28%] motion-reduce:animate-none',
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        default: 'bg-foreground/75',
        destructive: 'bg-destructive',
        success: 'bg-success',
      },
    },
  }
)
