import { cva } from 'class-variance-authority'

export const toggleVariants = cva(
  `group/toggle hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:border-destructive/60 aria-invalid:ring-destructive/30 aria-pressed:bg-muted inline-flex items-center justify-center gap-1 rounded-xl text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4`,
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        default: `h-8 min-w-8 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2`,
        lg: `h-9 min-w-9 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2`,
        sm: `h-7 min-w-7 rounded-lg px-2.5 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5`,
      },
      variant: {
        default: 'bg-transparent',
        outline: `border-input hover:bg-muted border bg-transparent`,
      },
    },
  }
)
