import { Menu01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { DOCS_URL } from '@tamery/shared/constants'
import { Button } from '@tamery/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@tamery/ui/components/dropdown-menu'
import type { LinkProps } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { useMotionValueEvent, useScroll } from 'motion/react'
import { useState } from 'react'

import { useHomePath } from '~/hooks/use-home-path'
import { authClient } from '~/lib/auth'
import { posthog } from '~/lib/posthog'

import { Brand } from './brand'
import { ThemeButton } from './theme-button'

export const Navbar = () => {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 0))
  const { data: session } = authClient.useSession()
  const home = useHomePath()
  const links: {
    label: string
    link: LinkProps
    onClick?: () => void
  }[] = [
    { label: 'Features', link: { hash: 'features', to: home } },
    { label: 'Pricing', link: { hash: 'pricing', to: home } },
    { label: 'FAQ', link: { hash: 'faq', to: home } },
    { label: 'Releases', link: { to: '/releases' } },
    {
      label: 'Docs',
      link: { href: DOCS_URL },
      onClick: () => posthog.capture('docs_opened', { source: 'navbar' }),
    },
  ]
  const account = session?.user
    ? { label: 'Account', to: '/account' as const }
    : { label: 'Sign in', to: '/sign-in' as const }

  return (
    <header className="sticky top-0 z-40 h-16">
      <nav
        aria-label="Main"
        data-scrolled={scrolled || undefined}
        className="data-scrolled:bg-popover/70 data-scrolled:ring-foreground/4 ease-house mx-auto grid h-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4 transition-[max-width,height,margin,padding,border-radius,background-color,box-shadow,backdrop-filter] duration-300 data-scrolled:mt-2 data-scrolled:h-12 data-scrolled:max-w-[min(64rem,100%-1rem)] data-scrolled:rounded-2xl data-scrolled:pr-2 data-scrolled:pl-4 data-scrolled:shadow-lg data-scrolled:ring data-scrolled:backdrop-blur-xl motion-reduce:transition-none sm:px-6"
      >
        <div className="flex">
          <Brand to={home} />
        </div>
        <div className="hidden items-center md:flex">
          {links.map(({ label, link, onClick }) => (
            <Button
              key={label}
              variant="ghost-muted"
              size="sm"
              onClick={onClick}
              render={<Link {...link} />}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="col-start-3 flex items-center justify-end gap-1">
          <ThemeButton />
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex"
            render={<Link to={account.to} />}
          >
            {account.label}
          </Button>
          <Button size="sm" render={<Link to="/download" />}>
            Download
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost-muted"
                  size="icon-sm"
                  className="md:hidden"
                  aria-label="Menu"
                />
              }
            >
              <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              {links.map(({ label, link, onClick }) => (
                <DropdownMenuItem
                  key={label}
                  onClick={onClick}
                  render={<Link {...link} />}
                >
                  {label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem render={<Link to={account.to} />}>
                {account.label}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </header>
  )
}
