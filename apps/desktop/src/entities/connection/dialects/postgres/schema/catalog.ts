/**
 * @name pg_catalog
 * @type schema
 */
export interface PgCatalog {
  pg_namespace: PgNamespace
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
