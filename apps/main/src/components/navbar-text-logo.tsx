import type { LinkProps } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'

export const NavbarTextLogo = ({ to }: { to: LinkProps['to'] }) => (
  <div className="flex flex-1 items-center gap-2">
    <Link
      to={to}
      className="text-foreground text-base font-medium tracking-tighter sm:text-lg lg:text-xl"
    >
      Tamery
    </Link>
  </div>
)
