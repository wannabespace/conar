/**
 * @name system
 * @type schema
 */
export interface System {
  databases: Databases
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
