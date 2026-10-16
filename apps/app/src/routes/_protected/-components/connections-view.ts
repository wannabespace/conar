import { type } from 'arktype'
import { createWebStorageValue } from 'seitu/web'

export const sortOptions = [
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

export const groupOptions = [
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
