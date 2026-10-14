import {
  Layers01Icon,
  PlusSignIcon,
  SortByDown01Icon,
  SortByUp01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'
import { type } from 'arktype'
import { useSubscription } from 'seitu/react'
import { createWebStorageValue } from 'seitu/web'

import { Link } from '~/components/link'
import { plural } from '~/utils/plural'

const sortOptions = [
  { value: 'date-desc', label: 'Date (newest first)' },
  { value: 'date-asc', label: 'Date (oldest first)' },
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
] as const

export const sortValue = createWebStorageValue({
  type: 'localStorage',
  key: 'connections-list-sort',
  schema: type('string' as type.cast<(typeof sortOptions)[number]['value']>),
  defaultValue: 'date-desc',
})

const groupOptions = [
  { value: 'label', label: 'Group by label' },
  { value: 'type', label: 'Group by type' },
  { value: 'none', label: 'No grouping' },
] as const

export const groupValue = createWebStorageValue({
  type: 'localStorage',
  key: 'connections-list-group',
  schema: type('string' as type.cast<(typeof groupOptions)[number]['value']>),
  defaultValue: 'label',
})

export const ConnectionsToolbar = ({ count }: { count: number }) => {
  const sort = useSubscription(sortValue)
  const grouping = useSubscription(groupValue)

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-2xs text-muted-foreground px-2 font-semibold tracking-wider uppercase">
        {plural(count, 'connection')}
      </span>
      <div className="flex items-center gap-2">
        <Select
          value={grouping}
          onValueChange={(value) => {
            if (value) {
              groupValue.set(value)
            }
          }}
        >
          <SelectTrigger size="sm" className="shrink-0">
            <HugeiconsIcon icon={Layers01Icon} strokeWidth={2} />
            <SelectValue>
              {groupOptions.find((option) => option.value === grouping)
                ?.label ?? grouping}
            </SelectValue>
          </SelectTrigger>
          <SelectContent size="sm">
            {groupOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sort}
          onValueChange={(value) => {
            if (value) {
              sortValue.set(value)
            }
          }}
        >
          <SelectTrigger size="sm" className="shrink-0">
            <HugeiconsIcon
              icon={sort.includes('asc') ? SortByUp01Icon : SortByDown01Icon}
              strokeWidth={2}
            />
            <SelectValue>
              {sortOptions.find((option) => option.value === sort)?.label ??
                sort}
            </SelectValue>
          </SelectTrigger>
          <SelectContent size="sm">
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="text-foreground"
          render={<Link to="/create" />}
        >
          <HugeiconsIcon
            icon={PlusSignIcon}
            strokeWidth={2}
            className="text-muted-foreground size-4"
          />
          New
        </Button>
      </div>
    </div>
  )
}
