import { cva } from 'class-variance-authority'

export const tabsListVariants = cva(
  `group/tabs-list text-muted-foreground inline-flex w-fit items-center justify-center rounded-xl p-0.75 group-data-[orientation=horizontal]/tabs:h-8 group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col group-data-[orientation=vertical]/tabs:p-1 data-[variant=line]:rounded-none`,
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        default: 'bg-foreground/5',
        line: 'gap-1 bg-transparent',
      },
    },
  }
)
