import { cva } from 'class-variance-authority'

export const kbdVariants = cva(
  `pointer-events-none inline-flex w-fit items-center justify-center font-sans font-medium tracking-normal select-none`,
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        default: `in-data-[slot=tooltip-content]:text-2xs in-data-[slot=dropdown-menu-shortcut]:text-2xs in-data-[slot=context-menu-shortcut]:text-2xs h-5 text-xs in-data-[slot=context-menu-shortcut]:h-4 in-data-[slot=dropdown-menu-shortcut]:h-4 in-data-[slot=tooltip-content]:h-4 in-data-[slot=context-menu-shortcut]:[&_svg]:size-2.5 in-data-[slot=dropdown-menu-shortcut]:[&_svg]:size-2.5 in-data-[slot=tooltip-content]:[&_svg]:size-2.5 [&_svg:not([class*='size-'])]:size-3`,
        lg: `h-9 min-w-9 px-2.5 text-base [&_svg]:size-4`,
      },
      variant: {
        default: `text-muted-foreground/80 in-data-[slot=tooltip-content]:text-card`,
        keycap: `bg-input ring-foreground/4 rounded-lg shadow-md ring transition-shadow duration-100 data-pressed:shadow-xs`,
      },
    },
  }
)
