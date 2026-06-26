import type { LinkProps } from '@tanstack/react-router'
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
        Tamery
      </Link>
    </div>
  )
}
