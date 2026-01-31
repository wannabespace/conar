/**
 * @name pg_catalog
 * @type schema
 */
export interface PgCatalog {
  pg_namespace: PgNamespace
  pg_class: PgClass
  pg_index: PgIndex
  pg_attribute: PgAttribute
  pg_settings: PgSettings
  pg_database: PgDatabase
}

/**
 * @name pg_database
 * @type table
 */
interface PgDatabase {
  datname: string
  datistemplate: boolean
}

/**
 * @name pg_settings
 * @type table
 */
interface PgSettings {
  name: string
  setting: string
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
