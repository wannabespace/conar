/**
 * @name pg_catalog
 * @type schema
 */
export interface PgCatalog {
  pg_namespace: PgNamespace
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
 * @name pg_namespace
 * @type table
 */
interface PgNamespace {
  oid: number
  nspname: string
  nspowner: number
  nspacl: string | null
}
