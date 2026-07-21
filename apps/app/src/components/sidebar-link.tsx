import { cn } from '@tamery/ui/lib/utils'
import type { LinkProps } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import type { ComponentProps } from 'react'

// Finder-style sidebar row: neutral at rest, solid primary fill when active
const baseClasses = `
  flex h-7 w-full cursor-default items-center gap-2 rounded-md px-2 text-sm
  text-foreground select-none
  [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-primary/75
`
const activeClasses = `
  bg-primary text-primary-foreground
  [&_svg]:text-primary-foreground
`
const inactiveClasses = 'hover:bg-accent/50'

export function SidebarButton({
  className,
  active,
  ...props
}: ComponentProps<'button'> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(baseClasses, active ? activeClasses : inactiveClasses, className)}
      {...props}
    />
  )
}

export function SidebarLink({
  className,
  ...props
}: LinkProps & Omit<ComponentProps<'a'>, 'children'>) {
  return (
    <Link
      // data-status variants instead of activeProps: TanStack Link concatenates
      // activeProps.className with the base, and the conflicting text/bg classes
      // resolve by stylesheet order instead of intent
      className={cn(
        baseClasses,
        `
          data-[status=active]:bg-primary
          data-[status=active]:text-primary-foreground
          data-[status=active]:[&_svg]:text-primary-foreground
          [&:not([data-status=active])]:hover:bg-accent/50
        `,
        className,
      )}
      {...props}
    />
  )
}
