import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cn } from '@tamery/ui/lib/utils'
import type { ComponentProps } from 'react'

export const SidebarMenuButton = ({
  render,
  isActive = false,
  className,
  ...props
}: useRender.ComponentProps<'button'> &
  ComponentProps<'button'> & {
    isActive?: boolean
  }) =>
  useRender({
    defaultTagName: 'button',
    props: mergeProps<'button'>(
      {
        className: cn(
          `peer/menu-button text-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:focus-ring active:bg-foreground/10 active:text-accent-foreground data-active:bg-primary data-active:text-primary-foreground hover:data-active:bg-primary hover:data-active:text-primary-foreground flex h-7 w-full cursor-default items-center gap-2 overflow-hidden rounded-md px-2 py-2 text-left text-sm whitespace-nowrap outline-hidden select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 [&>span:last-child]:truncate`,
          className
        ),
      },
      props
    ),
    render,
    state: {
      active: isActive,
      sidebar: 'menu-button',
      slot: 'sidebar-menu-button',
    },
  })
