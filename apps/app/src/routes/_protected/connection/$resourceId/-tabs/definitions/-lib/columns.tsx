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
  className?: string
  // Absorbs the table's slack; every other column states a fixed `width` class,
  // so the layout holds from skeleton to values.
  grow?: boolean
  header: string
  width?: string
}

const NAME_COLUMN_CLASS = 'font-mono font-medium'

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

export const Muted = ({ children }: { children: ReactNode }) => (
  <span className="text-muted-foreground">{children}</span>
)

export const HighlightList = ({
  match,
  values,
}: {
  match: string
  values: string[]
}) =>
  values.map((value, index) => (
    <span key={value}>
      {index > 0 && ', '}
      <HighlightText text={value} match={match} />
    </span>
  ))

export const nameColumn = <T extends { name: string }>({
  after,
  iconOf,
  width,
}: {
  after?: (item: T) => ReactNode
  iconOf: (item: T) => IconSvgElement
  width: string
}): DefinitionsColumn<T> => ({
  cell: (item, { search }) => (
    <NameCell icon={iconOf(item)}>
      <HighlightText text={item.name} match={search} />
      {after?.(item)}
    </NameCell>
  ),
  className: NAME_COLUMN_CLASS,
  header: 'Name',
  width,
})

export const monoColumn = <T,>({
  grow,
  header,
  valueOf,
  width,
}: {
  grow?: boolean
  header: string
  valueOf: (item: T) => string | null | undefined
  width?: string
}): DefinitionsColumn<T> => ({
  cell: (item, { search }) => (
    <span data-mask className="font-mono">
      <HighlightText text={valueOf(item) ?? ''} match={search} />
    </span>
  ),
  className: grow ? 'whitespace-normal' : undefined,
  grow,
  header,
  width,
})
