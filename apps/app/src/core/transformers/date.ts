import type { Column } from '~/core/table/cell/utils'

import { createRawTransformer } from './raw'
import type { ValueTransformer } from './value-transformer'

const DATE_TEXT =
  /^\d{4,}-\d{1,2}-\d{1,2}(?:[ T]\d{1,2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:\s?(?:Z|[+-]\d{2}(?::?\d{2})?))?)?(?: BC)?$/iu
export const createDateTransformer = (
  column: Column,
  keywords: RegExp | null
): ValueTransformer<unknown> => ({
  ...createRawTransformer(),
  toConnection: {
    fromRaw: (raw) => {
      const text = raw.trim()
      if (text === '' && column.isNullable) {
        return null
      }
      if (!(DATE_TEXT.test(text) || keywords?.test(text))) {
        throw new Error(
          column.uiType === 'date'
            ? 'Enter a date like 2026-08-23'
            : 'Enter a date and time like 2026-08-23 14:30:00'
        )
      }
      return text
    },
    fromUI: (value) => value,
  },
})
