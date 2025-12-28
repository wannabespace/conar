import { cva } from 'class-variance-authority'

export const badgeVariants = cva(
  `
    inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden
    rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap
    transition-[color,box-shadow]
    focus-visible:border-ring focus-visible:ring-[3px]
    focus-visible:ring-ring/50
    aria-invalid:border-destructive aria-invalid:ring-destructive/20
    dark:aria-invalid:ring-destructive/40
    [&>svg]:pointer-events-none [&>svg]:size-3
  `,
  {
    variants: {
      variant: {
        default:
          `
            border-transparent bg-primary text-primary-foreground
            [a&]:hover:bg-primary/90
          `,
        secondary:
          `
            border-transparent bg-secondary text-secondary-foreground
            [a&]:hover:bg-secondary/90
          `,
        destructive:
          `
            border-transparent bg-destructive text-white
            focus-visible:ring-destructive/20
            dark:bg-destructive/70 dark:focus-visible:ring-destructive/40
            [a&]:hover:bg-destructive/90
          `,
        success:
          `
            border-transparent bg-success text-success-foreground
            focus-visible:ring-success/20
            dark:bg-success/70 dark:focus-visible:ring-success/40
            [a&]:hover:bg-success/90
          `,
        outline:
          `
            text-foreground
            [a&]:hover:bg-accent [a&]:hover:text-accent-foreground
          `,
        warning:
          `
            border-transparent bg-warning text-warning-foreground
            [a&]:hover:bg-warning/90
          `,
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)
