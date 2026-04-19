import type { Column } from '../../components'
import type { ValueTransformer } from '../create-transformer'
import { TZDate } from '@date-fns/tz'
import { format, isValid } from 'date-fns'
import { getDisplayValue } from '../create-transformer'

function getTimeFormatPattern(value: Date) {
  const ms = value.getMilliseconds()

  if (ms === 0)
    return 'HH:mm:ss'
  if (ms % 100 === 0)
    return 'HH:mm:ss.S'
  if (ms % 10 === 0)
    return 'HH:mm:ss.SS'

  return 'HH:mm:ss.SSS'
}

function formatTime(value: Date) {
  const tzDate = new TZDate(value)

  return format(new TZDate(value, tzDate.timeZone || 'UTC'), getTimeFormatPattern(value))
}

export function createTimeTransformer(column: Column): ValueTransformer<string> {
  return {
    toDisplay: (value, size) => {
      if (value instanceof Date)
        return formatTime(value)

      return getDisplayValue(value, size)
    },
    fromConnection: value => ({
      toUI: () => {
        if (value instanceof Date && isValid(value)) {
          return formatTime(value)
        }

        if ((typeof value === 'string' || typeof value === 'number') && isValid(new Date(value))) {
          return formatTime(new Date(value))
        }

        return String(value).trim()
      },
      toRaw: () => {
        if (value === null)
          return ''

        if (value instanceof Date && isValid(value)) {
          return formatTime(value)
        }

        if ((typeof value === 'string' || typeof value === 'number') && isValid(new Date(value))) {
          return formatTime(new Date(value))
        }

        return String(value).trim()
      },
    }),
    toConnection: {
      fromUI: (value) => {
        if (value === '' && column.isNullable)
          return null

        return value
      },
      fromRaw: (value) => {
        if (value === '' && column.isNullable)
          return null

        return value.trim()
      },
    },
  }
}
