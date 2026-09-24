import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  `group/button focus-visible:focus-ring aria-invalid:invalid-ring inline-flex shrink-0 cursor-default items-center justify-center rounded-xl border border-transparent text-sm whitespace-nowrap transition-[transform,box-shadow,color,background-color,border-color] outline-none select-none active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-disabled:opacity-50 active:aria-disabled:translate-y-0 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4`,
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        default: `h-8 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5`,
        icon: 'size-8',
        'icon-2xs': `size-5 rounded-sm [&_svg:not([class*='size-'])]:size-3.5`,
        'icon-lg': 'size-9',
        'icon-sm': 'size-7 rounded-lg',
        'icon-xs': `size-6 rounded-md [&_svg:not([class*='size-'])]:size-3.5`,
        lg: `h-9 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3`,
        sm: `h-7 gap-1 rounded-lg px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2`,
        xs: `h-6 gap-1 rounded-md px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3`,
      },
      variant: {
        default: `bg-primary text-primary-foreground hover:bg-primary/80`,
        destructive: `bg-destructive hover:bg-destructive/85 text-white shadow-xs`,
        ghost: `hover:bg-accent hover:text-foreground aria-expanded:bg-accent aria-expanded:text-foreground aria-pressed:bg-foreground/10 aria-pressed:text-foreground transition-transform`,
        link: `text-primary px-0 underline-offset-4 hover:underline`,
        outline: `bg-input text-foreground ring-foreground/4 hover:ring-foreground/12 aria-expanded:ring-foreground/12 hover:bg-accent aria-expanded:bg-accent aria-pressed:bg-foreground/10 shadow-xs ring`,
        secondary: `bg-secondary text-secondary-foreground aria-expanded:bg-secondary aria-expanded:text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]`,
        warning: `bg-warning hover:bg-warning/85 text-white shadow-xs`,
      },
    },
  }
)
