import type { ComponentProps } from 'react'
import { AppLogo } from '@conar/ui/components/brand/app-logo'
import { Button } from '@conar/ui/components/button'
import { cn } from '@conar/ui/lib/utils'
import NumberFlow from '@number-flow/react'
import { RiGithubFill, RiTwitterXLine } from '@remixicon/react'
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
    <header className={cn('flex items-center justify-between', className)} {...props}>
      <div className="flex-1">
        <Link to="/" className="text-foreground font-medium text-xl tracking-tighter">
          Conar
        </Link>
      </div>
      <div className="flex-1 flex justify-center">
        <Link to="/" className="text-primary">
          <AppLogoMotion
            className="size-8"
            style={{ scale }}
          />
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          className="gap-2"
          asChild
        >
          <a
            href="https://x.com/conar_app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <RiTwitterXLine className="h-4 w-4" />
          </a>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          asChild
        >
          <a
            href="https://github.com/wannabespace/conar"
            target="_blank"
            rel="noopener noreferrer"
          >
            <RiGithubFill className="size-4" />
            <NumberFlow
              value={data?.stargazers_count || 0}
              className={cn('tabular-nums duration-200', !data && 'animate-pulse text-muted-foreground')}
            />
          </a>
        </Button>
        <Button
          size="sm"
          className="gap-2"
          asChild
        >
          <Link to="/download">
            Get Started
          </Link>
        </Button>
      </div>
    </header>
  )
}
