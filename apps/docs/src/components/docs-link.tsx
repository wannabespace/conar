import type { LinkProps } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

export const docsLinkProps = (href: string): LinkProps => {
  const parsed = URL.parse(href, 'https://docs.tamery.app')
  const pathname = parsed?.pathname ?? '/'
  const hash = parsed?.hash ? parsed.hash.slice(1) : undefined
  const splat = pathname.replace(/^\//u, '')

  if (!splat) {
    return { hash, to: '/' }
  }

  return { hash, params: { _splat: splat }, to: '/$' }
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
