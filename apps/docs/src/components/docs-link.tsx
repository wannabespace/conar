import type { LinkProps } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import type { ComponentProps } from 'react'

import { SITE_URL } from '~/constants'

export const docsLinkProps = (href: string): LinkProps => {
  const url = URL.parse(href, SITE_URL)

  return {
    hash: url?.hash.slice(1),
    params: { _splat: url?.pathname.slice(1) },
    to: '/$',
  }
}

export const DocsLink = ({
  children,
  href,
  ...props
}: Omit<ComponentProps<'a'>, 'href'> & { href: string }) =>
  href.startsWith('/') ? (
    <Link {...docsLinkProps(href)} {...props}>
      {children}
    </Link>
  ) : (
    <a href={href} {...props}>
      {children}
    </a>
  )
