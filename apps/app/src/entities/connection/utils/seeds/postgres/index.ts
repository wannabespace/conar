import type { Column } from '~/entities/connection/components/table/cell/utils'
import { toPgArrayLiteral } from '~/entities/connection/transformers/list/postgres'

import type { DialectSeedConfig } from '../registry'
import { pgAutoDetect } from './detect'
import { PG_GENERATORS } from './generators'

const pgTransformArray = (items: unknown[], column: Column): unknown => {
  const strings = items.map((v) =>
    typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)
  )
  const type = column.typeLabel?.toLowerCase().replace('[]', '')
  if (type === 'box') {
    return toPgArrayLiteral(strings, ';')
  }
  return toPgArrayLiteral(strings)
}

export const pgSeedConfig = {
  autoDetect: pgAutoDetect,
  generators: PG_GENERATORS,
  transformArray: pgTransformArray,
} satisfies DialectSeedConfig
