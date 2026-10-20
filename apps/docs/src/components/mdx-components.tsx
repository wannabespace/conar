import { ArrowRight01Icon, Link01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@tamery/ui/components/item'
import { Kbd } from '@tamery/ui/components/kbd'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@tamery/ui/components/table'
import type { MDXComponents } from 'mdx/types'
import type { ReactNode } from 'react'

import { source } from '~/lib/source'

import { DocsLink } from './docs-link'
import { Fence } from './fence'

const SectionHeading = ({
  children,
  id,
  level: Tag,
}: {
  children?: ReactNode
  id?: string
  level: 'h2' | 'h3'
}) => (
  <Tag className="group/heading" id={id}>
    {children}
    <a
      aria-label="Link to this section"
      className="text-muted-foreground hover:text-foreground focus-visible:focus-ring ml-2 inline-flex rounded-sm align-middle opacity-0 transition-opacity group-hover/heading:opacity-100 focus-visible:opacity-100"
      href={`#${id}`}
    >
      <HugeiconsIcon className="size-4" icon={Link01Icon} strokeWidth={2} />
    </a>
  </Tag>
)

const Card = ({ href }: { href: string }) => {
  const page = source.getPage(href.split('/').filter(Boolean))

  return (
    <Item
      className="text-foreground group/card"
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
  a: ({ children, href }: { children?: ReactNode; href?: string }) =>
    href ? <DocsLink href={href}>{children}</DocsLink> : children,
  Card,
  Cards: ({ children }: { children?: ReactNode }) => (
    <div className="my-6 grid gap-3 sm:grid-cols-2">{children}</div>
  ),
  code: ({ children }: { children?: ReactNode }) => (
    <code className="bg-muted rounded-md px-1.5 py-0.5 font-mono text-sm">
      {children}
    </code>
  ),
  h2: (props: { children?: ReactNode; id?: string }) => (
    <SectionHeading level="h2" {...props} />
  ),
  h3: (props: { children?: ReactNode; id?: string }) => (
    <SectionHeading level="h3" {...props} />
  ),
  kbd: ({ children }: { children?: ReactNode }) => (
    <Kbd variant="keycap">{children}</Kbd>
  ),
  pre: Fence,
  table: Table,
  tbody: TableBody,
  td: TableCell,
  th: TableHead,
  thead: TableHeader,
  tr: TableRow,
} satisfies MDXComponents
