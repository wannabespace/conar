import { Menu01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
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

import { Brand } from './brand'
import { ThemeButton } from './theme-button'

const useScrolled = () => {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 0))
  return scrolled
}

export const Navbar = () => {
  const scrolled = useScrolled()
  const { data: session } = authClient.useSession()
  const home = useHomePath()
  const links: { label: string; link: LinkProps }[] = [
    { label: 'Features', link: { hash: 'features', to: home } },
    { label: 'Pricing', link: { hash: 'pricing', to: home } },
    { label: 'FAQ', link: { hash: 'faq', to: home } },
    { label: 'Releases', link: { to: '/releases' } },
  ]

  return (
    <header
      data-scrolled={scrolled || undefined}
      className="data-scrolled:bg-body/80 data-scrolled:border-border sticky top-0 z-40 border-b border-transparent transition-colors data-scrolled:backdrop-blur-xl"
    >
      <nav
        aria-label="Main"
        className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6"
      >
        <div className="flex">
          <Brand to={home} />
        </div>
        <div className="hidden items-center md:flex">
          {links.map(({ label, link }) => (
            <Button
              key={label}
              variant="ghost-muted"
              size="sm"
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
            render={<Link to={session?.user ? '/account' : '/sign-in'} />}
          >
            {session?.user ? 'Account' : 'Sign in'}
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
              {links.map(({ label, link }) => (
                <DropdownMenuItem key={label} render={<Link {...link} />}>
                  {label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                render={<Link to={session?.user ? '/account' : '/sign-in'} />}
              >
                {session?.user ? 'Account' : 'Sign in'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </header>
  )
}
