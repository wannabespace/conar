import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import { HighlightText } from '@tamery/ui/components/custom/highlight'
import type { ReactNode } from 'react'

export interface CellContext {
  schema: string | undefined
  search: string
}

export interface DefinitionsColumn<T> {
  align?: 'end'
  cell: (item: T, context: CellContext) => ReactNode
  header: string
  width?: string
}

const NameCell = ({
  children,
  icon,
}: {
  children: ReactNode
  icon: IconSvgElement
}) => (
  <span data-mask className="flex min-w-0 items-center gap-2">
    <HugeiconsIcon
      icon={icon}
      strokeWidth={2}
      className="text-muted-foreground size-4 shrink-0"
    />
    <span className="truncate">{children}</span>
  </span>
)

export const nameColumn = <T extends { name: string }>({
  after,
  icon,
  width,
}: {
  after?: (item: T) => ReactNode
  icon: (item: T) => IconSvgElement
  width: string
}): DefinitionsColumn<T> => ({
  cell: (item, { search }) => (
    <NameCell icon={icon(item)}>
      <HighlightText text={item.name} match={search} />
      {after?.(item)}
    </NameCell>
  ),
  header: 'Name',
  width,
})

export const textColumn = <T,>({
  header,
  valueOf,
  width,
}: {
  header: string
  valueOf: (item: T) => string | null | undefined
  width?: string
}): DefinitionsColumn<T> => ({
  cell: (item, { search }) => (
    <span data-mask>
      <HighlightText text={valueOf(item) ?? ''} match={search} />
    </span>
  ),
  header,
  width,
})
