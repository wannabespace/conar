import type { ComponentProps } from 'react'
import { SOCIAL_LINKS } from '@conar/shared/constants'
import { AppLogo } from '@conar/ui/components/brand/app-logo'
import { Button } from '@conar/ui/components/button'
import { ThemeToggle } from '@conar/ui/components/custom/theme-toggle'
import { cn } from '@conar/ui/lib/utils'
import NumberFlow from '@number-flow/react'
import { RiGitBranchLine, RiGithubFill, RiMoonLine, RiSunLine } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { motion, useScroll, useTransform } from 'motion/react'
import { NAVBAR_HEIGHT_BASE } from '~/constants'
import { authClient } from '~/lib/auth'
import { orpcQuery } from '~/lib/orpc'
import { NavbarTextLogo } from './navbar-text-logo'

const AppLogoMotion = motion.create(AppLogo)

export function Navbar({ className, ...props }: ComponentProps<'header'>) {
  const { scrollY } = useScroll()
  const scale = useTransform(scrollY, [0, NAVBAR_HEIGHT_BASE], [1.8, 1])
  const { data } = useQuery(orpcQuery.repo.queryOptions())
  const { data: session } = authClient.useSession()
  const isSignedIn = !!session?.user

  return (
    <header
      className={cn(`
        flex items-center justify-between px-4
        sm:px-0
      `, className)}
      {...props}
    >
      <NavbarTextLogo to={isSignedIn ? '/home' : '/'} />
      <div className="flex flex-1 justify-center">
        <Link to={isSignedIn ? '/home' : '/'} className="text-primary">
          <AppLogoMotion
            className={`
              size-5
              sm:size-6
              lg:size-8
            `}
            style={{ scale }}
          />
        </Link>
      </div>
      <div className={`
        flex flex-1 items-center justify-end gap-1
        sm:gap-2
      `}
      >
        <Button
          variant="ghost"
          size="sm"
          className={`
            hidden gap-1
            sm:flex sm:gap-2
          `}
          asChild
        >
          <Link to="/releases">
            <RiGitBranchLine className={`
              size-3
              sm:size-4
            `}
            />
            Releases
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`
            hidden gap-1
            sm:flex sm:gap-2
          `}
          asChild
        >
          <a
            href={SOCIAL_LINKS.GITHUB}
            target="_blank"
            rel="noopener noreferrer"
          >
            <RiGithubFill className={`
              size-3
              sm:size-4
            `}
            />
            <NumberFlow
              value={data?.stargazers_count || 0}
              className={cn(`
                text-xs tabular-nums duration-200
                sm:text-sm
              `, !data && `animate-pulse text-muted-foreground`)}
            />
          </a>
        </Button>
        <ThemeToggle side="bottom">
          <Button size="icon-sm" variant="ghost">
            <RiSunLine className={`
              size-4
              dark:hidden
            `}
            />
            <RiMoonLine className={`
              hidden size-4
              dark:block
            `}
            />
          </Button>
        </ThemeToggle>
        <Button
          variant="outline"
          size="sm"
          className={`
            hidden gap-1
            sm:flex sm:gap-2
          `}
          asChild
        >
          {isSignedIn
            ? (
                <Link to="/account">
                  Account
                </Link>
              )
            : (
                <Link to="/sign-in">
                  Sign in
                </Link>
              )}
        </Button>
        <Button
          size="sm"
          className={`
            gap-1 px-2 text-xs
            sm:gap-2 sm:px-3 sm:text-sm
          `}
          asChild
        >
          <Link to="/download">
            <span className={`
              hidden
              sm:inline
            `}
            >
              Get Started
            </span>
            <span className="sm:hidden">Download</span>
          </Link>
        </Button>
      </div>
    </header>
  )
}
