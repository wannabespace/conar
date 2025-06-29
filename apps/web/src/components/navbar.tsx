import { AppLogoSquare } from '@conar/ui/components/brand/app-logo-square'
import { Button } from '@conar/ui/components/button'
import { RiGithubFill, RiTwitterXLine } from '@remixicon/react'
import { Link } from '@tanstack/react-router'

export function Navbar() {
  return (
    <header className="flex p-4 items-center justify-between w-full gap-10 rounded-lg border bg-background/70 backdrop-blur-xs fixed top-10 left-1/2 -translate-x-1/2 z-50 max-w-lg mx-auto">
      <Link to="/" className="flex items-center gap-2 text-foreground font-semibold">
        <AppLogoSquare className="size-7" />
        Conar
      </Link>
      <div className="flex items-center gap-2">
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
          variant="outline"
          className="gap-2"
          asChild
        >
          <Link to="/download">
            Download
          </Link>
        </Button>
      </div>
    </header>
  )
}
