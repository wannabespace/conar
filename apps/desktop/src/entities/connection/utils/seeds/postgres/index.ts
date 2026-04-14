import type { DialectSeedConfig } from '../index'
import { toPgArrayLiteral } from '~/entities/connection/transformers/list/postgres'
import { pgAutoDetect } from './detect'
import { PG_GENERATORS } from './generators'

function pgTransformArray(items: unknown[], type: string): unknown {
  const strings = items.map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v))
  if (type === 'box')
    return toPgArrayLiteral(strings, ';')
  return toPgArrayLiteral(strings)
}

export const pgSeedConfig = {
  generators: PG_GENERATORS,
  autoDetect: pgAutoDetect,
  transformArray: pgTransformArray,
} satisfies DialectSeedConfig
