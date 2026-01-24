import type { LinkProps } from '@tanstack/react-router'
import { cn } from '@conar/ui/lib/utils'
import { Link } from '@tanstack/react-router'

export function SidebarLink({
  onClick,
  active,
  ...props
}: LinkProps & { onClick?: () => void, active?: boolean }) {
  return (
    <Link
      activeProps={{ className: '!border-primary/20 !bg-primary/10 text-primary hover:!bg-primary/20' }}
      className={cn(`
        group flex w-full items-center gap-2 rounded-md border
        border-transparent px-2 py-1 text-sm text-foreground
        hover:bg-accent/30
      `, active && `
        border-primary/20 bg-primary/10
        hover:bg-primary/20
      `)}
      onClick={onClick}
      {...props}
    />
  )
}
