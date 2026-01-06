import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  `
    relative inline-flex shrink-0 cursor-pointer items-center justify-center
    gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all
    duration-100 outline-none
    focus-visible:border-ring focus-visible:ring-[3px]
    focus-visible:ring-ring/50
    active:scale-98
    disabled:pointer-events-none disabled:opacity-50
    aria-invalid:border-destructive aria-invalid:ring-destructive/20
    dark:aria-invalid:ring-destructive/40
    [&_svg]:pointer-events-none [&_svg]:shrink-0
    [&_svg:not([class*=\'size-\'])]:size-4
  `,
  {
    variants: {
      variant: {
        default:
          `
            bg-primary text-primary-foreground shadow-md shadow-black/3
            [text-shadow:0_1px_rgba(0,0,0,0.2)]
            hover:bg-primary/90
          `,
        destructive:
          `
            bg-destructive text-white shadow-md shadow-black/3
            [text-shadow:0_1px_rgba(0,0,0,0.2)]
            hover:bg-destructive/90
            focus-visible:ring-destructive/20
            dark:bg-destructive/60 dark:focus-visible:ring-destructive/40
          `,
        warning:
          `
            bg-warning text-white shadow-md shadow-black/3
            [text-shadow:0_1px_rgba(0,0,0,0.2)]
            hover:bg-warning/90
            focus-visible:ring-warning/20
            dark:bg-warning/60 dark:focus-visible:ring-warning/40
          `,
        outline:
          `
            border bg-background text-foreground shadow-md shadow-black/3
            hover:bg-accent hover:text-accent-foreground
            dark:border-border dark:bg-input/30 dark:hover:bg-input/50
          `,
        secondary:
          `
            bg-secondary text-secondary-foreground
            hover:bg-secondary/80
          `,
        ghost:
          `
            text-foreground
            hover:bg-accent/50 hover:text-accent-foreground
          `,
        link: `
          text-primary underline-offset-4
          hover:underline
        `,
      },
      size: {
        'xs': `
          h-6 gap-1 rounded-sm px-2 text-xs shadow-none
          has-[>svg]:px-2
        `,
        'sm': `
          h-8 gap-1.5 rounded-md px-3
          has-[>svg]:px-2.5
        `,
        'default': `
          h-9 px-4 py-2
          has-[>svg]:px-3
        `,
        'lg': `
          h-10 rounded-md px-6
          has-[>svg]:px-4
        `,
        'icon': 'size-9',
        'icon-sm': 'size-8',
        'icon-xs': 'size-6 rounded-sm shadow-none',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)
