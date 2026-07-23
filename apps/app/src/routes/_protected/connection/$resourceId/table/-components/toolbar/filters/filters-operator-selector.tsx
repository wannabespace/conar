import type { Filter } from '@tamery/shared/filters'
import { FILTER_GROUPS, SQL_FILTERS_GROUPED } from '@tamery/shared/filters'
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

export function FiltersOperatorSelector({
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
        onKeyDown={e => {
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
                <span className="min-w-0 flex-1 truncate">{filter.label}</span>
                <CommandShortcut className="tracking-normal">{filter.operator}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  )
}
