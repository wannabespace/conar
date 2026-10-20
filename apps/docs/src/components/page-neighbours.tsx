import { nav } from '~/lib/nav'

import { DocsLink } from './docs-link'

export const PageNeighbours = ({ href }: { href: string }) => {
  const { next, previous } = nav.getNeighbours(href)

  if (!next && !previous) {
    return null
  }

  return (
    <nav className="border-border mt-12 grid grid-cols-2 gap-4 border-t pt-6">
      {previous && (
        <DocsLink
          className="text-foreground flex flex-col gap-1"
          href={previous.href}
        >
          <span className="text-muted-foreground text-xs">Previous</span>
          <span className="text-sm font-medium">{previous.title}</span>
        </DocsLink>
      )}
      {next && (
        <DocsLink
          className="text-foreground col-start-2 flex flex-col items-end gap-1"
          href={next.href}
        >
          <span className="text-muted-foreground text-xs">Next</span>
          <span className="text-sm font-medium">{next.title}</span>
        </DocsLink>
      )}
    </nav>
  )
}
