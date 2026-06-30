import { ButtonGroup } from '@tamery/ui/components/button-group'
import { cva } from 'class-variance-authority'
import { motion } from 'motion/react'

export const buttonGroupVariants = cva(
  `
    flex w-fit items-stretch
    *:focus-visible:relative *:focus-visible:z-10
    has-[>[data-slot=button-group]]:gap-2
    has-[>[data-variant=outline]]:*:data-[slot=input-group]:border-border
    has-[>[data-variant=outline]]:*:data-[slot=select-trigger]:border-border
    has-[>[data-variant=outline]]:[&>[data-slot=input-group]:has(:focus-visible)]:border-ring
    has-[>[data-variant=outline]]:[&>[data-slot=select-trigger]:focus-visible]:border-ring
    has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-2xl
    [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit
    [&>input]:flex-1
    has-[>[data-variant=outline]]:[&>input]:border-border
    has-[>[data-variant=outline]]:[&>input:focus-visible]:border-ring
  `,
  {
    variants: {
      orientation: {
        horizontal:
          `
            *:data-slot:rounded-r-none
            [&>[data-slot]:not(:has(~[data-slot]))]:rounded-r-2xl!
            [&>[data-slot]~[data-slot]]:rounded-l-none
            [&>[data-slot]~[data-slot]]:border-l-0
          `,
        vertical:
          `
            flex-col
            *:data-slot:rounded-b-none
            [&>[data-slot]:not(:has(~[data-slot]))]:rounded-b-2xl!
            [&>[data-slot]~[data-slot]]:rounded-t-none
            [&>[data-slot]~[data-slot]]:border-t-0
          `,
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
    },
  },
)

export const ButtonGroupMotion = motion.create(ButtonGroup)
