import type { LinkProps } from '@tanstack/react-router'
import { Badge } from '@conar/ui/components/badge'
import { Link } from '@tanstack/react-router'

export function NavbarTextLogo({ to }: { to: LinkProps['to'] }) {
  return (
    <div className="flex flex-1 items-center gap-2">
      <Link
        to={to}
        className={`
          text-base font-medium tracking-tighter text-foreground
          sm:text-lg
          lg:text-xl
        `}
      >
        Conar
      </Link>
      <Badge variant="default" className="bg-warning/20 text-warning">
        Beta
      </Badge>
    </div>
  )
}
