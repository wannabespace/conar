import type { ComponentProps } from 'react'
import { AppLogo } from '@conar/ui/components/brand/app-logo'
import { Button } from '@conar/ui/components/button'
import { cn } from '@conar/ui/lib/utils'
import { RiGithubFill, RiTwitterXLine } from '@remixicon/react'
import { Link } from '@tanstack/react-router'
import { motion, useScroll, useTransform } from 'motion/react'

const AppLogoMotion = motion.create(AppLogo)

export function Navbar({ className, ...props }: ComponentProps<'header'>) {
  const { scrollYProgress } = useScroll()
  const scale = useTransform(scrollYProgress, [0, 0.5], [2, 1])

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
          size="icon-sm"
          className="gap-2"
          asChild
        >
          <a
            href="https://github.com/wannabespace/conar"
            target="_blank"
            rel="noopener noreferrer"
          >
            <RiGithubFill className="h-4 w-4" />
          </a>
        </Button>
        <Button
          size="sm"
          variant="secondary"
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
