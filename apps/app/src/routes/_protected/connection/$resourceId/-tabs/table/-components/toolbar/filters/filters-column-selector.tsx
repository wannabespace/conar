import { DatabaseIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandShortcut,
  CommandList,
} from '@tamery/ui/components/command'
import type { RefObject } from 'react'

import { useTableColumnsContext } from '../../../-lib/columns'

export const FiltersColumnSelector = ({
  ref,
  onSelect,
}: {
  ref?: RefObject<HTMLInputElement | null>
  onSelect: (column: string) => void
}) => {
  const { columns } = useTableColumnsContext()

  return (
    <Command>
      <CommandInput ref={ref} placeholder="Select column to filter..." />
      <CommandList data-mask className="h-fit max-h-[45vh]">
        <CommandEmpty>No columns found.</CommandEmpty>
        <CommandGroup>
          {columns.map((column) => (
            <CommandItem
              key={column.id}
              value={column.id}
              keywords={[column.id, column.type ?? '', column.typeLabel ?? '']}
              onSelect={onSelect}
            >
              <HugeiconsIcon
                icon={DatabaseIcon}
                strokeWidth={2}
                className="size-4 opacity-50"
              />
              <span className="min-w-0 flex-1 truncate">{column.id}</span>
              <CommandShortcut>{column.typeLabel}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
