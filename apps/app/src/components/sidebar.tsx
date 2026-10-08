import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { pseudoRandom } from '@tamery/shared/utils'
import { Skeleton } from '@tamery/ui/components/skeleton'
import { cn } from '@tamery/ui/lib/utils'
import type { CSSProperties, ComponentProps } from 'react'

export const SidebarContent = ({
  className,
  ...props
}: ComponentProps<'div'>) => (
  <div
    data-slot="sidebar-content"
    className={cn(
      'no-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-auto',
      className
    )}
    {...props}
  />
)

export const SidebarMenu = ({ className, ...props }: ComponentProps<'ul'>) => (
  <ul
    className={cn('flex w-full min-w-0 flex-col gap-0.5', className)}
    {...props}
  />
)

export const SidebarMenuItem = ({
  className,
  ...props
}: ComponentProps<'li'>) => (
  <li className={cn('group/menu-item relative', className)} {...props} />
)

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
          `peer/menu-button text-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:focus-ring active:bg-foreground/10 active:text-accent-foreground data-active:bg-primary data-active:text-primary-foreground data-active:[&_svg]:text-primary-foreground hover:data-active:bg-primary hover:data-active:text-primary-foreground flex h-7 w-full cursor-default items-center gap-2 overflow-hidden rounded-md px-2 py-2 text-left text-sm whitespace-nowrap outline-hidden select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 [&>span:last-child]:truncate`,
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

export const SidebarMenuAction = ({
  className,
  render,
  showOnHover,
  ...props
}: useRender.ComponentProps<'button'> &
  ComponentProps<'button'> & {
    showOnHover?: boolean
  }) =>
  useRender({
    defaultTagName: 'button',
    props: mergeProps<'button'>(
      {
        className: cn(
          `text-foreground peer-hover/menu-button:text-accent-foreground hover:bg-foreground/10 hover:text-accent-foreground focus-visible:focus-ring absolute top-1 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden [&>svg]:size-4 [&>svg]:shrink-0`,
          showOnHover &&
            `peer-data-active/menu-button:text-accent-foreground opacity-0 group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 aria-expanded:opacity-100`,
          className
        ),
      },
      props
    ),
    render,
    state: {
      sidebar: 'menu-action',
      slot: 'sidebar-menu-action',
    },
  })

export const SidebarMenuSkeleton = ({
  className,
  seed,
  ...props
}: ComponentProps<'div'> & { seed: number }) => (
  <div
    data-slot="sidebar-menu-skeleton"
    className={cn('flex h-7 items-center gap-2 rounded-md px-2', className)}
    {...props}
  >
    <Skeleton className="size-4 rounded-xl" />
    <Skeleton
      className="h-4 max-w-(--skeleton-width) flex-1"
      style={
        // SAFETY: CSSProperties has no index signature for custom properties,
        // which are valid CSS and handled by React at runtime.
        {
          '--skeleton-width': `${Math.round(50 + pseudoRandom(seed) * 40)}%`,
        } as CSSProperties
      }
    />
  </div>
)

export const SidebarGroupLabel = ({
  className,
  render,
  ...props
}: useRender.ComponentProps<'div'> & ComponentProps<'div'>) =>
  useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        className: cn(
          `text-foreground/70 focus-visible:focus-ring flex h-8 shrink-0 items-center rounded-md px-3 text-xs font-medium outline-hidden [&>svg]:size-4 [&>svg]:shrink-0`,
          className
        ),
      },
      props
    ),
    render,
    state: {
      slot: 'sidebar-group-label',
    },
  })
