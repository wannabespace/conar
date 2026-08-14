import { cva } from 'class-variance-authority'

export const badgeVariants = cva(
  `group/badge focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive/60 aria-invalid:ring-destructive/30 inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:ring-[3px] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:pointer-events-none [&>svg]:size-3!`,
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        default: `bg-primary text-primary-foreground [a]:hover:bg-primary/80`,
        destructive: `bg-destructive/15 text-destructive focus-visible:ring-destructive/30 [a]:hover:bg-destructive/25`,
        ghost: `hover:bg-foreground/5 hover:text-muted-foreground`,
        link: `text-primary underline-offset-4 hover:underline`,
        outline: `border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground`,
        secondary: `bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80`,
      },
    },
  }
)
