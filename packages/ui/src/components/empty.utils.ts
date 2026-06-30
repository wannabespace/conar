import { Empty } from '@tamery/ui/components/empty'
import { cva } from 'class-variance-authority'
import { motion } from 'motion/react'

export const emptyMediaVariants = cva(
  `
    mb-2 flex shrink-0 items-center justify-center
    [&_svg]:pointer-events-none [&_svg]:shrink-0
  `,
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        icon: `
          flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted
          text-foreground
          [&_svg:not([class*='size-'])]:size-5
        `,
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export const EmptyMotion = motion.create(Empty)
