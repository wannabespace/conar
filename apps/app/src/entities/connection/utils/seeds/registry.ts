import type { Column } from '../../components/table/cell/utils'
import type { BASE_GENERATORS } from './base'
import type { MSSQL_GENERATORS } from './mssql/generators'
import type { MYSQL_GENERATORS } from './mysql/generators'
import type { PG_GENERATORS } from './postgres/generators'
import type { GeneratorMap } from './types'

export type GeneratorId = keyof (typeof BASE_GENERATORS &
  typeof PG_GENERATORS &
  typeof MYSQL_GENERATORS &
  typeof MSSQL_GENERATORS)

export interface Generator {
  generatorId: GeneratorId
  isNullable: boolean
  customExpression?: string
}

export interface DialectSeedConfig {
  generators: GeneratorMap
  types: Record<string, GeneratorId>
  transformArray?: (items: unknown[], column: Column) => unknown
}
