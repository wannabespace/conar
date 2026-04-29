/**
 * @name system
 * @type schema
 */
export interface System {
  databases: Databases
  columns: Columns
  parts: Parts
  one: One
  tables: Tables
}

/**
 * @name tables
 * @type table
 */
interface Tables {
  database: string
  name: string
  engine: string
  is_temporary: number
}

/**
 * @name one
 * @type table
 */
interface One {
  dummy: number
}

/**
 * @name databases
 * @type table
 */
interface Databases {
  name: string
  engine: string
  data_path: string
  metadata_path: string
  uuid: string
  comment: string
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
