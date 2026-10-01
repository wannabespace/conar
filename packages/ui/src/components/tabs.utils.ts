import { cva } from 'class-variance-authority'

export const tabsListVariants = cva(
  `group/tabs-list text-muted-foreground data-[variant=bar]:after:border-border inline-flex w-fit items-center justify-center rounded-xl p-0.75 group-data-[orientation=horizontal]/tabs:h-8 group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col group-data-[orientation=vertical]/tabs:p-1 data-[variant=bar]:w-full data-[variant=bar]:items-stretch data-[variant=bar]:justify-start data-[variant=bar]:rounded-none data-[variant=bar]:p-0 data-[variant=bar]:after:flex-1 data-[variant=bar]:after:self-stretch data-[variant=bar]:after:border-b data-[variant=line]:rounded-none`,
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        bar: 'bg-body/50 gap-0',
        default: 'bg-foreground/5',
        line: 'gap-1 bg-transparent',
      },
    },
  }
)
