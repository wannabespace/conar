import { getDisplayValue } from '~/core/transformers/value-transformer'

export const PREVIEW_CHARS = 40
const DATE_LIKE = /^\d{4}-\d{2}-\d{2}/u
// Hex-only text is an id, not something a person named.
const NAMED = /[g-z]/iu

const isNamed = (value: unknown): value is string =>
  typeof value === 'string' && NAMED.test(value) && !DATE_LIKE.test(value)

export const rowPreview = (row: Record<string, unknown>, key: string) =>
  Object.entries(row)
    .filter(([id, value]) => id !== key && value !== null && value !== '')
    .toSorted(([, a], [, b]) => Number(isNamed(b)) - Number(isNamed(a)))
    .map(([id, value]) => `${id} ${getDisplayValue(value, PREVIEW_CHARS)}`)
    .join(' · ')
