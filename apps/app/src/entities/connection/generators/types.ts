import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { ActiveFilter } from '@tamery/shared/filters'

import type { Column } from '../components/table/cell/utils'
import type { enumType } from '../queries/enums'
import type { Index } from './utils'

export interface QueryParams {
  table: string
  filters: ActiveFilter[]
  dialect?: ConnectionType
}

export interface SchemaParams {
  table: string
  columns: Column[]
  dialect: ConnectionType
  enums?: (typeof enumType.infer)[]
  indexes?: Index[]
}
