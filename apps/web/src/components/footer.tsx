import { SOCIAL_LINKS } from '@conar/shared/constants'
import { AppLogo } from '@conar/ui/components/brand/app-logo'
import { RiDiscordLine, RiGithubLine, RiTwitterXLine } from '@remixicon/react'
import { Link } from '@tanstack/react-router'

export function Footer() {
  return (
    <footer className={`
      container mx-auto flex flex-col items-center justify-between gap-4 px-4
      py-4
      sm:flex-row sm:gap-0 sm:px-0
    `}
    >
      <div className="flex flex-1 items-center gap-2 text-muted-foreground">
        <AppLogo className="size-4" />
        <span className="text-sm font-medium">Conar</span>
      </div>
      <div className="flex flex-1 items-center justify-center gap-4">
        <Link
          to="/terms-of-service"
          className={`
            text-sm text-muted-foreground transition-colors
            hover:text-foreground
          `}
        >
          Terms of Service
        </Link>
        <Link
          to="/privacy-policy"
          className={`
            text-sm text-muted-foreground transition-colors
            hover:text-foreground
          `}
        >
          Privacy Policy
        </Link>
      </div>
      <div className={`
        flex flex-1 items-center justify-center gap-2
        sm:justify-end
      `}
      >
        <a
          href={SOCIAL_LINKS.TWITTER}
          target="_blank"
          rel="noopener noreferrer"
          className={`
            text-muted-foreground transition-colors
            hover:text-foreground
          `}
        >
          <RiTwitterXLine className="size-4" />
        </a>
        <a
          href={SOCIAL_LINKS.DISCORD}
          target="_blank"
          rel="noopener noreferrer"
          className={`
            text-muted-foreground transition-colors
            hover:text-foreground
          `}
        >
          <RiDiscordLine className="size-4" />
        </a>
        <a
          href={SOCIAL_LINKS.GITHUB}
          target="_blank"
          rel="noopener noreferrer"
          className={`
            text-muted-foreground transition-colors
            hover:text-foreground
          `}
        >
          <RiGithubLine className="size-4" />
        </a>
      </div>
    </footer>
  )
}
