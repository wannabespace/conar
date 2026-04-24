import { cva } from 'class-variance-authority'

export const toggleVariants = cva(
  `
    relative inline-flex shrink-0 cursor-pointer items-center justify-center
    gap-2 rounded-lg border text-base font-medium whitespace-nowrap
    text-foreground transition-shadow outline-none select-none
    before:pointer-events-none before:absolute before:inset-0
    before:rounded-[calc(var(--radius-lg)-var(--border-hairline))]
    hover:bg-accent
    focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1
    focus-visible:ring-offset-background
    disabled:pointer-events-none disabled:opacity-64
    data-pressed:bg-input/64 data-pressed:text-accent-foreground
    sm:text-sm
    pointer-coarse:after:absolute pointer-coarse:after:size-full
    pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11
    [&_svg]:pointer-events-none [&_svg]:-mx-0.5 [&_svg]:shrink-0
    [&_svg:not([class*='opacity-'])]:opacity-80
    [&_svg:not([class*='size-'])]:size-4.5
    sm:[&_svg:not([class*='size-'])]:size-4
  `,
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        default: `
          h-9 min-w-9 px-[calc(--spacing(2)-var(--border-hairline))]
          sm:h-8 sm:min-w-8
        `,
        lg: `
          h-10 min-w-10 px-[calc(--spacing(2.5)-var(--border-hairline))]
          sm:h-9 sm:min-w-9
        `,
        sm: `
          h-8 min-w-8 px-[calc(--spacing(1.5)-var(--border-hairline))]
          sm:h-7 sm:min-w-7
        `,
      },
      variant: {
        default: 'border-transparent',
        outline:
          `
            border-input bg-background shadow-xs/5
            not-dark:bg-clip-padding
            not-disabled:not-active:not-data-pressed:before:shadow-[0_var(--border-hairline)_--theme(--color-black/4%)]
            dark:bg-input/32
            dark:not-disabled:not-data-pressed:before:shadow-[0_-var(--border-hairline)_--theme(--color-white/2%)]
            dark:not-disabled:not-active:not-data-pressed:before:shadow-[0_-var(--border-hairline)_--theme(--color-white/6%)]
            dark:hover:bg-input/64
            dark:data-pressed:bg-input
            [:disabled,:active,[data-pressed]]:shadow-none
          `,
      },
    },
  },
)
