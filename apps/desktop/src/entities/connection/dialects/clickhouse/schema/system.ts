/**
 * @name system
 * @type schema
 */
export interface System {
  columns: Columns
  parts: Parts
  one: One
}

/**
 * @name one
 * @type table
 */
interface One {
  dummy: number
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

/**
 * @name parts
 * @type table
 */
interface Parts {
  database: string
  table: string
  rows: number
  active: number
}
