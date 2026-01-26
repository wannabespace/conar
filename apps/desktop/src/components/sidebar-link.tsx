import type { LinkProps } from '@tanstack/react-router'
import type { ComponentProps } from 'react'
import { cn } from '@conar/ui/lib/utils'
import { Link } from '@tanstack/react-router'

export function SidebarLink({
  className,
  ...props
}: LinkProps & Omit<ComponentProps<'a'>, 'children'>) {
  return (
    <Link
      activeProps={{ className: 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/20' }}
      inactiveProps={{ className: 'border-transparent text-foreground hover:bg-accent/30' }}
      className={cn(`
        flex w-full items-center gap-2 rounded-md border px-2 py-1 text-sm
      `, className)}
      {...props}
    />
  )
}
