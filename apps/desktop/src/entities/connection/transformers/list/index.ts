import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { ValueTransformer } from '../types'
import { createClickHouseListTransformer } from './clickhouse'
import { createMysqlListTransformer } from './mysql'
import { createPostgresListTransformer } from './postgres'

const listTransformers: Partial<Record<ConnectionType, () => ValueTransformer>> = {
  postgres: createPostgresListTransformer,
  mysql: createMysqlListTransformer,
  clickhouse: createClickHouseListTransformer,
  // MSSQL has no array type — falls back to the default (postgres-style) parser
}

/**
 * Create a list transformer for the given DB engine.
 * Falls back to Postgres-style for MSSQL (no native array type).
 */
export function createListTransformer(connectionType: ConnectionType): ValueTransformer {
  const factory = listTransformers[connectionType]
  return factory ? factory() : createPostgresListTransformer()
}
