import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { Skeleton } from '@tamery/ui/components/skeleton'
import { cn } from '@tamery/ui/lib/utils'
import * as React from 'react'

export function SidebarContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn('no-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-auto', className)}
      {...props}
    />
  )
}

export function SidebarMenu({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul className={cn('flex w-full min-w-0 flex-col gap-0.5', className)} {...props} />
}

export function SidebarMenuItem({ className, ...props }: React.ComponentProps<'li'>) {
  return <li className={cn('group/menu-item relative', className)} {...props} />
}

export function SidebarMenuButton({
  render,
  isActive = false,
  className,
  ...props
}: useRender.ComponentProps<'button'> &
  React.ComponentProps<'button'> & {
    isActive?: boolean
  }) {
  return useRender({
    defaultTagName: 'button',
    props: mergeProps<'button'>(
      {
        className: cn(
          `
            peer/menu-button flex h-8 w-full items-center gap-2
            overflow-hidden rounded-xl px-3 py-2 text-left text-sm
            whitespace-nowrap outline-hidden
            hover:bg-accent hover:text-accent-foreground
            focus-visible:ring-3 focus-visible:ring-ring
            active:bg-accent active:text-accent-foreground
            disabled:pointer-events-none disabled:opacity-50
            data-active:bg-accent data-active:font-medium
            data-active:text-accent-foreground
            [&_svg]:size-4 [&_svg]:shrink-0
            [&>span:last-child]:truncate
          `,
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: 'sidebar-menu-button',
      sidebar: 'menu-button',
      active: isActive,
    },
  })
}

export function SidebarMenuAction({
  className,
  render,
  showOnHover = false,
  ...props
}: useRender.ComponentProps<'button'> &
  React.ComponentProps<'button'> & {
    showOnHover?: boolean
  }) {
  return useRender({
    defaultTagName: 'button',
    props: mergeProps<'button'>(
      {
        className: cn(
          `
            absolute top-1.5 right-1 flex aspect-square w-5 items-center
            justify-center rounded-xl p-0 text-foreground
            outline-hidden
            peer-hover/menu-button:text-accent-foreground
            hover:bg-accent hover:text-accent-foreground
            focus-visible:ring-3 focus-visible:ring-ring
            [&>svg]:size-4 [&>svg]:shrink-0
          `,
          showOnHover &&
            `
            opacity-0
            group-focus-within/menu-item:opacity-100
            group-hover/menu-item:opacity-100
            peer-data-active/menu-button:text-accent-foreground
            aria-expanded:opacity-100
          `,
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: 'sidebar-menu-action',
      sidebar: 'menu-action',
    },
  })
}

export function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<'div'> & {
  showIcon?: boolean
}) {
  const [width] = React.useState(() => `${Math.floor(Math.random() * 40) + 50}%`)

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      className={cn('flex h-8 items-center gap-2 rounded-xl px-2', className)}
      {...props}
    >
      {showIcon && <Skeleton className="size-4 rounded-xl" />}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        style={{
          '--skeleton-width': width,
        }}
      />
    </div>
  )
}

export function SidebarGroupLabel({
  className,
  render,
  ...props
}: useRender.ComponentProps<'div'> & React.ComponentProps<'div'>) {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        className: cn(
          `
            flex h-8 shrink-0 items-center rounded-xl px-3 text-xs
            font-medium text-foreground/70 outline-hidden
            focus-visible:ring-3 focus-visible:ring-ring
            [&>svg]:size-4 [&>svg]:shrink-0
          `,
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: 'sidebar-group-label',
    },
  })
}
