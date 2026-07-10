import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { Column } from '../../components'
import type { ValueTransformer } from '../create-transformer'
import { createClickHouseListTransformer } from './clickhouse'
import { createMysqlListTransformer } from './mysql'
import { createPostgresListTransformer } from './postgres'

// eslint-disable-next-line ts/no-explicit-any
const listTransformers: Partial<Record<ConnectionType, (column: Column) => ValueTransformer<any>>> = {
  postgres: createPostgresListTransformer,
  mysql: createMysqlListTransformer,
  clickhouse: createClickHouseListTransformer,
}

// eslint-disable-next-line ts/no-explicit-any
export function createListTransformer(connectionType: ConnectionType, column: Column): ValueTransformer<any> {
  const factory = listTransformers[connectionType]
  return factory ? factory(column) : createPostgresListTransformer(column)
}
