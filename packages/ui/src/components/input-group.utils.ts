import { InputGroup } from '@tamery/ui/components/input-group'
import { cva } from 'class-variance-authority'
import { motion } from 'motion/react'

export const inputGroupAddonVariants = cva(
  `
    flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm
    font-medium text-muted-foreground select-none
    group-data-[disabled=true]/input-group:opacity-50
    **:data-[slot=kbd]:rounded-2xl **:data-[slot=kbd]:bg-muted-foreground/10
    **:data-[slot=kbd]:px-1.5
    [&>svg:not([class*='size-'])]:size-4
  `,
  {
    variants: {
      align: {
        'inline-start': `
            order-first pl-2
            has-[>button]:ml-[-0.3rem]
            has-[>kbd]:ml-[-0.15rem]
          `,
        'inline-end': `
            order-last pr-2
            has-[>button]:mr-[-0.3rem]
            has-[>kbd]:mr-[-0.15rem]
          `,
        'block-start': `
            order-first w-full justify-start px-2.5 pt-2
            group-has-[>input]/input-group:pt-2
            [.border-b]:pb-2
          `,
        'block-end': `
            order-last w-full justify-start px-2.5 pb-2
            group-has-[>input]/input-group:pb-2
            [.border-t]:pt-2
          `,
      },
    },
    defaultVariants: {
      align: 'inline-start',
    },
  },
)

export const inputGroupButtonVariants = cva(
  'flex items-center gap-2 rounded-2xl text-sm shadow-none',
  {
    variants: {
      size: {
        'xs': `
          h-6 gap-1 rounded-xl px-1.5
          [&>svg:not([class*='size-'])]:size-3.5
        `,
        'sm': '',
        'icon-xs': `
          size-6 rounded-xl p-0
          has-[>svg]:p-0
        `,
        'icon-sm': `
          size-8 p-0
          has-[>svg]:p-0
        `,
      },
    },
    defaultVariants: {
      size: 'xs',
    },
  },
)

export const InputGroupMotion = motion.create(InputGroup)
