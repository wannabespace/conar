/**
 * @name system
 * @type schema
 */
export interface System {
  columns: Columns
}

/**
 * @name columns
 * @type table
 */
export interface Columns {
  database: string
  table: string
  name: string
  is_in_primary_key: number
}
