import type { Filter } from '@conar/shared/filters'
import type { RefObject } from 'react'
import { FILTER_GROUPS, SQL_FILTERS_GROUPED } from '@conar/shared/filters'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@conar/ui/components/command'

export function FiltersSelector({
  ref,
  onSelect,
  onBackspace,
}: {
  ref?: RefObject<HTMLInputElement | null>
  onSelect: (filter: Filter) => void
  onBackspace?: () => void
}) {
  return (
    <Command>
      <CommandInput
        ref={ref}
        placeholder="Select operator..."
        onKeyDown={(e) => {
          if (e.key === 'Backspace') {
            onBackspace?.()
          }
        }}
      />
      <CommandList className="h-fit max-h-[70vh]">
        <CommandEmpty>No operators found.</CommandEmpty>
        {SQL_FILTERS_GROUPED.map(({ group, filters }) => (
          <CommandGroup key={group} heading={FILTER_GROUPS[group]}>
            {filters.map(filter => (
              <CommandItem
                key={filter.operator}
                value={filter.operator}
                keywords={[filter.label, filter.operator]}
                onSelect={() => onSelect(filter)}
              >
                <span>{filter.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {filter.operator}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  )
}
