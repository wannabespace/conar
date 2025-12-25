/**
 * @name system
 * @type schema
 */
export interface SystemSchema {
  columns: Columns
}

/**
 * @name columns
 * @type table
 */
interface Columns {
  database: string
  table: string
  name: string
  is_in_primary_key: number
}
