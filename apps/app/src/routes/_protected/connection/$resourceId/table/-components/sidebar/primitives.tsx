import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { Skeleton } from '@tamery/ui/components/skeleton'
import { cn } from '@tamery/ui/lib/utils'
import type { CSSProperties } from 'react'
import * as React from 'react'

export const SidebarContent = ({
  className,
  ...props
}: React.ComponentProps<'div'>) => (
  <div
    data-slot="sidebar-content"
    className={cn(
      'no-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-auto',
      className
    )}
    {...props}
  />
)

export const SidebarMenu = ({
  className,
  ...props
}: React.ComponentProps<'ul'>) => (
  <ul
    className={cn('flex w-full min-w-0 flex-col gap-0.5', className)}
    {...props}
  />
)

export const SidebarMenuItem = ({
  className,
  ...props
}: React.ComponentProps<'li'>) => (
  <li className={cn('group/menu-item relative', className)} {...props} />
)

export const SidebarMenuButton = ({
  render,
  isActive = false,
  className,
  ...props
}: useRender.ComponentProps<'button'> &
  React.ComponentProps<'button'> & {
    isActive?: boolean
  }) =>
  useRender({
    defaultTagName: 'button',
    props: mergeProps<'button'>(
      {
        className: cn(
          `peer/menu-button hover:bg-accent/50 hover:text-accent-foreground focus-visible:ring-ring active:bg-accent/50 active:text-accent-foreground data-active:bg-accent/50 data-active:text-accent-foreground flex h-8 w-full items-center gap-2 overflow-hidden rounded-xl px-3 py-2 text-left text-sm whitespace-nowrap outline-hidden focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50 data-active:font-medium [&_svg]:size-4 [&_svg]:shrink-0 [&>span:last-child]:truncate`,
          className
        ),
      },
      props
    ),
    render,
    state: {
      slot: 'sidebar-menu-button',
      sidebar: 'menu-button',
      active: isActive,
    },
  })

export const SidebarMenuAction = ({
  className,
  render,
  showOnHover = false,
  ...props
}: useRender.ComponentProps<'button'> &
  React.ComponentProps<'button'> & {
    showOnHover?: boolean
  }) =>
  useRender({
    defaultTagName: 'button',
    props: mergeProps<'button'>(
      {
        className: cn(
          `text-foreground peer-hover/menu-button:text-accent-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-xl p-0 outline-hidden focus-visible:ring-3 [&>svg]:size-4 [&>svg]:shrink-0`,
          showOnHover &&
            `peer-data-active/menu-button:text-accent-foreground opacity-0 group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 aria-expanded:opacity-100`,
          className
        ),
      },
      props
    ),
    render,
    state: {
      slot: 'sidebar-menu-action',
      sidebar: 'menu-action',
    },
  })

export const SidebarMenuSkeleton = ({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<'div'> & {
  showIcon?: boolean
}) => {
  // Random skeleton width is fixed after mount; setter is intentionally unused.
  // oxlint-disable-next-line react/hook-use-state
  const [width] = React.useState(
    () => `${Math.floor(Math.random() * 40) + 50}%`
  )

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      className={cn('flex h-8 items-center gap-2 rounded-xl px-2', className)}
      {...props}
    >
      {showIcon && <Skeleton className="size-4 rounded-xl" />}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        style={
          {
            '--skeleton-width': width,
          } as CSSProperties
        }
      />
    </div>
  )
}

export const SidebarGroupLabel = ({
  className,
  render,
  ...props
}: useRender.ComponentProps<'div'> & React.ComponentProps<'div'>) =>
  useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        className: cn(
          `text-foreground/70 focus-visible:ring-ring flex h-8 shrink-0 items-center rounded-xl px-3 text-xs font-medium outline-hidden focus-visible:ring-3 [&>svg]:size-4 [&>svg]:shrink-0`,
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
