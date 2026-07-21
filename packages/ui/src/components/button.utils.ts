import { Button } from '@tamery/ui/components/button'
import { cva } from 'class-variance-authority'
import { motion } from 'motion/react'

export const buttonVariants = cva(
  `
    group/button inline-flex shrink-0 cursor-default items-center
    justify-center rounded-xl border border-transparent
    text-sm font-medium whitespace-nowrap transition-all outline-none
    select-none
    focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30
    active:not-aria-[haspopup]:translate-y-px
    disabled:pointer-events-none disabled:opacity-50
    aria-invalid:border-destructive/60 aria-invalid:ring-3
    aria-invalid:ring-destructive/30
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
          bg-input shadow-xs ring-[0.5px] ring-foreground/4
          hover:bg-[color-mix(in_oklch,var(--input),var(--foreground)_6%)]
          hover:text-foreground
          aria-expanded:bg-[color-mix(in_oklch,var(--input),var(--foreground)_6%)]
          aria-expanded:text-foreground
        `,
        secondary: `
          bg-secondary text-secondary-foreground
          hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]
          aria-expanded:bg-secondary aria-expanded:text-secondary-foreground
        `,
        ghost: `
          hover:bg-foreground/5 hover:text-foreground
          aria-expanded:bg-foreground/5 aria-expanded:text-foreground
        `,
        destructive: `
          bg-destructive/10 text-destructive
          hover:bg-destructive/20
          focus-visible:border-destructive/40
          focus-visible:ring-destructive/30
        `,
        warning: `
          bg-warning/10 text-warning
          hover:bg-warning/20
          focus-visible:border-warning/40 focus-visible:ring-warning/20
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
          h-6 gap-1 rounded-md px-2.5 text-xs
          has-data-[icon=inline-end]:pr-2
          has-data-[icon=inline-start]:pl-2
          [&_svg:not([class*='size-'])]:size-3
        `,
        'sm': `
          h-7 gap-1 rounded-lg px-3
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
          size-6 rounded-md
          [&_svg:not([class*='size-'])]:size-3
        `,
        'icon-sm': 'size-7 rounded-lg',
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
