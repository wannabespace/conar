import { Marker } from '@tamery/ui/components/marker'
import { cva } from 'class-variance-authority'
import { motion } from 'motion/react'

export const markerVariants = cva(
  `
    group/marker relative flex min-h-4 w-full items-center gap-2 text-left
    text-sm text-muted-foreground
    [&_svg:not([class*='size-'])]:size-4
    [a]:underline [a]:underline-offset-3
    [a]:hover:text-foreground
  `,
  {
    variants: {
      variant: {
        default: '',
        separator:
          `
            before:mr-1 before:h-px before:min-w-0 before:flex-1
            before:bg-border
            after:ml-1 after:h-px after:min-w-0 after:flex-1 after:bg-border
          `,
        border: 'border-b border-border pb-2',
      },
    },
  },
)

export const MarkerMotion = motion.create(Marker)
