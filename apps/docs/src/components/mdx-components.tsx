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

import { DocsLink } from './docs-link'
import { Fence } from './fence'

export const mdxComponents = {
  a: ({ children, href }: { children?: ReactNode; href?: string }) =>
    href ? <DocsLink href={href}>{children}</DocsLink> : children,
  code: ({ children }: { children?: ReactNode }) => (
    <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
      {children}
    </code>
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
