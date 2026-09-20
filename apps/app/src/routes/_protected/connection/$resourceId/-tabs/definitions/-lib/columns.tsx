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
    <span data-mask className="flex min-w-0 items-center gap-2">
      <HugeiconsIcon
        icon={icon(item)}
        strokeWidth={2}
        className="text-muted-foreground size-4 shrink-0"
      />
      <span className="truncate">
        <HighlightText text={item.name} match={search} />
      </span>
      {after?.(item)}
    </span>
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

// Chrome, not user data: a label the app chose for a value, never the value.
export const labelColumn = <T,>({
  align,
  header,
  labelOf,
  width,
}: {
  align?: 'end'
  header: string
  labelOf: (item: T, context: CellContext) => ReactNode
  width?: string
}): DefinitionsColumn<T> => ({
  align,
  cell: (item, context) => (
    <span className="text-muted-foreground">{labelOf(item, context)}</span>
  ),
  header,
  width,
})
