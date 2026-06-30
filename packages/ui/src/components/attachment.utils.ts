import { Attachment } from '@tamery/ui/components/attachment'
import { cva } from 'class-variance-authority'
import { motion } from 'motion/react'

export const attachmentVariants = cva(
  `
    group/attachment relative flex w-fit max-w-full min-w-0 shrink-0 flex-wrap
    rounded-2xl border bg-card text-card-foreground transition-colors
    focus-within:ring-1 focus-within:ring-ring/30
    has-[>a,>button]:hover:bg-muted/50
    data-[state=error]:border-destructive/30
    data-[state=idle]:border-dashed
  `,
  {
    variants: {
      size: {
        default:
          `
            gap-2 text-sm
            has-data-[slot=attachment-content]:px-2.5
            has-data-[slot=attachment-content]:py-2
            has-data-[slot=attachment-media]:p-2
          `,
        sm: `
          gap-2.5 text-xs
          has-data-[slot=attachment-content]:px-2
          has-data-[slot=attachment-content]:py-1.5
          has-data-[slot=attachment-media]:p-1.5
        `,
        xs: `
          gap-1.5 rounded-xl text-xs
          has-data-[slot=attachment-content]:px-1.5
          has-data-[slot=attachment-content]:py-1
          has-data-[slot=attachment-media]:p-1
        `,
      },
      orientation: {
        horizontal: 'min-w-40 items-center',
        vertical: `
          w-24 flex-col
          has-data-[slot=attachment-content]:w-30
        `,
      },
    },
  },
)

export const attachmentMediaVariants = cva(
  `
    relative flex aspect-square w-10 shrink-0 items-center justify-center
    overflow-hidden rounded-lg bg-muted text-foreground
    group-data-[orientation=vertical]/attachment:w-full
    group-data-[size=sm]/attachment:w-8
    group-data-[size=xs]/attachment:w-7
    group-data-[size=xs]/attachment:rounded-md
    group-data-[state=error]/attachment:bg-destructive/10
    group-data-[state=error]/attachment:text-destructive
    group-data-[orientation=vertical]/attachment:*:data-[slot=spinner]:size-6!
    [&_svg]:pointer-events-none
    [&_svg:not([class*='size-'])]:size-4
    group-data-[orientation=vertical]/attachment:[&_svg:not([class*='size-'])]:size-6
    group-data-[size=xs]/attachment:[&_svg:not([class*='size-'])]:size-3.5
  `,
  {
    variants: {
      variant: {
        icon: '',
        image:
          `
            opacity-60
            group-data-[state=done]/attachment:opacity-100
            group-data-[state=idle]/attachment:opacity-100
            *:[img]:aspect-square *:[img]:w-full *:[img]:object-cover
          `,
      },
    },
    defaultVariants: {
      variant: 'icon',
    },
  },
)

export const AttachmentMotion = motion.create(Attachment)
