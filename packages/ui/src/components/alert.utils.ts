import { cva } from 'class-variance-authority'

export const alertVariants = cva(
  `group/alert relative grid w-full gap-0.5 rounded-xl border px-3 py-2.5 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4`,
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        default: 'bg-card text-card-foreground',
        destructive: `border-destructive/25 bg-destructive/10 text-destructive *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current`,
        success: `border-success/25 bg-success/10 text-success *:data-[slot=alert-description]:text-success/90 *:[svg]:text-current`,
      },
    },
  }
)
