import {
  GitBranchIcon,
  GithubIcon,
  Moon02Icon,
  Sun03Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { SOCIAL_LINKS } from '@tamery/shared/constants'
import { AppLogo } from '@tamery/ui/components/brand/app-logo'
import { Button } from '@tamery/ui/components/button'
import { NumberFlow } from '@tamery/ui/components/custom/number-flow'
import { ThemeToggle } from '@tamery/ui/components/custom/theme-toggle'
import { cn } from '@tamery/ui/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { motion, useScroll, useTransform } from 'motion/react'
import type { ComponentProps } from 'react'

import { NAVBAR_HEIGHT_BASE } from '~/constants'
import { authClient } from '~/lib/auth'
import { orpc } from '~/lib/orpc'

import { NavbarTextLogo } from './navbar-text-logo'

const AppLogoMotion = motion.create(AppLogo)

export const Navbar = ({ className, ...props }: ComponentProps<'header'>) => {
  const { scrollY } = useScroll()
  const scale = useTransform(scrollY, [0, NAVBAR_HEIGHT_BASE], [1.8, 1])
  const { data } = useQuery(orpc.repo.queryOptions())
  const { data: session } = authClient.useSession()
  const isSignedIn = !!session?.user

  return (
    <header
      className={cn(
        `flex items-center justify-between px-4 sm:px-0`,
        className
      )}
      {...props}
    >
      <NavbarTextLogo to={isSignedIn ? '/home' : '/'} />
      <div className="flex flex-1 justify-center">
        <Link to={isSignedIn ? '/home' : '/'} className="text-primary">
          <AppLogoMotion
            className="size-5 sm:size-6 lg:size-8"
            style={{ scale }}
          />
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="hidden gap-1 sm:flex sm:gap-2"
          render={<Link to="/releases" />}
        >
          <HugeiconsIcon
            icon={GitBranchIcon}
            strokeWidth={2}
            className="size-3 sm:size-4"
          />
          Releases
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="hidden gap-1 sm:flex sm:gap-2"
          render={
            <a
              href={SOCIAL_LINKS.GITHUB}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            />
          }
        >
          <HugeiconsIcon
            icon={GithubIcon}
            strokeWidth={2}
            className="size-3 sm:size-4"
          />
          <NumberFlow
            value={data?.stargazers_count || 0}
            className={cn(
              `text-xs tabular-nums duration-200 sm:text-sm`,
              !data && `text-muted-foreground animate-pulse`
            )}
          />
        </Button>
        <ThemeToggle
          side="bottom"
          render={<Button size="icon-sm" variant="ghost" />}
        >
          <HugeiconsIcon
            icon={Sun03Icon}
            strokeWidth={2}
            className="size-4 dark:hidden"
          />
          <HugeiconsIcon
            icon={Moon02Icon}
            strokeWidth={2}
            className="hidden size-4 dark:block"
          />
        </ThemeToggle>
        <Button
          variant="outline"
          size="sm"
          className="hidden gap-1 sm:flex sm:gap-2"
          render={isSignedIn ? <Link to="/account" /> : <Link to="/sign-in" />}
        >
          {isSignedIn ? 'Account' : 'Sign in'}
        </Button>
        <Button
          size="sm"
          className="gap-1 px-2 text-xs sm:gap-2 sm:px-3 sm:text-sm"
          render={<Link to="/download" />}
        >
          <span className="hidden sm:inline">Get Started</span>
          <span className="sm:hidden">Download</span>
        </Button>
      </div>
    </header>
  )
}
