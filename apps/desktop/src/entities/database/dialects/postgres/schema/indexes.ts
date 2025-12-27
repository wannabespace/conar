/**
 * @name pg_namespace
 * @type table
 */
export interface PgNamespace {
  oid: number
  nspname: string
  nspowner: number
  nspacl: string | null
}

/**
 * @name pg_class
 * @type table
 */
export interface PgClass {
  oid: number
  relname: string
  relnamespace: number
  relkind: string
}

/**
 * @name pg_index
 * @type table
 */
export interface PgIndex {
  indrelid: number
  indexrelid: number
  indkey: unknown
  indisunique: boolean
  indisprimary: boolean
}

/**
 * @name pg_attribute
 * @type table
 */
export interface PgAttribute {
  attrelid: number
  attnum: number
  attname: string
}
