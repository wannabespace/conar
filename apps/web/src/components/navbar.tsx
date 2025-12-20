import type { ComponentProps } from 'react'
import { SOCIAL_LINKS } from '@conar/shared/constants'
import { Badge } from '@conar/ui/components/badge'
import { AppLogo } from '@conar/ui/components/brand/app-logo'
import { Button } from '@conar/ui/components/button'
import { cn } from '@conar/ui/lib/utils'
import NumberFlow from '@number-flow/react'
import { RiDiscordLine, RiGithubFill, RiTwitterXLine } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { motion, useScroll, useTransform } from 'motion/react'
import { getRepoOptions } from '~/queries'
import { NAVBAR_HEIGHT_BASE } from '~/routes/_layout'

const AppLogoMotion = motion.create(AppLogo)

export function Navbar({ className, ...props }: ComponentProps<'header'>) {
  const { scrollY } = useScroll()
  const scale = useTransform(scrollY, [0, NAVBAR_HEIGHT_BASE], [1.8, 1])
  const { data } = useQuery(getRepoOptions)

  return (
    <header className={cn('flex items-center justify-between px-4 sm:px-0', className)} {...props}>
      <div className="flex-1 flex items-center gap-2">
        <Link
          to="/"
          className="text-foreground font-medium text-base sm:text-lg lg:text-xl tracking-tighter"
        >
          Conar
        </Link>
        <Badge variant="default" className="bg-warning/20 text-warning">
          Beta
        </Badge>
      </div>
      <div className="flex-1 flex justify-center">
        <Link to="/" className="text-primary">
          <AppLogoMotion className="size-5 sm:size-6 lg:size-8" style={{ scale }} />
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-end gap-1 sm:gap-2">
        <Button variant="ghost" size="icon-sm" className="gap-1 sm:gap-2 hidden sm:flex" asChild>
          <a href={SOCIAL_LINKS.TWITTER} target="_blank" rel="noopener noreferrer">
            <RiTwitterXLine className="h-3 w-3 sm:h-4 sm:w-4" />
          </a>
        </Button>
        <Button variant="ghost" size="icon-sm" className="gap-1 sm:gap-2 hidden sm:flex" asChild>
          <a href={SOCIAL_LINKS.DISCORD} target="_blank" rel="noopener noreferrer">
            <RiDiscordLine className="size-3 sm:size-4" />
          </a>
        </Button>
        <Button variant="ghost" size="sm" className="gap-1 sm:gap-2 hidden sm:flex" asChild>
          <a href={SOCIAL_LINKS.GITHUB} target="_blank" rel="noopener noreferrer">
            <RiGithubFill className="size-3 sm:size-4" />
            <NumberFlow
              value={data?.stargazers_count || 0}
              className={cn(
                'tabular-nums duration-200 text-xs sm:text-sm',
                !data && 'animate-pulse text-muted-foreground'
              )}
            />
          </a>
        </Button>
        <Button size="sm" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3" asChild>
          <Link to="/download">
            <span className="hidden sm:inline">Get Started</span>
            <span className="sm:hidden">Download</span>
          </Link>
        </Button>
      </div>
    </header>
  )
}
