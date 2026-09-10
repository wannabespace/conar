import { cva } from 'class-variance-authority'

export const dialogContentVariants = cva(
  `bg-card text-foreground ring-foreground/4 fixed top-1/2 left-1/2 z-50 w-full max-w-[calc(100%-2rem)] -translate-1/2 rounded-[min(var(--radius-4xl),24px)] text-sm shadow-xl ring-[0.5px] duration-100 outline-none`,
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        default: 'grid gap-6 p-6 sm:max-w-md',
        panel: 'flex h-[70vh] max-h-140 flex-col overflow-hidden sm:max-w-3xl',
      },
    },
  }
)

export const dialogTitleVariants = cva(
  'font-heading leading-none font-medium',
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        default: 'text-base',
        panel: 'text-sm',
      },
    },
  }
)
