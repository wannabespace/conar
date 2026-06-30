import { Sidebar } from '@tamery/ui/components/sidebar'
import { cva } from 'class-variance-authority'
import { motion } from 'motion/react'

export const sidebarMenuButtonVariants = cva(
  `
    peer/menu-button group/menu-button flex w-full items-center gap-2
    overflow-hidden rounded-xl px-3 py-2 text-left text-sm whitespace-nowrap
    ring-sidebar-ring outline-hidden transition-[width,height,padding]
    duration-200
    group-has-data-[sidebar=menu-action]/menu-item:pr-8
    group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2!
    hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
    focus-visible:ring-3
    active:bg-sidebar-accent active:text-sidebar-accent-foreground
    disabled:pointer-events-none disabled:opacity-50
    has-[>svg:first-child]:pl-2.5
    has-[>svg:last-child]:pr-2.5
    aria-disabled:pointer-events-none aria-disabled:opacity-50
    data-open:hover:bg-sidebar-accent
    data-open:hover:text-sidebar-accent-foreground
    data-active:bg-sidebar-accent data-active:font-medium
    data-active:text-sidebar-accent-foreground
    [&_svg]:size-4 [&_svg]:shrink-0
    [&>span:last-child]:truncate
  `,
  {
    variants: {
      variant: {
        default: 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        outline:
          `
            bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))]
            hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
            hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]
          `,
      },
      size: {
        default: 'h-8 text-sm',
        sm: 'h-7 text-xs',
        lg: `
          h-12 px-3 text-sm
          group-data-[collapsible=icon]:p-0!
        `,
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export const SidebarMotion = motion.create(Sidebar)
