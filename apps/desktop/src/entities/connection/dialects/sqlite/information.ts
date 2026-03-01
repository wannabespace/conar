/**
 * SQLite uses sqlite_master / sqlite_schema for metadata.
 * The information_schema-style tables below match what
 * the SQL queries in this project expect.
 */
export interface InformationSchema {
  sqlite_master: SqliteMaster
  sqlite_schema: SqliteMaster
}

/**
 * @name sqlite_master
 * @type table
 */
interface SqliteMaster {
  type: 'table' | 'index' | 'view' | 'trigger'
  name: string
  tbl_name: string
  rootpage: number
  sql: string | null
}
