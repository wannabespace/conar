import { cva } from 'class-variance-authority'

export const selectTriggerVariants = cva(
  `hover:text-foreground focus-visible:focus-ring data-placeholder:text-muted-foreground aria-invalid:invalid-ring flex w-fit cursor-default items-center justify-between gap-1.5 rounded-xl border border-transparent px-3 text-sm whitespace-nowrap transition-[color,background-color,box-shadow] duration-200 outline-none select-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-lg data-[size=xs]:h-6 data-[size=xs]:gap-1 data-[size=xs]:rounded-md data-[size=xs]:px-2.5 data-[size=xs]:text-xs *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 *:data-[slot=select-value]:overflow-hidden data-[size=xs]:*:data-[slot=select-value]:gap-1.5 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[size=xs]:[&_svg:not([class*='size-'])]:size-3`,
  {
    defaultVariants: {
      variant: 'outline',
    },
    variants: {
      variant: {
        flat: 'hover:bg-accent data-popup-open:bg-accent px-2.5',
        'ghost-row': 'hover:bg-foreground/5 data-popup-open:bg-foreground/5',
        outline:
          'bg-input ring-foreground/4 hover:ring-foreground/12 data-popup-open:ring-foreground/12 hover:bg-accent data-popup-open:bg-accent shadow-xs ring',
      },
    },
  }
)
