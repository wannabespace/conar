import { SOCIAL_LINKS } from '@tamery/shared/constants'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { useHomePath } from '~/hooks/use-home-path'
import { PrivacyLink, TermsLink } from '~/modules/legal/legal-links'

import { Brand } from './brand'

const linkClassName =
  'text-muted-foreground hover:text-foreground text-sm transition-colors'

const ExternalLink = ({
  href,
  children,
}: {
  href: string
  children: string
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={linkClassName}
  >
    {children}
  </a>
)

const Column = ({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) => (
  <div className="flex flex-col gap-3">
    <h2 className="text-foreground text-sm font-medium">{title}</h2>
    {children}
  </div>
)

export const Footer = () => {
  const home = useHomePath()

  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pt-20 pb-10 sm:px-6">
      <div className="grid grid-cols-2 gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="col-span-2 flex flex-col gap-3 md:col-span-1">
          <Brand to={home} />
          <p className="text-muted-foreground max-w-xs text-sm text-pretty">
            The AI database client for Postgres, MySQL, SQL Server and
            ClickHouse.
          </p>
        </div>
        <Column title="Product">
          <Link to="/download" className={linkClassName}>
            Download
          </Link>
          <Link to={home} hash="pricing" className={linkClassName}>
            Pricing
          </Link>
          <Link to="/releases" className={linkClassName}>
            Releases
          </Link>
        </Column>
        <Column title="Community">
          <ExternalLink href={SOCIAL_LINKS.GITHUB}>GitHub</ExternalLink>
          <ExternalLink href={SOCIAL_LINKS.DISCORD}>Discord</ExternalLink>
          <ExternalLink href={SOCIAL_LINKS.TWITTER}>X</ExternalLink>
        </Column>
        <Column title="Legal">
          <TermsLink />
          <PrivacyLink />
        </Column>
      </div>
      <p className="text-muted-foreground mt-16 text-xs">
        © {new Date().getFullYear()} Tamery
      </p>
    </footer>
  )
}
