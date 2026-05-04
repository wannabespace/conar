import type { LinkProps } from '@tanstack/react-router'
import type { ComponentProps } from 'react'
import { cn } from '@conar/ui/lib/utils'
import { Link } from '@tanstack/react-router'

const baseClasses = 'flex w-full items-center gap-2 rounded-md border px-2 py-1 text-sm'
const activeClasses = 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/20'
const inactiveClasses = 'border-transparent text-foreground hover:bg-accent/30'

export function SidebarButton({ className, active, ...props }: ComponentProps<'button'> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(baseClasses, className, active ? activeClasses : inactiveClasses)}
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
      activeProps={{ className: activeClasses }}
      inactiveProps={{ className: inactiveClasses }}
      className={cn(baseClasses, className)}
      {...props}
    />
  )
}
