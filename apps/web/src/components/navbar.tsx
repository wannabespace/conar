import type { ComponentProps } from 'react'
import { AppLogo } from '@conar/ui/components/brand/app-logo'
import { Button } from '@conar/ui/components/button'
import { cn } from '@conar/ui/lib/utils'
import { RiGithubFill, RiTwitterXLine } from '@remixicon/react'
import { Link } from '@tanstack/react-router'

export function Navbar({ className, ...props }: ComponentProps<'header'>) {
  return (
    <header className={cn('flex items-center justify-between', className)} {...props}>
      <Link to="/" className="flex-1 text-foreground font-medium text-xl tracking-tighter">
        Conar
      </Link>
      <Link to="/" className="flex-1 flex justify-center text-primary">
        <AppLogo className="size-8" />
      </Link>
      <div className="flex-1 flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="iconSm"
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
          size="iconSm"
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
