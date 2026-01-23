import type { LinkProps } from '@tanstack/react-router'
import { Button } from '@conar/ui/components/button'
import { Link } from '@tanstack/react-router'

export function SidebarLink({ onClick, ...props }: LinkProps & { onClick?: () => void }) {
  return (
    <Button
      variant="ghost"
      asChild
      className="w-full justify-start gap-2 border border-transparent"
    >
      <Link
        activeProps={{ className: '!border-primary/20 !bg-primary/10 text-primary hover:!bg-primary/20' }}
        onClick={onClick}
        {...props}
      />
    </Button>
  )
}
