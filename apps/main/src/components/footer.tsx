import {
  DiscordIcon,
  GithubIcon,
  NewTwitterIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { SOCIAL_LINKS } from '@tamery/shared/constants'
import { AppLogo } from '@tamery/ui/components/brand/app-logo'
import { Link } from '@tanstack/react-router'

export const Footer = () => (
  <footer className="container mx-auto flex flex-col items-center justify-between gap-4 p-4 sm:flex-row sm:gap-0 sm:px-0">
    <div className="text-muted-foreground flex flex-1 items-center gap-2">
      <AppLogo className="size-4" />
      <span className="text-sm font-medium">Tamery</span>
    </div>
    <div className="flex flex-1 items-center justify-center gap-4">
      <Link
        to="/terms-of-service"
        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
      >
        Terms of Service
      </Link>
      <Link
        to="/privacy-policy"
        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
      >
        Privacy Policy
      </Link>
    </div>
    <div className="flex flex-1 items-center justify-center gap-2 sm:justify-end">
      <a
        href={SOCIAL_LINKS.TWITTER}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <HugeiconsIcon
          icon={NewTwitterIcon}
          strokeWidth={2}
          className="size-4"
        />
      </a>
      <a
        href={SOCIAL_LINKS.DISCORD}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <HugeiconsIcon icon={DiscordIcon} strokeWidth={2} className="size-4" />
      </a>
      <a
        href={SOCIAL_LINKS.GITHUB}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <HugeiconsIcon icon={GithubIcon} strokeWidth={2} className="size-4" />
      </a>
    </div>
  </footer>
)
