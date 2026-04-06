import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { Column } from '../components/table/cell/utils'

export interface ValueTransformer {
  toEditable: (value: unknown) => string
  toDb: (editedValue: string) => string
}

export interface TransformerContext {
  column: Column
  connectionType: ConnectionType
}
