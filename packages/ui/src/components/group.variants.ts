import { cva } from 'class-variance-authority'

export const groupVariants = cva(
  `
    flex w-fit
    *:focus-visible:z-1
    *:has-focus-visible:z-1
    has-[>[data-slot=group]]:gap-2
    dark:*:[[data-slot=separator]:has(~button:hover):not(:has(~[data-slot=separator]~[data-slot]:hover)),[data-slot=separator]:has(~[data-slot][data-pressed]):not(:has(~[data-slot=separator]~[data-slot][data-pressed]))]:before:bg-input/64
    dark:*:[button:hover~[data-slot=separator]:not([data-slot]:hover~[data-slot=separator]~[data-slot=separator]),[data-slot][data-pressed]~[data-slot=separator]:not([data-slot][data-pressed]~[data-slot=separator]~[data-slot=separator])]:before:bg-input/64
  `,
  {
    defaultVariants: {
      orientation: 'horizontal',
    },
    variants: {
      orientation: {
        horizontal:
          `
            *:data-slot:has-[~[data-slot]]:rounded-e-none
            *:data-slot:has-[~[data-slot]]:border-e-0
            *:data-slot:has-[~[data-slot]]:before:rounded-e-none
            *:data-slot:not-data-[slot=separator]:has-[~[data-slot]]:before:-inset-e-[0.5px]
            *:pointer-coarse:after:min-w-auto
            *:[[data-slot]~[data-slot]]:rounded-s-none
            *:[[data-slot]~[data-slot]]:border-s-0
            *:[[data-slot]~[data-slot]]:before:rounded-s-none
            *:[[data-slot]~[data-slot]:not([data-slot=separator])]:before:-inset-s-[0.5px]
          `,
        vertical:
          `
            flex-col
            *:data-slot:has-[~[data-slot]]:rounded-b-none
            *:data-slot:has-[~[data-slot]]:border-b-0
            *:data-slot:has-[~[data-slot]]:before:rounded-b-none
            *:data-slot:not-data-[slot=separator]:has-[~[data-slot]]:before:-bottom-[0.5px]
            *:data-slot:not-data-[slot=separator]:has-[~[data-slot]]:before:hidden
            dark:*:first:before:block
            dark:*:last:before:hidden
            *:pointer-coarse:after:min-h-auto
            *:[[data-slot]~[data-slot]]:rounded-t-none
            *:[[data-slot]~[data-slot]]:border-t-0
            *:[[data-slot]~[data-slot]]:before:rounded-t-none
            *:[[data-slot]~[data-slot]:not([data-slot=separator])]:before:-top-[0.5px]
          `,
      },
    },
  },
)
