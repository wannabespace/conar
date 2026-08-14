import { cva } from 'class-variance-authority'

export const inputGroupAddonVariants = cva(
  `text-muted-foreground **:data-[slot=kbd]:bg-muted-foreground/10 flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium select-none group-data-[disabled=true]/input-group:opacity-50 **:data-[slot=kbd]:rounded-md **:data-[slot=kbd]:px-1.5 [&>svg:not([class*='size-'])]:size-4`,
  {
    defaultVariants: {
      align: 'inline-start',
    },
    variants: {
      align: {
        'block-end': `order-last w-full justify-start px-2.5 pb-2 group-has-[>input]/input-group:pb-2 [.border-t]:pt-2`,
        'block-start': `order-first w-full justify-start px-2.5 pt-2 group-has-[>input]/input-group:pt-2 [.border-b]:pb-2`,
        'inline-end': `order-last pr-2 has-[>button]:mr-[-0.3rem] has-[>kbd]:mr-[-0.15rem]`,
        'inline-start': `order-first pl-2 has-[>button]:ml-[-0.3rem] has-[>kbd]:ml-[-0.15rem]`,
      },
    },
  }
)

export const inputGroupButtonVariants = cva(
  'flex items-center gap-2 rounded-lg text-sm shadow-none',
  {
    defaultVariants: {
      size: 'xs',
    },
    variants: {
      size: {
        'icon-sm': `size-8 p-0 has-[>svg]:p-0`,
        'icon-xs': `size-6 rounded-md p-0 has-[>svg]:p-0`,
        sm: '',
        xs: `h-6 gap-1 rounded-md px-1.5 [&>svg:not([class*='size-'])]:size-3.5`,
      },
    },
  }
)
