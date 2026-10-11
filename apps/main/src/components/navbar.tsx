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

import { useHomePath } from '~/hooks/use-home-path'
import { authClient } from '~/lib/auth'

import { Brand } from './brand'
import { GithubStars } from './github-stars'
import { ThemeButton } from './theme-button'

export const Navbar = () => {
  const { data: session } = authClient.useSession()
  const home = useHomePath()
  const links: { label: string; link: LinkProps }[] = [
    { label: 'Features', link: { hash: 'features', to: home } },
    { label: 'Pricing', link: { hash: 'pricing', to: home } },
    { label: 'FAQ', link: { hash: 'faq', to: home } },
    { label: 'Releases', link: { to: '/releases' } },
  ]

  return (
    <header className="sticky top-0 z-40 px-4 pt-3 sm:px-6">
      <nav
        aria-label="Main"
        className="bg-popover/70 ring-foreground/4 mx-auto flex h-12 max-w-6xl items-center gap-2 rounded-2xl pr-2 pl-4 shadow-sm ring backdrop-blur-xl"
      >
        <div className="flex flex-1 items-center">
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
        <div className="flex flex-1 items-center justify-end gap-1">
          <GithubStars className="hidden sm:inline-flex" />
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
