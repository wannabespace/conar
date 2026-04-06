import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { Column } from '../components/table/cell/utils'

export interface ValueTransformer {
  /** DB value -> truncated string for cell display */
  toDisplay: (value: unknown, maxWidth: number) => string
  /** DB value -> full string for edit popover */
  toEditable: (value: unknown) => string
  /** Edited string -> string to send to DB (engine-specific format) */
  toDb: (editedValue: string) => string
  /** DB value -> raw string for raw editing mode */
  toRaw: (value: unknown) => string
  /** Parse the editable string (from `toEditable`) back into a string array — used by the list combobox */
  parseEditableToList: (editableValue: string) => string[]
}

export interface TransformerContext {
  column: Column
  connectionType: ConnectionType
}
