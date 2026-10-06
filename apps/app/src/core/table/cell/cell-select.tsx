import { Badge } from '@tamery/ui/components/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@tamery/ui/components/command'
import { cn } from '@tamery/ui/lib/utils'

import type { ValueTransformer } from '~/core/transformers/value-transformer'

import type { GridCursor } from '../cursor'
import type { Column } from './utils'

const SEARCH_THRESHOLD = 8

const TAG_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-orange-500',
  'bg-purple-500',
  'bg-red-500',
  'bg-yellow-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-zinc-400',
]

const tagColor = (column: Column, value: string) => {
  const index = column.availableValues?.indexOf(value) ?? -1
  const seed =
    index === -1
      ? [...value].reduce(
          (hash, char) => hash * 31 + (char.codePointAt(0) ?? 0),
          7
        )
      : index
  return TAG_COLORS[Math.abs(seed) % TAG_COLORS.length]
}

export const isPickColumn = (column: Column) =>
  column.uiType === 'select' ||
  (column.uiType === 'list' && !!column.availableValues)

export const Tag = ({ column, value }: { column: Column; value: string }) => (
  <Badge variant="secondary">
    <span
      className={cn('size-1.5 shrink-0 rounded-full', tagColor(column, value))}
    />
    <span data-mask className="truncate">
      {value}
    </span>
  </Badge>
)

export const CellSelect = ({
  column,
  cursor,
  readOnly,
  transformer,
  value,
}: {
  column: Column
  cursor: GridCursor
  readOnly: boolean
  transformer: ValueTransformer
  value: unknown
}) => {
  const multiple = column.uiType === 'list'
  const options = column.availableValues ?? []
  const picked: unknown =
    value === null ? null : transformer.fromConnection(value).toUI()
  const chosen = Array.isArray(picked) ? picked : [picked]

  const pick = (option: string) => {
    if (readOnly) {
      return
    }
    if (!multiple) {
      cursor.set(transformer.toConnection.fromUI(option))
      return
    }
    const next = transformer.toConnection.fromUI(
      chosen.includes(option)
        ? chosen.filter((item) => item !== option)
        : [...chosen, option]
    )
    cursor.apply(next)
    // The open edit commits its text on blur, so it has to follow the toggles.
    cursor.change(transformer.fromConnection(next).toRaw())
  }

  return (
    <Command
      size="sm"
      variant="transparent"
      loop
      tabIndex={-1}
      aria-label={`Value of ${column.id}`}
      ref={(element) => {
        if (options.length < SEARCH_THRESHOLD) {
          element?.focus()
        }
      }}
    >
      {options.length >= SEARCH_THRESHOLD && (
        <CommandInput autoFocus placeholder="Search values…" />
      )}
      <CommandList>
        <CommandEmpty>No matching values</CommandEmpty>
        <CommandGroup>
          {options.map((option) => (
            <CommandItem
              key={option}
              value={option}
              data-checked={chosen.includes(option)}
              onSelect={() => pick(option)}
            >
              <Tag column={column} value={option} />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
