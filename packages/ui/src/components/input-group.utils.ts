import { cva } from 'class-variance-authority'

export const inputGroupVariants = cva(
  `group/input-group relative flex h-8 w-full min-w-0 items-center transition-shadow duration-200 outline-none has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>textarea]:h-auto data-[size=sm]:h-7 data-[size=xs]:h-6 data-[size=sm]:*:data-[slot=input-group-control]:h-7 data-[size=xs]:*:data-[slot=input-group-control]:h-6 data-[size=xs]:*:data-[slot=input-group-control]:text-xs has-[>[data-align=block-end]]:[&>input]:pt-3 has-[>[data-align=block-start]]:[&>input]:pb-3 has-[>[data-align=inline-end]]:[&>input]:pr-1.5 has-[>[data-align=inline-start]]:[&>input]:pl-1.5`,
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        default: `bg-input ring-foreground/4 hover:ring-foreground/12 has-[[data-slot=input-group-control]:focus-visible]:focus-ring has-[[data-slot][aria-invalid=true]]:invalid-ring rounded-xl border border-transparent shadow-xs ring focus-within:in-data-[slot=combobox-content]:border-inherit focus-within:in-data-[slot=combobox-content]:ring-0 data-[size=sm]:rounded-lg data-[size=xs]:rounded-md`,
        flat: `has-[[data-slot=input-group-control]:focus-visible]:focus-ring has-[[data-slot][aria-invalid=true]]:invalid-ring bg-transparent first:rounded-t-xl last:rounded-b-xl`,
      },
    },
  }
)

export const inputGroupAddonVariants = cva(
  `text-muted-foreground **:data-[slot=kbd]:bg-muted-foreground/10 flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm select-none group-data-[disabled=true]/input-group:opacity-50 **:data-[slot=kbd]:rounded-md **:data-[slot=kbd]:px-1.5 [&>svg:not([class*='size-'])]:size-4`,
  {
    defaultVariants: {
      align: 'inline-start',
    },
    variants: {
      align: {
        'block-end': `order-last w-full justify-start px-2.5 pb-2 group-has-[>input]/input-group:pb-2 [.border-t]:pt-2`,
        'block-start': `order-first w-full justify-start px-2.5 pt-2 group-has-[>input]/input-group:pt-2 [.border-b]:pb-2`,
        'inline-end': `order-last pr-2.5 has-[>[data-slot=button]]:mr-[-0.3rem] has-[>kbd]:mr-[-0.15rem]`,
        'inline-start': `order-first pl-2.5 has-[>[data-slot=button]]:ml-[-0.3rem] has-[>kbd]:ml-[-0.15rem]`,
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
        'icon-xs': `size-6 rounded-md p-0 has-[>svg]:p-0 [&_svg:not([class*='size-'])]:size-3.5`,
        sm: '',
        xs: `h-6 gap-1 rounded-md px-1.5 [&>svg:not([class*='size-'])]:size-3.5`,
      },
    },
  }
)
