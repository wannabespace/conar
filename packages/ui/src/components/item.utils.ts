import { Item } from '@tamery/ui/components/item'
import { cva } from 'class-variance-authority'
import { motion } from 'motion/react'

export const itemVariants = cva(
  `
    group/item flex w-full flex-wrap items-center rounded-2xl border text-sm
    transition-colors duration-100 outline-none
    focus-visible:border-ring focus-visible:ring-[3px]
    focus-visible:ring-ring/50
    [a]:transition-colors
    [a]:hover:bg-muted
  `,
  {
    variants: {
      variant: {
        default: 'border-transparent',
        outline: 'border-border',
        muted: 'border-transparent bg-muted/50',
      },
      size: {
        default: 'gap-3.5 px-4 py-3.5',
        sm: 'gap-3.5 px-3.5 py-3',
        xs: `
          gap-2 px-2.5 py-2
          in-data-[slot=dropdown-menu-content]:p-0
        `,
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export const itemMediaVariants = cva(
  `
    flex shrink-0 items-center justify-center gap-2
    group-has-data-[slot=item-description]/item:translate-y-0.5
    group-has-data-[slot=item-description]/item:self-start
    [&_svg]:pointer-events-none
  `,
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        icon: '[&_svg:not([class*=\'size-\'])]:size-4',
        image:
          `
            size-10 overflow-hidden rounded-xl
            group-data-[size=sm]/item:size-8
            group-data-[size=xs]/item:size-6
            group-data-[size=xs]/item:rounded-lg
            [&_img]:size-full [&_img]:object-cover
          `,
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export const ItemMotion = motion.create(Item)
