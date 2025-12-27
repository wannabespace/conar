/**
 * @name statistics
 * @type table
 */

export interface MysqlStatistics {
  TABLE_SCHEMA: string
  TABLE_NAME: string
  INDEX_NAME: string
  COLUMN_NAME: string
  NON_UNIQUE: number
}
