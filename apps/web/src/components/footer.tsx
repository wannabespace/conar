import { SOCIAL_LINKS } from '@conar/shared/constants'
import { AppLogo } from '@conar/ui/components/brand/app-logo'
import { RiDiscordLine, RiGithubLine, RiTwitterXLine } from '@remixicon/react'
import { Link } from '@tanstack/react-router'

export function Footer() {
  return (
    <footer className="container mx-auto flex flex-col sm:flex-row justify-between items-center py-4 px-4 sm:px-0 gap-4 sm:gap-0">
      <div className="flex flex-1 items-center text-muted-foreground gap-2">
        <AppLogo className="size-4" />
        <span className="text-sm font-medium">Conar</span>
      </div>
      <div className="flex flex-1 justify-center items-center gap-4">
        <Link
          to="/terms-of-service"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Terms of Service
        </Link>
        <Link
          to="/privacy-policy"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Privacy Policy
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center sm:justify-end gap-2">
        <a
          href={SOCIAL_LINKS.TWITTER}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <RiTwitterXLine className="size-4" />
        </a>
        <a
          href={SOCIAL_LINKS.DISCORD}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <RiDiscordLine className="size-4" />
        </a>
        <a
          href={SOCIAL_LINKS.GITHUB}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <RiGithubLine className="size-4" />
        </a>
      </div>
    </footer>
  )
}
