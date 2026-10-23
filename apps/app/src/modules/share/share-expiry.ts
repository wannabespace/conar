import { addDays, format } from 'date-fns'

const EXPIRY_DAYS = { day: 1, month: 30, week: 7 }

export type Expiry = keyof typeof EXPIRY_DAYS | 'current' | 'never'

export const getExpiryItems = (
  current: Date | null
): { label: string; value: Expiry }[] => [
  ...(current
    ? [{ label: `On ${format(current, 'PP')}`, value: 'current' as const }]
    : []),
  { label: 'Never', value: 'never' },
  { label: 'In 1 day', value: 'day' },
  { label: 'In 7 days', value: 'week' },
  { label: 'In 30 days', value: 'month' },
]

export const getExpiresAt = (expires: Expiry, current: Date | null) => {
  if (expires === 'current') {
    return current
  }
  if (expires === 'never') {
    return null
  }
  return addDays(new Date(), EXPIRY_DAYS[expires])
}
