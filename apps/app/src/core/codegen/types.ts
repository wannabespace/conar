import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { ActiveFilter } from '@tamery/shared/filters'

import type { Column } from '~/core/table/cell/utils'

export type GeneratorFormat =
  | 'ts'
  | 'zod'
  | 'prisma'
  | 'sql'
  | 'drizzle'
  | 'kysely'

export type TypedColumn = Column & { type: string }

export interface Index {
  type?: string
  schema: string
  table: string
  name: string
  column: string | null
  customExpression?: string
  custom?: boolean
  definition?: string
  isUnique: boolean
  isPrimary: boolean
}

export interface QueryParams {
  table: string
  schema: string
  filters: ActiveFilter[]
  dialect: ConnectionType
}

export interface SchemaParams {
  table: string
  schema: string
  columns: Column[]
  dialect: ConnectionType
  indexes?: Index[]
}
