import type { LinkProps } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

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
  className,
  href,
  ...props
}: {
  children: ReactNode
  className?: string
  href: string
  onClick?: () => void
  'aria-current'?: 'page' | undefined
}) => {
  if (!href.startsWith('/')) {
    return (
      <a className={className} href={href} {...props}>
        {children}
      </a>
    )
  }

  return (
    <Link className={className} {...docsLinkProps(href)} {...props}>
      {children}
    </Link>
  )
}
