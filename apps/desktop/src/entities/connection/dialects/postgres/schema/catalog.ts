/**
 * @name pg_catalog
 * @type schema
 */
export interface PgCatalog {
  pg_namespace: PgNamespace
  pg_class: PgClass
  pg_index: PgIndex
  pg_attribute: PgAttribute
}

/**
 * @name pg_namespace
 * @type table
 */
interface PgNamespace {
  oid: number
  nspname: string
  nspowner: number
  nspacl: string | null
}

/**
 * @name pg_class
 * @type table
 */
interface PgClass {
  oid: number
  relname: string
  relnamespace: number
  relkind: string
  reltuples: number
}

/**
 * @name pg_index
 * @type table
 */
interface PgIndex {
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
interface PgAttribute {
  attrelid: number
  attnum: number
  attname: string
}
