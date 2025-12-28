/**
 * @name sys
 * @type schema
 */

/**
 * @name indexes
 * @type table
 */
export interface SysIndexes {
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
export interface SysTables {
  object_id: number
  schema_id: number
  name: string
}

/**
 * @name schemas
 * @type table
 */
export interface SysSchemas {
  schema_id: number
  name: string
}

/**
 * @name index_columns
 * @type table
 */
export interface SysIndexColumns {
  object_id: number
  index_id: number
  column_id: number
}

/**
 * @name columns
 * @type table
 */
export interface SysColumns {
  object_id: number
  column_id: number
  name: string
}
