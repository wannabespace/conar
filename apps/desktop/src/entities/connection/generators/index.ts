import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { ActiveFilter } from '@conar/shared/filters'
import type { Column } from '../components/table/utils'
import type { enumType } from '../queries/enums'
import type { Index } from './utils'

export * from './formats/drizzle'
export * from './formats/kysely'
export * from './formats/prisma'
export * from './formats/sql'
export * from './formats/typescript'
export * from './formats/zod'

export interface QueryParams {
  table: string
  filters: ActiveFilter[]
  dialect?: ConnectionType
}

export interface SchemaParams {
  table: string
  columns: Column[]
  dialect: ConnectionType
  enums?: typeof enumType.infer[]
  indexes?: Index[]
}
