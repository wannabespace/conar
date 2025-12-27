import type { PgNamespace } from './indexes'

/**
 * @name pg_catalog
 * @type schema
 */
export interface PgCatalog {
  pg_namespace: PgNamespace
}
