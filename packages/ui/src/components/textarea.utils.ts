import { cva } from 'class-variance-authority'

export const textareaVariants = cva(
  `placeholder:text-muted-foreground flex field-sizing-content w-full resize-none outline-none disabled:cursor-not-allowed disabled:opacity-50`,
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        default: `bg-input focus-visible:focus-ring aria-invalid:invalid-ring min-h-16 rounded-xl border border-transparent px-2.5 py-2 text-base transition-[color,box-shadow] duration-200 md:text-sm`,
        flat: `min-h-8 px-2 py-2 text-xs`,
      },
    },
  }
)
