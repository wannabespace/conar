import { cva } from 'class-variance-authority'

export const selectTriggerVariants = cva(
  `
    relative inline-flex min-h-9 w-full min-w-36 items-center justify-between
    gap-2 rounded-lg border border-input bg-background
    px-[calc(--spacing(3)-1px)] text-left text-base text-foreground shadow-xs/5
    ring-ring/24 transition-shadow outline-none select-none
    not-dark:bg-clip-padding
    before:pointer-events-none before:absolute before:inset-0
    before:rounded-[calc(var(--radius-lg)-1px)]
    not-data-disabled:not-focus-visible:not-aria-invalid:not-data-pressed:before:shadow-[0_1px_--theme(--color-black/4%)]
    focus-visible:border-ring focus-visible:ring-[0.1875rem]
    aria-invalid:border-destructive/36
    focus-visible:aria-invalid:border-destructive/64
    focus-visible:aria-invalid:ring-destructive/16
    data-disabled:pointer-events-none data-disabled:opacity-64
    sm:min-h-8 sm:text-sm
    dark:bg-input/32
    dark:not-data-disabled:not-focus-visible:not-aria-invalid:not-data-pressed:before:shadow-[0_-1px_--theme(--color-white/6%)]
    dark:aria-invalid:ring-destructive/24
    pointer-coarse:after:absolute pointer-coarse:after:size-full
    pointer-coarse:after:min-h-11
    [&_svg]:pointer-events-none [&_svg]:shrink-0
    [&_svg:not([class*='opacity-'])]:opacity-80
    [&_svg:not([class*='size-'])]:size-4.5
    sm:[&_svg:not([class*='size-'])]:size-4
    [[data-disabled],:focus-visible,[aria-invalid],[data-pressed]]:shadow-none
  `,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: '',
        lg: `
          min-h-10
          sm:min-h-9
        `,
        sm: `
          min-h-8 gap-1.5 px-[calc(--spacing(2.5)-1px)]
          sm:min-h-7
        `,
      },
    },
  },
)

export const selectTriggerIconClassName = '-me-1 size-4.5 opacity-80 sm:size-4'
