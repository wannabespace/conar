import type { Filter } from '@tamery/shared/filters'
import { FILTER_GROUPS } from '@tamery/shared/filters'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandShortcut,
  CommandList,
} from '@tamery/ui/components/command'
import { getRouteApi } from '@tanstack/react-router'

import { offeredFilters } from '../filter-composer'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export const FiltersOperatorSelector = ({
  onSelect,
}: {
  onSelect: (filter: Filter) => void
}) => {
  const { connection } = useRouteContext()

  return (
    <Command>
      <CommandInput placeholder="Select operator..." />
      <CommandList className="h-fit max-h-[70vh]">
        <CommandEmpty>No operators found.</CommandEmpty>
        {offeredFilters(connection.type).map(({ group, filters }) => (
          <CommandGroup key={group} heading={FILTER_GROUPS[group]}>
            {filters.map((filter) => (
              <CommandItem
                key={filter.operator}
                value={filter.operator}
                keywords={[filter.label, filter.symbol]}
                onSelect={() => onSelect(filter)}
              >
                <span className="min-w-0 flex-1 truncate">{filter.label}</span>
                <CommandShortcut>{filter.symbol}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  )
}
