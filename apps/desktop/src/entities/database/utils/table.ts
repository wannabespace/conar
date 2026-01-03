export interface Column {
  id: string
  type?: string
  label?: string
  enum?: string
  isArray?: boolean
  isEditable?: boolean
  isNullable?: boolean
  maxLength?: number | null
  precision?: number | null
  scale?: number | null
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
