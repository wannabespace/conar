import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  `group/button focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:border-destructive/60 aria-invalid:ring-destructive/30 inline-flex shrink-0 cursor-default items-center justify-center rounded-xl border border-transparent text-sm font-medium whitespace-nowrap transition-[transform,box-shadow] outline-none select-none focus-visible:ring-3 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-3 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4`,
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        default: `h-8 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5`,
        icon: 'size-8',
        'icon-lg': 'size-9',
        'icon-sm': 'size-7 rounded-lg',
        'icon-xs': `size-6 rounded-md [&_svg:not([class*='size-'])]:size-3`,
        lg: `h-9 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3`,
        sm: `h-7 gap-1 rounded-lg px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2`,
        xs: `h-6 gap-1 rounded-md px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3`,
      },
      variant: {
        default: `bg-primary text-primary-foreground hover:bg-primary/80`,
        destructive: `bg-destructive hover:bg-destructive/85 focus-visible:border-destructive/40 focus-visible:ring-destructive/30 text-white shadow-xs`,
        ghost: `hover:bg-foreground/5 hover:text-foreground aria-expanded:bg-foreground/5 aria-expanded:text-foreground`,
        link: `text-primary underline-offset-4 hover:underline`,
        outline: `bg-input ring-foreground/4 hover:text-foreground aria-expanded:text-foreground shadow-xs ring-[0.5px] hover:bg-[color-mix(in_oklch,var(--input),var(--foreground)_3%)] aria-expanded:bg-[color-mix(in_oklch,var(--input),var(--foreground)_3%)]`,
        secondary: `bg-secondary text-secondary-foreground aria-expanded:bg-secondary aria-expanded:text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]`,
        warning: `bg-warning hover:bg-warning/85 focus-visible:border-warning/40 focus-visible:ring-warning/20 text-white shadow-xs`,
      },
    },
  }
)
