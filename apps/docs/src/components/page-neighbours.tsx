import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@tamery/ui/components/item'

import { nav } from '~/lib/nav'

import { DocsLink } from './docs-link'

const Neighbour = ({
  direction,
  page,
}: {
  direction: 'next' | 'previous'
  page: { href: string; title: string }
}) => {
  const icon = (
    <HugeiconsIcon
      className="text-muted-foreground size-4"
      icon={direction === 'next' ? ArrowRight01Icon : ArrowLeft01Icon}
      strokeWidth={2}
    />
  )

  return (
    <Item
      className={direction === 'next' ? 'sm:col-start-2' : undefined}
      render={<DocsLink href={page.href} />}
      size="sm"
      variant="card"
    >
      {direction === 'previous' && icon}
      <ItemContent className={direction === 'next' ? 'items-end' : undefined}>
        <ItemDescription>
          {direction === 'next' ? 'Next' : 'Previous'}
        </ItemDescription>
        <ItemTitle>{page.title}</ItemTitle>
      </ItemContent>
      {direction === 'next' && icon}
    </Item>
  )
}

export const PageNeighbours = ({ href }: { href: string }) => {
  const { next, previous } = nav.getNeighbours(href)

  if (!next && !previous) {
    return null
  }

  return (
    <nav aria-label="Pages" className="mt-16 grid gap-3 sm:grid-cols-2">
      {previous && <Neighbour direction="previous" page={previous} />}
      {next && <Neighbour direction="next" page={next} />}
    </nav>
  )
}
