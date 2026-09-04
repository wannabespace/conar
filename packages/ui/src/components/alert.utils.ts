import { cva } from 'class-variance-authority'

export const alertVariants = cva(
  `group/alert relative grid w-full gap-0.5 border text-left has-data-[slot=alert-action]:relative has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2.5 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4`,
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        default: `rounded-2xl px-4 py-3 text-sm has-data-[slot=alert-action]:pr-18`,
        sm: `rounded-xl px-3 py-2.5 text-xs has-data-[slot=alert-action]:pr-16 *:data-[slot=alert-description]:text-xs`,
      },
      variant: {
        default: 'bg-card text-card-foreground',
        destructive: `border-destructive/15 bg-destructive/5 text-destructive *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current`,
        success: `border-success/15 bg-success/5 text-success *:data-[slot=alert-description]:text-success/90 *:[svg]:text-current`,
      },
    },
  }
)
