import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { markdownComponents } from '@tamery/ui/components/custom/markdown'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@tamery/ui/components/item'
import type { MDXComponents } from 'mdx/types'
import type { ReactNode } from 'react'

import { source } from '~/lib/source'

import { DocsLink } from './docs-link'

const Card = ({ href }: { href: string }) => {
  const page = source.getPage(href.split('/').filter(Boolean))

  return (
    <Item
      className="group/card"
      render={<DocsLink href={href} />}
      size="sm"
      variant="card"
    >
      <ItemContent>
        <ItemTitle>{page?.data.title}</ItemTitle>
        <ItemDescription>{page?.data.description}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <HugeiconsIcon
          className="text-muted-foreground group-hover/card:text-foreground size-4 transition-[color,translate] group-hover/card:translate-x-0.5"
          icon={ArrowRight01Icon}
          strokeWidth={2}
        />
      </ItemActions>
    </Item>
  )
}

export const mdxComponents = {
  ...markdownComponents,
  a: ({ children, href }: { children?: ReactNode; href?: string }) =>
    href ? <DocsLink href={href}>{children}</DocsLink> : children,
  Card,
  Cards: ({ children }: { children?: ReactNode }) => (
    <div className="my-6 grid gap-3 sm:grid-cols-2">{children}</div>
  ),
} satisfies MDXComponents
