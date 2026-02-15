import type { Filter } from '@conar/shared/filters'
import type { KeyboardEvent, RefObject } from 'react'
import { FILTER_GROUPS } from '@conar/shared/filters'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@conar/ui/components/command'
import { RiFilterLine } from '@remixicon/react'
import { useInternalContext } from './context'

export function FiltersSelector({
  ref,
  onSelect,
  onBackspace,
}: {
  ref?: RefObject<HTMLInputElement | null>
  onSelect: (filter: Filter) => void
  onBackspace?: () => void
}) {
  const { filtersGrouped } = useInternalContext()

  return (
    <Command>
      <CommandInput
        ref={ref}
        placeholder="Select operator..."
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Backspace') {
            onBackspace?.()
          }
        }}
      />
      <CommandList className="h-fit max-h-[70vh]">
        <CommandEmpty>No operators found.</CommandEmpty>
        {filtersGrouped.map(({ group, filters }) => (
          <CommandGroup key={group} heading={FILTER_GROUPS[group]}>
            {filters.map((filter) => {
              return (
                <CommandItem
                  key={filter.operator}
                  value={filter.operator}
                  keywords={[filter.label, filter.operator]}
                  onSelect={() => onSelect(filter)}
                >
                  <RiFilterLine className="size-4 opacity-50" />
                  <span>{filter.label}</span>
                  <span className={`
                    ml-auto text-right text-xs text-muted-foreground
                  `}
                  >
                    {filter.operator}
                  </span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  )
}
