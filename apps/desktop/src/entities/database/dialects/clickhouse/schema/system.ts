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
}
