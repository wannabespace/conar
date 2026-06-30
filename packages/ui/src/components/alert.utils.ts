import { Alert } from '@tamery/ui/components/alert'
import { cva } from 'class-variance-authority'
import { motion } from 'motion/react'

export const alertVariants = cva(
  `
    group/alert relative grid w-full gap-0.5 rounded-2xl border px-4 py-3
    text-left text-sm
    has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18
    has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2.5
    *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current
    *:[svg:not([class*='size-'])]:size-4
  `,
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground',
        destructive:
          `
            bg-card text-destructive
            *:data-[slot=alert-description]:text-destructive/90
            *:[svg]:text-current
          `,
        success:
          `
            bg-card text-success
            *:data-[slot=alert-description]:text-success/90
            *:[svg]:text-current
          `,
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export const AlertMotion = motion.create(Alert)
