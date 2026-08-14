import { cva } from 'class-variance-authority'

export const markerVariants = cva(
  `group/marker text-muted-foreground [a]:hover:text-foreground relative flex min-h-4 w-full items-center gap-2 text-left text-sm [&_svg:not([class*='size-'])]:size-4 [a]:underline [a]:underline-offset-3`,
  {
    variants: {
      variant: {
        border: 'border-border border-b pb-2',
        default: '',
        separator: `before:bg-border after:bg-border before:mr-1 before:h-px before:min-w-0 before:flex-1 after:ml-1 after:h-px after:min-w-0 after:flex-1`,
      },
    },
  }
)
