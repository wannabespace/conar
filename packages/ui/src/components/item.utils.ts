import { cva } from 'class-variance-authority'

export const itemVariants = cva(
  `group/item focus-visible:border-ring focus-visible:ring-ring/50 [a]:hover:bg-muted flex w-full flex-wrap items-center rounded-2xl border text-sm transition-colors duration-100 outline-none focus-visible:ring-[3px] [a]:transition-colors`,
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        default: 'gap-3.5 px-4 py-3.5',
        sm: 'gap-3.5 px-3.5 py-3',
        xs: `gap-2 px-2.5 py-2 in-data-[slot=dropdown-menu-content]:p-0`,
      },
      variant: {
        default: 'border-transparent',
        muted: 'bg-muted/50 border-transparent',
        outline: 'border-border',
      },
    },
  }
)

export const itemMediaVariants = cva(
  `flex shrink-0 items-center justify-center gap-2 group-has-data-[slot=item-description]/item:translate-y-0.5 group-has-data-[slot=item-description]/item:self-start [&_svg]:pointer-events-none`,
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        default: 'bg-transparent',
        icon: "[&_svg:not([class*='size-'])]:size-4",
        image: `size-10 overflow-hidden rounded-xl group-data-[size=sm]/item:size-8 group-data-[size=xs]/item:size-6 group-data-[size=xs]/item:rounded-lg [&_img]:size-full [&_img]:object-cover`,
      },
    },
  }
)
