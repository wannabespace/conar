import type { ConnectionType } from '@tamery/shared/enums/connection-type'

import type { Column } from '../../components/table/cell/utils'
import { BASE_GENERATORS } from './base'
import { MSSQL_GENERATORS } from './mssql/generators'
import { MYSQL_GENERATORS } from './mysql/generators'
import { PG_GENERATORS } from './postgres/generators'
import type { GeneratorMap } from './types'

export const GENERATORS = {
  ...BASE_GENERATORS,
  ...PG_GENERATORS,
  ...MYSQL_GENERATORS,
  ...MSSQL_GENERATORS,
} satisfies GeneratorMap

export type GeneratorId<D extends ConnectionType | '' = ''> = D extends ''
  ? keyof typeof GENERATORS
  : Extract<keyof typeof GENERATORS, `${D}.${string}`>

export interface Generator {
  generatorId: GeneratorId
  isNullable: boolean
  customExpression?: string
}

export interface DialectSeedConfig {
  generators: GeneratorMap
  autoDetect: (label: string) => GeneratorId | undefined
  shouldSkip?: (column: Column) => boolean
  transformArray?: (items: unknown[], column: Column) => unknown
  transformValue?: (value: unknown, column: Column) => unknown
}
