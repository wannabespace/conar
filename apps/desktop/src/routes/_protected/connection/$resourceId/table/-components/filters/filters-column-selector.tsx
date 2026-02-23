import type { RefObject } from 'react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@conar/ui/components/command'
import { RiDatabase2Line } from '@remixicon/react'
import { useInternalContext } from './context'

export function FiltersColumnSelector({ ref, onSelect }: { ref?: RefObject<HTMLInputElement | null>, onSelect: (column: string) => void }) {
  const { columns } = useInternalContext()

  return (
    <Command>
      <CommandInput ref={ref} placeholder="Select column to filter..." />
      <CommandList className="h-fit max-h-[45vh]">
        <CommandEmpty>No columns found.</CommandEmpty>
        <CommandGroup>
          {columns.map(column => (
            <CommandItem
              key={column.id}
              value={column.id}
              keywords={[column.id, column.type]}
              onSelect={onSelect}
            >
              <RiDatabase2Line className="size-4 opacity-50" />
              <span>{column.id}</span>
              <span className="ml-auto text-right text-xs text-muted-foreground">{column.type}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
