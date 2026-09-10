import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { ActiveFilter } from '@tamery/shared/filters'

import type { Column } from '../components/table/cell/utils'
import type { Index } from './utils'

export interface QueryParams {
  table: string
  schema: string
  filters: ActiveFilter[]
  dialect?: ConnectionType
}

export interface SchemaParams {
  table: string
  schema: string
  columns: Column[]
  dialect: ConnectionType
  indexes?: Index[]
}
