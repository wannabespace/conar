/**
 * @name sys
 * @type schema
 */
export interface Sys {
  indexes: Indexes
  tables: Tables
  schemas: Schemas
  index_columns: IndexColumns
  columns: Columns
}

/**
 * @name indexes
 * @type table
 */
export interface Indexes {
  object_id: number
  index_id: number
  name: string
  is_unique: boolean
  is_primary_key: boolean
}

/**
 * @name tables
 * @type table
 */
interface Tables {
  object_id: number
  schema_id: number
  name: string
}

/**
 * @name schemas
 * @type table
 */
interface Schemas {
  schema_id: number
  name: string
}

/**
 * @name index_columns
 * @type table
 */
interface IndexColumns {
  object_id: number
  index_id: number
  column_id: number
}

/**
 * @name columns
 * @type table
 */
interface Columns {
  object_id: number
  column_id: number
  name: string
}
