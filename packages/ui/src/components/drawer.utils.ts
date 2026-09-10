import { cva } from 'class-variance-authority'

export const drawerHeaderVariants = cva(
  `flex shrink-0 flex-col group-data-[swipe-axis=y]/drawer-popup:text-center md:text-left`,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'gap-0.5 p-4 pb-0 md:gap-1.5',
        sm: 'gap-0 border-b px-3 py-2.5',
      },
    },
  }
)

export const drawerFooterVariants = cva('mt-auto flex shrink-0 gap-2', {
  defaultVariants: {
    size: 'default',
  },
  variants: {
    size: {
      default: 'flex-col p-4 pt-0',
      sm: 'flex-row items-center border-t p-3',
    },
  },
})

export const drawerDescriptionVariants = cva(
  'text-muted-foreground text-balance',
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'text-sm',
        sm: 'text-xs',
      },
    },
  }
)
