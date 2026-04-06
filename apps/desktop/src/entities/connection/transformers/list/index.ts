import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { ValueTransformer } from '../types'
import { createClickHouseListTransformer } from './clickhouse'
import { createMysqlListTransformer } from './mysql'
import { createPostgresListTransformer } from './postgres'

const listTransformers: Partial<Record<ConnectionType, () => ValueTransformer>> = {
  postgres: createPostgresListTransformer,
  mysql: createMysqlListTransformer,
  clickhouse: createClickHouseListTransformer,
}

export function createListTransformer(connectionType: ConnectionType): ValueTransformer {
  const factory = listTransformers[connectionType]
  return factory ? factory() : createPostgresListTransformer()
}
