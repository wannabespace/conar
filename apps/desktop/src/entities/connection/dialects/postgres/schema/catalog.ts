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
  pg_am: PgAm
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
  reltype: number
  reloftype: number
  relowner: number
  relam: number
  relfilenode: number
  reltablespace: number
  relpages: number
  reltuples: number
  relallvisible: number
  reltoastrelid: number
  relhasindex: boolean
  relisshared: boolean
  relpersistence: string
  relkind: string
  relnatts: number
  relchecks: number
  relhasrules: boolean
  relhastriggers: boolean
  relhassubclass: boolean
  relrowsecurity: boolean
  relforcerowsecurity: boolean
  relispopulated: boolean
  relreplident: string
  relispartition: boolean
  relrewrite: number
  relfrozenxid: string
  relminmxid: string
  relacl: string | null
  relpartbound: null
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

/**
 * @name pg_am
 * @type table
 */
interface PgAm {
  oid: number
  amname: string
  amhandler: string
  amtype: string
}
