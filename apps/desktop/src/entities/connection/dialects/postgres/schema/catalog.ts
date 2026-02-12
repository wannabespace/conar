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
  pg_policy: PgPolicy
}

/**
 * @name pg_policy
 * @type table
 */
interface PgPolicy {
  oid: number
  polname: string
  polrelid: number
  polcmd: 'r' | 'a' | 'w' | 'd' | '*'
  polpermissive: boolean
  polroles: unknown
  polqual: unknown
  polwithcheck: unknown
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
