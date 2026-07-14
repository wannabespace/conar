import { Button } from '@tamery/ui/components/button'
import { cva } from 'class-variance-authority'
import { motion } from 'motion/react'

export const buttonVariants = cva(
  `
    group/button inline-flex shrink-0 items-center justify-center rounded-2xl
    border border-transparent bg-clip-padding text-sm font-medium
    whitespace-nowrap transition-all outline-none select-none
    focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30
    active:not-aria-[haspopup]:translate-y-px
    disabled:pointer-events-none disabled:opacity-50
    aria-invalid:border-destructive aria-invalid:ring-3
    aria-invalid:ring-destructive/20
    dark:aria-invalid:border-destructive/50
    dark:aria-invalid:ring-destructive/40
    [&_svg]:pointer-events-none [&_svg]:shrink-0
    [&_svg:not([class*='size-'])]:size-4
  `,
  {
    variants: {
      variant: {
        default: `
          bg-primary text-primary-foreground
          hover:bg-primary/80
        `,
        outline: `
            border-border bg-background
            hover:bg-muted hover:text-foreground
            aria-expanded:bg-muted aria-expanded:text-foreground
            dark:bg-transparent
            hover:dark:bg-input/30
          `,
        secondary: `
            bg-secondary text-secondary-foreground
            hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]
            aria-expanded:bg-secondary aria-expanded:text-secondary-foreground
          `,
        ghost: `
            hover:bg-accent hover:text-accent-foreground
            aria-expanded:bg-accent aria-expanded:text-accent-foreground
          `,
        destructive: `
            bg-destructive/10 text-destructive
            hover:bg-destructive/20
            focus-visible:border-destructive/40
            focus-visible:ring-destructive/20
            dark:bg-destructive/20
            hover:dark:bg-destructive/30
            focus-visible:dark:ring-destructive/40
          `,
        warning: `
            bg-warning/10 text-warning
            hover:bg-warning/20
            focus-visible:border-warning/40 focus-visible:ring-warning/20
            dark:bg-warning/20
            hover:dark:bg-warning/30
            focus-visible:dark:ring-warning/40
          `,
        link: `
          text-primary underline-offset-4
          hover:underline
        `,
      },
      size: {
        'default': `
            h-8 gap-1.5 px-3
            has-data-[icon=inline-end]:pr-2.5
            has-data-[icon=inline-start]:pl-2.5
          `,
        'xs': `
          h-6 gap-1 px-2.5 text-xs
          has-data-[icon=inline-end]:pr-2
          has-data-[icon=inline-start]:pl-2
          [&_svg:not([class*='size-'])]:size-3
        `,
        'sm': `
          h-7 gap-1 px-3
          has-data-[icon=inline-end]:pr-2
          has-data-[icon=inline-start]:pl-2
        `,
        'lg': `
          h-9 gap-1.5 px-4
          has-data-[icon=inline-end]:pr-3
          has-data-[icon=inline-start]:pl-3
        `,
        'icon': 'size-8',
        'icon-xs': `
          size-6
          [&_svg:not([class*='size-'])]:size-3
        `,
        'icon-sm': 'size-7',
        'icon-lg': 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export const ButtonMotion = motion.create(Button)
