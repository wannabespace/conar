import { Tabs } from '@tamery/ui/components/tabs'
import { cva } from 'class-variance-authority'
import { motion } from 'motion/react'

export const tabsListVariants = cva(
  `
    group/tabs-list inline-flex w-fit items-center justify-center rounded-xl
    p-0.75 text-muted-foreground
    group-data-horizontal/tabs:h-8
    group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col
    group-data-vertical/tabs:p-1
    data-[variant=line]:rounded-none
  `,
  {
    variants: {
      variant: {
        default: 'bg-foreground/5',
        line: 'gap-1 bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export const TabsMotion = motion.create(Tabs)
