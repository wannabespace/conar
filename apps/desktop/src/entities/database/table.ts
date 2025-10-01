export interface Column {
  id: string
  type?: string
  isEditable?: boolean
  isNullable?: boolean
  unique?: string
  primaryKey?: string
  foreign?: {
    name: string
    schema: string
    table: string
    column: string
  }
  references?: {
    name: string
    schema: string
    table: string
    column: string
  }[]
}
